import type { LngLat } from '$lib/types/course';
import { FEET_PER_METER, metersPerDegLat, metersPerDegLng } from './geo';

// A local planar frame in feet around an origin, so path analysis can do
// Euclidean geometry regardless of map vs image mode. Equirectangular at the
// origin latitude — error is negligible at course scale (< 1 mile).
//
// handedness: +1 when y grows "up" (map mode, north), -1 when y grows down
// (image mode, screen pixels). Turn-direction signs must be multiplied by it.
export interface PlanarFrame {
	toFeet(p: LngLat): [number, number];
	fromFeet(xy: [number, number]): LngLat;
	handedness: 1 | -1;
}

export function makeFrame(
	origin: LngLat,
	mode: 'map' | 'image',
	feetPerPixel?: number
): PlanarFrame | null {
	if (mode === 'image') {
		if (!feetPerPixel) return null;
		const [ox, oy] = origin;
		return {
			toFeet: (p) => [(p[0] - ox) * feetPerPixel, (p[1] - oy) * feetPerPixel],
			fromFeet: (xy) => [ox + xy[0] / feetPerPixel, oy + xy[1] / feetPerPixel],
			handedness: -1
		};
	}

	const [olng, olat] = origin;
	const feetPerDegLat = metersPerDegLat() * FEET_PER_METER;
	const feetPerDegLng = metersPerDegLng(olat) * FEET_PER_METER;
	return {
		toFeet: (p) => [(p[0] - olng) * feetPerDegLng, (p[1] - olat) * feetPerDegLat],
		fromFeet: (xy) => [olng + xy[0] / feetPerDegLng, olat + xy[1] / feetPerDegLat],
		handedness: 1
	};
}
