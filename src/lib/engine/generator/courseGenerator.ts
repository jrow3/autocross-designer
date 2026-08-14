import type { ConeData, HazardMarkerData, LngLat, OutlineSegmentData, WaypointData } from '$lib/types/course';
import { makeFrame, type PlanarFrame } from '../planarFrame';
import { samplePath, classifySegments, type SampledPath } from '../pathAnalysis';
import { distanceFeet } from '../geo';
import { pointToPolylineFeet } from '../geoDistance';
import { pointInPolygon } from '../polygonEngine';
import { mulberry32, jitter } from './prng';

export interface GeneratorOptions {
	seed: number;
	eventType: 'regional' | 'national';
	biggerSweeper: boolean;
	widerGates: boolean;
	leanMode: boolean;
}

export interface GeneratedCourse {
	cones: Omit<ConeData, 'id'>[];
	stats: { coneCount: number; gateCount: number; slalomCount: number; sweeperCount: number };
	warnings: string[];
}

interface Tuning {
	slalomMinLenFt: number;
	slalomSpacingFt: number;
	gateEveryFt: number;
	gateWidthFt: number;
	finishRunoutFt: number;
}

function tuningFor(options: GeneratorOptions): Tuning {
	const national = options.eventType === 'national';
	const lean = options.leanMode ? 1.5 : 1;
	return {
		slalomMinLenFt: options.leanMode ? 300 : 220,
		slalomSpacingFt: (national ? 70 : 60) * lean,
		gateEveryFt: (national ? 110 : 90) * lean,
		gateWidthFt: options.widerGates ? 25 : 20,
		finishRunoutFt: 150
	};
}

export function generateCourse(
	waypoints: WaypointData[],
	options: GeneratorOptions,
	mode: 'map' | 'image',
	feetPerPixel: number | undefined,
	obstacles: { hazards: HazardMarkerData[]; outline: OutlineSegmentData[] }
): GeneratedCourse | null {
	if (waypoints.length < 2) return null;
	const coords = waypoints.map((wp) => wp.lngLat);
	const frame = makeFrame(coords[0], mode, feetPerPixel);
	if (!frame) return null;
	const path = samplePath(coords, frame, { spacingFt: 2 });
	if (!path) return null;

	const rng = mulberry32(options.seed);
	const tuning = tuningFor(options);
	const stats = { coneCount: 0, gateCount: 0, slalomCount: 0, sweeperCount: 0 };
	const warnings: string[] = [];
	const placed: { xy: [number, number]; cone: Omit<ConeData, 'id'> }[] = [];

	const idxAtArc = (s: number): number => {
		// samples are ~2 ft apart; clamp into range
		return Math.max(0, Math.min(path.pts.length - 1, Math.round(s / (path.s[1] - path.s[0] || 2))));
	};

	const tangentAt = (i: number): [number, number] => {
		const a = path.pts[Math.max(0, i - 1)];
		const b = path.pts[Math.min(path.pts.length - 1, i + 1)];
		const dx = b[0] - a[0];
		const dy = b[1] - a[1];
		const len = Math.hypot(dx, dy) || 1;
		return [dx / len, dy / len];
	};

	// left normal in frame coordinates
	const normalAt = (i: number): [number, number] => {
		const [tx, ty] = tangentAt(i);
		return [-ty, tx];
	};

	const suppressedFromFt = path.lengthFt - tuning.finishRunoutFt;

	const addCone = (i: number, offsetDir: [number, number], offsetFt: number, type: ConeData['type']): void => {
		const p = path.pts[i];
		const xy: [number, number] = [p[0] + offsetDir[0] * offsetFt, p[1] + offsetDir[1] * offsetFt];
		placed.push({ xy, cone: { type, lngLat: frame.fromFeet(xy), lockedTargetId: null } });
	};

	const addGate = (i: number, widthFt: number, type: ConeData['type'] = 'regular'): void => {
		const n = normalAt(i);
		addCone(i, n, widthFt / 2, type);
		addCone(i, [-n[0], -n[1]], widthFt / 2, type);
		if (type === 'regular') stats.gateCount++;
	};

	// start and finish gates
	addGate(0, 20, 'start-cone');
	addGate(path.pts.length - 1, 20, 'finish-cone');

	const segments = classifySegments(path);
	for (const segment of segments) {
		const segStartFt = path.s[segment.startIdx];
		const segLenFt = segment.lengthFt;

		if (segment.kind === 'straight') {
			if (segLenFt >= tuning.slalomMinLenFt) {
				// centered slalom on the straight, plus entry/exit gates
				const spacing = tuning.slalomSpacingFt;
				const usable = segLenFt * 0.8;
				const count = Math.max(3, Math.floor(usable / spacing) + 1);
				const startFt = segStartFt + (segLenFt - (count - 1) * spacing) / 2;
				for (let k = 0; k < count; k++) {
					const at = startFt + k * jitter(rng, spacing, 8);
					if (at > suppressedFromFt || at < 30) continue;
					addCone(idxAtArc(at), [0, 0], 0, 'regular');
				}
				stats.slalomCount++;
				if (segStartFt > 30 && segStartFt < suppressedFromFt) addGate(segment.startIdx, tuning.gateWidthFt);
				if (path.s[segment.endIdx] < suppressedFromFt) addGate(segment.endIdx, tuning.gateWidthFt);
			} else {
				// gates along the short straight
				for (let at = segStartFt + tuning.gateEveryFt; at < segStartFt + segLenFt; at += tuning.gateEveryFt) {
					if (at > suppressedFromFt || at < 30) continue;
					addGate(idxAtArc(at), tuning.gateWidthFt);
				}
			}
			continue;
		}

		// corner: entry/exit gates plus inside apex (or sweeper ring)
		let apexIdx = segment.startIdx;
		for (let i = segment.startIdx; i <= segment.endIdx; i++) {
			if (path.radiusFt[i] < path.radiusFt[apexIdx]) apexIdx = i;
		}
		// direction toward the curvature center, in frame coordinates
		const insideSign = segment.turnSign * frame.handedness || 1;
		const insideAt = (i: number): [number, number] => {
			const n = normalAt(i);
			return [n[0] * insideSign, n[1] * insideSign];
		};

		if (options.biggerSweeper && segment.arcDeg >= 150) {
			for (let at = segStartFt; at <= segStartFt + segLenFt; at += 25) {
				if (at > suppressedFromFt) continue;
				const i = idxAtArc(at);
				addCone(i, insideAt(i), 2, 'regular');
			}
			stats.sweeperCount++;
		} else if (path.s[apexIdx] <= suppressedFromFt) {
			addCone(apexIdx, insideAt(apexIdx), 2, 'regular');
			addCone(apexIdx, insideAt(apexIdx), 5, 'pointer');
		}
		if (segStartFt > 30 && segStartFt < suppressedFromFt) addGate(segment.startIdx, tuning.gateWidthFt);
	}

	// validation sweep: hazards, closed outline, dedupe
	const outlinePolygon = closedOutlinePolygon(obstacles.outline, mode, feetPerPixel);
	const kept: typeof placed = [];
	let droppedHazard = 0;
	let droppedOutline = 0;
	let droppedDupes = 0;
	for (const item of placed) {
		const inHazard = obstacles.hazards.some((h) => {
			const d =
				h.type === 'point'
					? distanceFeet(item.cone.lngLat, h.coordinates[0], mode, feetPerPixel)
					: pointToPolylineFeet(item.cone.lngLat, h.coordinates, mode, feetPerPixel);
			return d != null && d < h.bufferFeet;
		});
		if (inHazard) {
			droppedHazard++;
			continue;
		}
		if (outlinePolygon && !pointInPolygon(item.cone.lngLat, outlinePolygon)) {
			droppedOutline++;
			continue;
		}
		const dupe = kept.some(
			(k) => k.cone.type === item.cone.type && Math.hypot(k.xy[0] - item.xy[0], k.xy[1] - item.xy[1]) < 4
		);
		if (dupe) {
			droppedDupes++;
			continue;
		}
		kept.push(item);
	}
	if (droppedHazard > 0) warnings.push(`${droppedHazard} cones dropped: inside a hazard buffer.`);
	if (droppedOutline > 0) warnings.push(`${droppedOutline} cones dropped: outside the course edge.`);
	if (droppedDupes > 0) warnings.push(`${droppedDupes} overlapping cones merged.`);

	const cones = kept.map((k) => k.cone);
	stats.coneCount = cones.length;
	return { cones, stats, warnings };
}

// The outline counts as a boundary only when its segments chain into a loop.
function closedOutlinePolygon(
	outline: OutlineSegmentData[],
	mode: 'map' | 'image',
	feetPerPixel?: number
): LngLat[] | null {
	if (outline.length < 3) return null;
	const polygon: LngLat[] = [];
	for (const seg of outline) {
		// sample each quadratic Bezier at 8 points
		for (let t = 0; t < 1; t += 1 / 8) {
			const mt = 1 - t;
			polygon.push([
				mt * mt * seg.p1[0] + 2 * mt * t * seg.cp[0] + t * t * seg.p2[0],
				mt * mt * seg.p1[1] + 2 * mt * t * seg.cp[1] + t * t * seg.p2[1]
			]);
		}
	}
	const first = outline[0].p1;
	const last = outline[outline.length - 1].p2;
	const gap = distanceFeet(first, last, mode, feetPerPixel);
	if (gap == null || gap > 5) return null;
	return polygon;
}
