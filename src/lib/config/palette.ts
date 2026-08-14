import type { ConeType } from '$lib/types/course';

// Canonical domain colors — the single source of truth.
// app.css mirrors these as CSS vars (enforced by palette.test.ts); TS is canonical
// because Mapbox GL paint properties and 2D canvas exports cannot read CSS vars.

export const CONE_COLORS: Record<ConeType, string> = {
	regular: '#f97316',
	pointer: '#84cc16',
	lying: '#fb923c',
	'start-cone': '#22c55e',
	'finish-cone': '#ffffff',
	trailer: '#64748b',
	'staging-grid': '#64748b'
};

export function coneColor(type: string): string {
	return CONE_COLORS[type as ConeType] ?? CONE_COLORS.regular;
}

export const WORKER_COLOR = '#7c3aed';
export const NOTE_COLOR = '#0ea5e9';
export const MEASURE_COLOR = '#f472b6';
export const DRIVING_LINE_COLOR = '#60a5fa';
export const STAGING_COLOR = '#6495ed';
export const HAZARD_COLOR = '#e53e3e';
export const WORKER_ZONE_COLOR = '#ff6b6b';
export const BARRIER_COLOR = '#cbd5e1';

export const HANDLE_COLORS = {
	resize: '#3b82f6',
	rotate: '#f59e0b'
};

// Flow-analysis line ramp, slow → fast.
export const SPEED_RAMP = ['#3b82f6', '#22c55e', '#eab308', '#f97316', '#ef4444'];

// Categorical palette for worker-zone identity (data color, not UI chrome).
export const ZONE_COLORS: string[] = [
	WORKER_ZONE_COLOR,
	'#4ecdc4',
	'#a882ff',
	'#ffd93d',
	'#6bcb77',
	'#ff8fab',
	'#4cc9f0',
	'#f4a261',
	'#90be6d',
	'#c77dff'
];
