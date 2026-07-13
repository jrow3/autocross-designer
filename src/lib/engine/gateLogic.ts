import type { LngLat } from '$lib/types/course';
import { FEET_PER_METER, metersPerDegLat, metersPerDegLng } from './geo';

const DIRECTIONAL_OFFSET_FEET = 3;

interface GateCones {
	left: LngLat;
	right: LngLat;
}

interface DirectionalCones {
	leftDirectional: LngLat;
	rightDirectional: LngLat;
}

export function computeGateCones(
	center: LngLat,
	direction: LngLat,
	gateWidthFeet: number,
	mode: 'map' | 'image',
	feetPerPixel?: number
): GateCones {
	const halfWidth = gateWidthFeet / 2;
	const dx = direction[0] - center[0];
	const dy = direction[1] - center[1];

	if (mode === 'image') {
		const scale = feetPerPixel ?? 1;
		const offsetPx = halfWidth / scale;
		const angle = Math.atan2(dy, dx);
		const perpX = Math.cos(angle + Math.PI / 2) * offsetPx;
		const perpY = Math.sin(angle + Math.PI / 2) * offsetPx;
		return {
			left: [center[0] + perpX, center[1] + perpY],
			right: [center[0] - perpX, center[1] - perpY]
		};
	}

	const mPerDegLng = metersPerDegLng(center[1]);
	const mPerDegLat = metersPerDegLat();
	const halfMeters = halfWidth / FEET_PER_METER;

	const dxM = dx * mPerDegLng;
	const dyM = dy * mPerDegLat;
	const angle = Math.atan2(dyM, dxM);

	const perpAngle = angle + Math.PI / 2;
	const offsetLng = (Math.cos(perpAngle) * halfMeters) / mPerDegLng;
	const offsetLat = (Math.sin(perpAngle) * halfMeters) / mPerDegLat;

	return {
		left: [center[0] + offsetLng, center[1] + offsetLat],
		right: [center[0] - offsetLng, center[1] - offsetLat]
	};
}

export function computeDirectionalCones(
	center: LngLat,
	direction: LngLat,
	gateWidthFeet: number,
	mode: 'map' | 'image',
	feetPerPixel?: number
): DirectionalCones {
	const extended = computeGateCones(
		center, direction, gateWidthFeet + 2 * DIRECTIONAL_OFFSET_FEET, mode, feetPerPixel
	);
	return {
		leftDirectional: extended.left,
		rightDirectional: extended.right
	};
}
