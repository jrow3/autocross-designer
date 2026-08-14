import type { LngLat } from '$lib/types/course';
import { catmullRomSpline } from './catmullRom';
import type { PlanarFrame } from './planarFrame';

export interface SampledPath {
	pts: [number, number][]; // planar feet, arc-length spaced
	lngLats: LngLat[]; // the same points mapped back for rendering/findings
	s: number[]; // cumulative arc length, feet
	radiusFt: number[]; // Infinity on straights
	turnSign: number[]; // -1 | 0 | +1, handedness-corrected (+1 = left in map mode)
	lengthFt: number;
}

export interface PathSegment {
	kind: 'straight' | 'corner';
	startIdx: number;
	endIdx: number;
	lengthFt: number;
	minRadiusFt: number;
	turnSign: number;
	arcDeg: number;
}

const MAX_SAMPLES = 5000;
const CURVATURE_WINDOW = 2;

export function samplePath(
	waypoints: LngLat[],
	frame: PlanarFrame,
	opts: { spacingFt?: number; segmentsPerSpan?: number } = {}
): SampledPath | null {
	if (waypoints.length < 2) return null;
	const segmentsPerSpan = opts.segmentsPerSpan ?? 20;

	const dense = catmullRomSpline(waypoints, segmentsPerSpan).map((p) => frame.toFeet(p));

	// Cumulative length of the dense polyline
	const denseS: number[] = [0];
	for (let i = 1; i < dense.length; i++) {
		denseS.push(denseS[i - 1] + Math.hypot(dense[i][0] - dense[i - 1][0], dense[i][1] - dense[i - 1][1]));
	}
	const total = denseS[denseS.length - 1];
	if (total <= 0) return null;

	let spacingFt = opts.spacingFt ?? 3;
	if (total / spacingFt > MAX_SAMPLES) spacingFt = total / MAX_SAMPLES;

	// Arc-length resample by linear interpolation between dense samples
	const pts: [number, number][] = [];
	const s: number[] = [];
	let cursor = 0;
	for (let target = 0; target <= total; target += spacingFt) {
		while (cursor < denseS.length - 2 && denseS[cursor + 1] < target) cursor++;
		const span = denseS[cursor + 1] - denseS[cursor];
		const t = span > 0 ? (target - denseS[cursor]) / span : 0;
		const a = dense[cursor];
		const b = dense[cursor + 1];
		pts.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
		s.push(target);
	}
	const last = dense[dense.length - 1];
	if (s[s.length - 1] < total) {
		pts.push([last[0], last[1]]);
		s.push(total);
	}

	// Curvature via circumradius of (p[i-k], p[i], p[i+k]); signed by cross product
	const n = pts.length;
	const radiusFt: number[] = new Array(n).fill(Infinity);
	const rawSign: number[] = new Array(n).fill(0);
	const k = CURVATURE_WINDOW;
	for (let i = k; i < n - k; i++) {
		const p1 = pts[i - k];
		const p2 = pts[i];
		const p3 = pts[i + k];
		const a = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
		const b = Math.hypot(p3[0] - p2[0], p3[1] - p2[1]);
		const c = Math.hypot(p3[0] - p1[0], p3[1] - p1[1]);
		const cross = (p2[0] - p1[0]) * (p3[1] - p1[1]) - (p2[1] - p1[1]) * (p3[0] - p1[0]);
		const area = Math.abs(cross) / 2;
		if (area > 1e-6) {
			radiusFt[i] = (a * b * c) / (4 * area);
			rawSign[i] = Math.sign(cross) * frame.handedness;
		}
	}

	// 3-tap median filter over radius to kill spline-joint spikes
	const filtered = radiusFt.slice();
	for (let i = 1; i < n - 1; i++) {
		const three = [radiusFt[i - 1], radiusFt[i], radiusFt[i + 1]].sort((x, y) => x - y);
		filtered[i] = three[1];
	}

	return {
		pts,
		lngLats: pts.map((p) => frame.fromFeet(p)),
		s,
		radiusFt: filtered,
		turnSign: rawSign,
		lengthFt: total
	};
}

export function classifySegments(
	path: SampledPath,
	opts: { straightRadiusFt?: number; minSegmentFt?: number } = {}
): PathSegment[] {
	const enterRadius = opts.straightRadiusFt ?? 250;
	const exitRadius = enterRadius * 1.2; // hysteresis
	const minSegmentFt = opts.minSegmentFt ?? 40;
	const n = path.pts.length;
	if (n < 2) return [];

	// First pass: raw runs with hysteresis
	const kinds: ('straight' | 'corner')[] = [];
	let inCorner = false;
	for (let i = 0; i < n; i++) {
		const r = path.radiusFt[i];
		if (inCorner) {
			if (r > exitRadius) inCorner = false;
		} else {
			if (r < enterRadius) inCorner = true;
		}
		kinds.push(inCorner ? 'corner' : 'straight');
	}

	const runs: { kind: 'straight' | 'corner'; startIdx: number; endIdx: number }[] = [];
	let start = 0;
	for (let i = 1; i <= n; i++) {
		if (i === n || kinds[i] !== kinds[start]) {
			runs.push({ kind: kinds[start], startIdx: start, endIdx: i - 1 });
			start = i;
		}
	}

	// Merge runs shorter than minSegmentFt into the previous run
	const merged: typeof runs = [];
	for (const run of runs) {
		const len = path.s[run.endIdx] - path.s[run.startIdx];
		const prev = merged[merged.length - 1];
		if (prev && len < minSegmentFt) {
			prev.endIdx = run.endIdx;
		} else if (prev && prev.kind === run.kind) {
			prev.endIdx = run.endIdx;
		} else {
			merged.push({ ...run });
		}
	}

	return merged.map((run) => {
		let minRadius = Infinity;
		let signSum = 0;
		let arcDeg = 0;
		for (let i = run.startIdx; i <= run.endIdx; i++) {
			if (path.radiusFt[i] < minRadius) minRadius = path.radiusFt[i];
			signSum += path.turnSign[i];
			if (Number.isFinite(path.radiusFt[i]) && i > run.startIdx) {
				const ds = path.s[i] - path.s[i - 1];
				arcDeg += ((ds / path.radiusFt[i]) * 180) / Math.PI;
			}
		}
		return {
			kind: run.kind,
			startIdx: run.startIdx,
			endIdx: run.endIdx,
			lengthFt: path.s[run.endIdx] - path.s[run.startIdx],
			minRadiusFt: minRadius,
			turnSign: Math.sign(signSum),
			arcDeg
		};
	});
}
