import type { LngLat, WaypointData } from '$lib/types/course';
import { makeFrame } from './planarFrame';

const DEFAULT_SPACING_FT = 50;
const FALLBACK_WAYPOINTS = 14;
const MAX_WAYPOINTS = 60;

// Chain multiple freehand strokes into one path: greedy nearest-endpoint
// ordering seeded with the first-drawn stroke, flipping strokes (and the seed)
// so ends meet ends. Users usually draw segments in course order — this keeps
// that order and just orients and joins them.
export function stitchSketches(
	strokes: LngLat[][],
	mode: 'map' | 'image',
	feetPerPixel?: number
): LngLat[] {
	const usable = strokes.filter((s) => s.length >= 2);
	if (usable.length === 0) return [];
	if (usable.length === 1) return usable[0];

	const frame = makeFrame(usable[0][0], mode, feetPerPixel);
	const toXY = (p: LngLat): [number, number] => (frame ? frame.toFeet(p) : [p[0], p[1]]);
	const dist = (a: LngLat, b: LngLat): number => {
		const [ax, ay] = toXY(a);
		const [bx, by] = toXY(b);
		return Math.hypot(bx - ax, by - ay);
	};
	const nearestTo = (point: LngLat, pool: LngLat[][]): number =>
		Math.min(...pool.flatMap((s) => [dist(point, s[0]), dist(point, s[s.length - 1])]));

	let chain = [...usable[0]];
	const remaining = usable.slice(1);

	// If the rest of the course connects better to the seed's start, it was drawn backwards.
	if (nearestTo(chain[0], remaining) < nearestTo(chain[chain.length - 1], remaining)) {
		chain = chain.reverse();
	}

	while (remaining.length > 0) {
		const tail = chain[chain.length - 1];
		let bestIdx = 0;
		let bestReversed = false;
		let bestDist = Infinity;
		remaining.forEach((stroke, i) => {
			const dStart = dist(tail, stroke[0]);
			const dEnd = dist(tail, stroke[stroke.length - 1]);
			if (dStart < bestDist) {
				bestDist = dStart;
				bestIdx = i;
				bestReversed = false;
			}
			if (dEnd < bestDist) {
				bestDist = dEnd;
				bestIdx = i;
				bestReversed = true;
			}
		});
		const [next] = remaining.splice(bestIdx, 1);
		chain.push(...(bestReversed ? [...next].reverse() : next));
	}
	return chain;
}

// Turn a dense freehand sketch stroke into evenly spaced driving-line waypoints.
// Arc-length resampled in real feet where the frame allows; falls back to
// index-based downsampling when the image scale is uncalibrated.
export function sketchToWaypoints(
	points: LngLat[],
	mode: 'map' | 'image',
	feetPerPixel?: number,
	spacingFt = DEFAULT_SPACING_FT
): WaypointData[] | null {
	if (points.length < 2) return null;

	const frame = makeFrame(points[0], mode, feetPerPixel);
	if (!frame) {
		// no real-world scale: keep the shape, thin the points
		const step = Math.max(1, Math.floor(points.length / FALLBACK_WAYPOINTS));
		const thinned = points.filter((_, i) => i % step === 0);
		if (thinned[thinned.length - 1] !== points[points.length - 1]) {
			thinned.push(points[points.length - 1]);
		}
		return thinned.map((lngLat) => ({ lngLat }));
	}

	const planar = points.map((p) => frame.toFeet(p));
	const s: number[] = [0];
	for (let i = 1; i < planar.length; i++) {
		s.push(s[i - 1] + Math.hypot(planar[i][0] - planar[i - 1][0], planar[i][1] - planar[i - 1][1]));
	}
	const total = s[s.length - 1];
	if (total <= 0) return null;

	let spacing = spacingFt;
	if (total / spacing > MAX_WAYPOINTS) spacing = total / MAX_WAYPOINTS;

	const waypoints: WaypointData[] = [];
	let cursor = 0;
	for (let target = 0; target < total; target += spacing) {
		while (cursor < s.length - 2 && s[cursor + 1] < target) cursor++;
		const span = s[cursor + 1] - s[cursor];
		const t = span > 0 ? (target - s[cursor]) / span : 0;
		const a = planar[cursor];
		const b = planar[cursor + 1];
		waypoints.push({ lngLat: frame.fromFeet([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]) });
	}
	waypoints.push({ lngLat: points[points.length - 1] });
	return waypoints.length >= 2 ? waypoints : null;
}
