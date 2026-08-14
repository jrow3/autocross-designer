import type { LngLat, WaypointData } from '$lib/types/course';
import type { CourseTemplate } from '$lib/config/courseTemplates';
import { makeFrame } from './planarFrame';

export function instantiateTemplate(
	template: CourseTemplate,
	center: LngLat,
	mode: 'map' | 'image',
	feetPerPixel?: number
): WaypointData[] | null {
	const frame = makeFrame(center, mode, feetPerPixel);
	if (!frame) return null;
	return template.waypointOffsetsFt.map((xy) => ({ lngLat: frame.fromFeet(xy) }));
}
