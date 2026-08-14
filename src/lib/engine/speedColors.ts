import { SPEED_RAMP } from '$lib/config/palette';
import type { SimResult } from './speedSim';

// Interpolate the ramp at t in [0,1]
export function speedColor(t: number): string {
	const clamped = Math.max(0, Math.min(1, t));
	const scaled = clamped * (SPEED_RAMP.length - 1);
	const lower = Math.floor(scaled);
	const upper = Math.min(lower + 1, SPEED_RAMP.length - 1);
	const frac = scaled - lower;
	return mixHex(SPEED_RAMP[lower], SPEED_RAMP[upper], frac);
}

function mixHex(a: string, b: string, t: number): string {
	const pa = parseInt(a.slice(1), 16);
	const pb = parseInt(b.slice(1), 16);
	const channel = (shift: number) => {
		const ca = (pa >> shift) & 0xff;
		const cb = (pb >> shift) & 0xff;
		return Math.round(ca + (cb - ca) * t);
	};
	const rgb = (channel(16) << 16) | (channel(8) << 8) | channel(0);
	return `#${rgb.toString(16).padStart(6, '0')}`;
}

// Mapbox line-gradient stops: [progress, color, progress, color, ...]
// Progress values are strictly increasing in [0,1].
export function gradientStops(result: SimResult, maxStops = 64): (number | string)[] {
	const points = result.points;
	if (points.length === 0 || result.lengthFt <= 0) return [];

	const speedMin = Math.min(...points.map((p) => p.speedMph));
	const speedMax = Math.max(...points.map((p) => p.speedMph));
	const range = Math.max(speedMax - speedMin, 1);

	const step = Math.max(1, Math.ceil(points.length / maxStops));
	const stops: (number | string)[] = [];
	let lastProgress = -1;
	for (let i = 0; i < points.length; i += step) {
		const progress = points[i].sFt / result.lengthFt;
		if (progress <= lastProgress) continue;
		stops.push(progress, speedColor((points[i].speedMph - speedMin) / range));
		lastProgress = progress;
	}
	// Always land the final point
	const last = points[points.length - 1];
	if (last.sFt / result.lengthFt > lastProgress) {
		stops.push(1, speedColor((last.speedMph - speedMin) / range));
	}
	return stops;
}
