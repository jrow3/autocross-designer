import type { ConeType } from '$lib/types/course';

export const CONE_COLORS: Record<ConeType, string> = {
	regular: '#f97316',
	pointer: '#ef4444',
	'start-cone': '#22c55e',
	'finish-cone': '#ffffff',
	trailer: '#6b7280',
	'staging-grid': '#f97316'
};

export function coneColor(type: string): string {
	return CONE_COLORS[type as ConeType] ?? CONE_COLORS.regular;
}

export const WORKER_COLOR = '#7c3aed';
export const NOTE_COLOR = '#0ea5e9';
