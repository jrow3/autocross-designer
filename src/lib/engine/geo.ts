import type { LngLat } from '$lib/types/course';

// Single earth model for all geodesy. Mean earth radius (spherical approximation).
export const EARTH_RADIUS_M = 6371000;
export const FEET_PER_METER = 1 / 0.3048;

// Web-Mercator meters-per-pixel at zoom 0 on a 512px tile (40075016.686 / 512).
// A tile-math constant, not an alternate earth model — only for screen-pixel conversions.
const WEB_MERCATOR_M_PER_PX_Z0 = 78271.517;

function toRad(deg: number): number {
	return deg * Math.PI / 180;
}

export function haversineMeters(a: LngLat, b: LngLat): number {
	const [lon1, lat1] = a;
	const [lon2, lat2] = b;
	const dLat = toRad(lat2 - lat1);
	const dLon = toRad(lon2 - lon1);
	const h =
		Math.sin(dLat / 2) ** 2 +
		Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
	return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function haversineFeet(a: LngLat, b: LngLat): number {
	return haversineMeters(a, b) * FEET_PER_METER;
}

function pixelDistFeet(a: LngLat, b: LngLat, feetPerPixel: number): number {
	const dx = a[0] - b[0];
	const dy = a[1] - b[1];
	return Math.sqrt(dx * dx + dy * dy) * feetPerPixel;
}

export function distanceFeet(
	a: LngLat,
	b: LngLat,
	mode: 'map' | 'image',
	feetPerPixel?: number
): number | null {
	if (mode === 'image') {
		if (feetPerPixel == null) return null;
		return pixelDistFeet(a, b, feetPerPixel);
	}
	return haversineFeet(a, b);
}

export function metersPerDegLat(): number {
	return (EARTH_RADIUS_M * Math.PI) / 180;
}

export function metersPerDegLng(lat: number): number {
	return metersPerDegLat() * Math.cos(toRad(lat));
}

export function feetToDegreesLat(feet: number): number {
	return (feet / FEET_PER_METER) / metersPerDegLat();
}

export function feetToDegreesLng(feet: number, lat: number): number {
	return (feet / FEET_PER_METER) / metersPerDegLng(lat);
}

export function feetToLngLatOffset(
	origin: LngLat,
	angleDeg: number,
	feet: number
): LngLat {
	const angleRad = toRad(angleDeg);
	const dLat = feetToDegreesLat(feet * Math.cos(angleRad));
	const dLng = feetToDegreesLng(feet * Math.sin(angleRad), origin[1]);
	return [origin[0] + dLng, origin[1] + dLat];
}

export function feetToPixelOffset(
	origin: LngLat,
	angleDeg: number,
	feet: number,
	feetPerPixel: number
): LngLat {
	const pixels = feet / feetPerPixel;
	const angleRad = toRad(angleDeg);
	return [origin[0] + pixels * Math.sin(angleRad), origin[1] - pixels * Math.cos(angleRad)];
}

export function metersPerPixel(lat: number, zoom: number): number {
	return (WEB_MERCATOR_M_PER_PX_Z0 * Math.cos(toRad(lat))) / Math.pow(2, zoom);
}
