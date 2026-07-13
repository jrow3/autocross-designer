import type { Tool } from '$lib/stores/toolStore.svelte';

export const TOOL_SHORTCUTS: Partial<Record<Tool, string>> = {
	regular: '1',
	pointer: '2',
	'start-cone': '3',
	'finish-cone': '4',
	gate: '5',
	slalom: '6',
	drivingline: '7',
	measure: '8',
	note: '9',
	courseoutline: 'O',
	trailer: 'T',
	worker: 'W',
	scale: 'S',
	select: 'Esc',
	'staging-area': 'a',
	'worker-zone': 'z',
	'hazard-point': 'h',
	'hazard-line': 'j'
};

// Single-character shortcuts only — 'Esc' (select) is handled explicitly in +layout.
export const KEY_TOOL_MAP: Record<string, Tool> = Object.fromEntries(
	(Object.entries(TOOL_SHORTCUTS) as [Tool, string][])
		.filter(([, key]) => key.length === 1)
		.map(([tool, key]) => [key.toLowerCase(), tool])
);
