import type { LngLat, WaypointData } from '$lib/types/course';
import type { CarProfile } from '$lib/config/carProfiles';
import { makeFrame } from './planarFrame';
import { samplePath, classifySegments, type PathSegment } from './pathAnalysis';

export interface SimPoint {
	lngLat: LngLat;
	sFt: number;
	speedMph: number;
	radiusFt: number;
}

export interface SimResult {
	points: SimPoint[];
	segments: PathSegment[];
	lengthFt: number;
	timeSec: number;
	avgSpeedMph: number;
	maxSpeedMph: number;
	minSpeedMph: number;
	maxSpeedLocation: LngLat;
	profileId: string;
}

const G = 32.174; // ft/s^2
const FTS_TO_MPH = 0.681818;
const MPH_TO_FTS = 1 / FTS_TO_MPH;
// Launch-ramp exclusion for the min-speed stat
const MIN_SPEED_AFTER_FT = 50;

export function simulate(
	waypoints: WaypointData[],
	profile: CarProfile,
	mode: 'map' | 'image',
	feetPerPixel?: number
): SimResult | null {
	if (waypoints.length < 2) return null;
	const coords = waypoints.map((wp) => wp.lngLat);
	const frame = makeFrame(coords[0], mode, feetPerPixel);
	if (!frame) return null;

	const path = samplePath(coords, frame);
	if (!path) return null;

	const n = path.pts.length;
	const vTop = profile.topSpeedMph * MPH_TO_FTS;

	// Corner-speed ceiling per point
	const vLim: number[] = new Array(n);
	for (let i = 0; i < n; i++) {
		const r = path.radiusFt[i];
		vLim[i] = Number.isFinite(r) ? Math.min(vTop, Math.sqrt(profile.latG * G * r)) : vTop;
	}

	// Forward pass: accel-limited from a standing start, power falls off linearly to vTop
	const v: number[] = new Array(n);
	v[0] = 0;
	for (let i = 1; i < n; i++) {
		const ds = path.s[i] - path.s[i - 1];
		const accel = profile.accelG0 * G * Math.max(0, 1 - v[i - 1] / vTop);
		v[i] = Math.min(vLim[i], Math.sqrt(v[i - 1] * v[i - 1] + 2 * accel * ds));
	}

	// Backward pass: braking-limited; the finish is crossed at speed (no clamp to 0)
	for (let i = n - 2; i >= 0; i--) {
		const ds = path.s[i + 1] - path.s[i];
		v[i] = Math.min(v[i], Math.sqrt(v[i + 1] * v[i + 1] + 2 * profile.brakeG * G * ds));
	}

	// Time: trapezoidal over segments, guarding the standing start
	let timeSec = 0;
	for (let i = 1; i < n; i++) {
		const ds = path.s[i] - path.s[i - 1];
		const vAvg = Math.max((v[i] + v[i - 1]) / 2, 1);
		timeSec += ds / vAvg;
	}

	let maxSpeed = 0;
	let maxIdx = 0;
	let minSpeed = Infinity;
	for (let i = 0; i < n; i++) {
		if (v[i] > maxSpeed) {
			maxSpeed = v[i];
			maxIdx = i;
		}
		if (path.s[i] > MIN_SPEED_AFTER_FT && v[i] < minSpeed) minSpeed = v[i];
	}
	if (!Number.isFinite(minSpeed)) minSpeed = 0;

	return {
		points: path.lngLats.map((lngLat, i) => ({
			lngLat,
			sFt: path.s[i],
			speedMph: v[i] * FTS_TO_MPH,
			radiusFt: path.radiusFt[i]
		})),
		segments: classifySegments(path),
		lengthFt: path.lengthFt,
		timeSec,
		avgSpeedMph: (path.lengthFt / timeSec) * FTS_TO_MPH,
		maxSpeedMph: maxSpeed * FTS_TO_MPH,
		minSpeedMph: minSpeed * FTS_TO_MPH,
		maxSpeedLocation: path.lngLats[maxIdx],
		profileId: profile.id
	};
}
