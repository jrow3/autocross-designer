import type { CourseData, LngLat } from '$lib/types/course';

export type Bounds = [LngLat, LngLat];

// Points more than 1 degree from the median cluster are treated as outliers
const OUTLIER_DEG = 1;

function collectPoints(course: CourseData): LngLat[] {
	const points: LngLat[] = [];
	for (const c of course.cones) points.push(c.lngLat);
	for (const wp of course.drivingLine) points.push(wp.lngLat);
	for (const m of course.measurements) { points.push(m.p1); points.push(m.p2); }
	for (const n of course.notes) points.push(n.lngLat);
	for (const w of course.workers) points.push(w.lngLat);
	for (const s of course.courseOutline) { points.push(s.p1); points.push(s.p2); }
	for (const sk of (course.sketches ?? [])) {
		for (const p of sk.points) points.push(p);
	}
	return points;
}

export function computeCourseBounds(course: CourseData): Bounds | null {
	const points = collectPoints(course);
	if (points.length === 0) return null;

	const lngs = points.map(p => p[0]).sort((a, b) => a - b);
	const lats = points.map(p => p[1]).sort((a, b) => a - b);
	const medLng = lngs[Math.floor(lngs.length / 2)];
	const medLat = lats[Math.floor(lats.length / 2)];
	const filtered = points.filter(p =>
		Math.abs(p[0] - medLng) < OUTLIER_DEG && Math.abs(p[1] - medLat) < OUTLIER_DEG
	);
	const fitPoints = filtered.length > 0 ? filtered : points;

	let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
	for (const [lng, lat] of fitPoints) {
		if (lng < minLng) minLng = lng;
		if (lng > maxLng) maxLng = lng;
		if (lat < minLat) minLat = lat;
		if (lat > maxLat) maxLat = lat;
	}

	return [[minLng, minLat], [maxLng, maxLat]];
}
