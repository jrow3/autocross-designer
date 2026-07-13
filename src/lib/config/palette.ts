// JS mirrors of app.css domain tokens — Mapbox GL paint properties cannot read CSS vars.
export const STAGING_COLOR = '#6495ed'; // mirrors --staging
export const HAZARD_COLOR = '#e53e3e'; // mirrors --hazard
export const WORKER_ZONE_COLOR = '#ff6b6b'; // mirrors --worker-zone

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
