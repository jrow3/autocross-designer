import type { CourseData } from '$lib/types/course';
import { haversineFeet } from './geo';
import { makeFrame } from './planarFrame';
import { samplePath } from './pathAnalysis';

export function drivingLineLengthFeet(course: CourseData): number {
	const waypoints = course.drivingLine;
	let total = 0;
	for (let i = 1; i < waypoints.length; i++) {
		total += haversineFeet(waypoints[i - 1].lngLat, waypoints[i].lngLat);
	}
	return total;
}

// Length of the smoothed (rendered) driving line — the straight-segment sum
// above undercounts through corners. Mode-aware; null when uncalibrated.
export function splineLengthFeet(
	course: CourseData,
	mode: 'map' | 'image',
	feetPerPixel?: number
): number | null {
	const coords = course.drivingLine.map((wp) => wp.lngLat);
	if (coords.length < 2) return 0;
	const frame = makeFrame(coords[0], mode, feetPerPixel);
	if (!frame) return null;
	const path = samplePath(coords, frame);
	return path ? path.lengthFt : 0;
}
