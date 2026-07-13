import type { CourseData } from '$lib/types/course';
import { haversineFeet } from './geo';

export function drivingLineLengthFeet(course: CourseData): number {
	const waypoints = course.drivingLine;
	let total = 0;
	for (let i = 1; i < waypoints.length; i++) {
		total += haversineFeet(waypoints[i - 1].lngLat, waypoints[i].lngLat);
	}
	return total;
}
