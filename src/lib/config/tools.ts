import type { Tool } from '$lib/stores/toolStore.svelte';

export type ToolMode = 'venue' | 'design' | 'annotate' | 'universal';

export interface ToolDef {
	tool: Tool;
	label: string;
	description: string;
	mode: ToolMode;
	multiStep?: boolean;
	cursor?: string;
	imageModeOnly?: boolean;
	// Letter shortcut, consulted before the digit map. Universal tools use these;
	// mode tools may claim one when a digit is too obscure.
	hotkey?: string;
}

// Array order within a mode = toolbar order = digit shortcut (1-9).
export const TOOL_DEFS: ToolDef[] = [
	// --- venue ---
	{
		tool: 'hazard-point',
		label: 'Hazard spot',
		description: 'Click to mark a point hazard (pole, drain) with a safety buffer circle.',
		mode: 'venue',
		cursor: 'crosshair'
	},
	{
		tool: 'hazard-line',
		label: 'Hazard edge',
		description: 'Click two points to mark a line hazard (wall, curb) with a safety buffer.',
		mode: 'venue',
		multiStep: true,
		cursor: 'crosshair'
	},
	{
		tool: 'staging-area',
		label: 'Grid / staging',
		description: 'Click to outline the staging polygon; click the first point or press Enter to close.',
		mode: 'venue',
		multiStep: true,
		cursor: 'crosshair'
	},
	{
		tool: 'trailer',
		label: 'Trailer',
		description: 'Click to place a trailer marker you can resize and rotate.',
		mode: 'venue',
		cursor: 'crosshair'
	},
	{
		tool: 'scale',
		label: 'Calibrate scale',
		description: 'Click two points a known distance apart to calibrate the image scale.',
		mode: 'venue',
		multiStep: true,
		cursor: 'crosshair',
		imageModeOnly: true
	},
	// --- design ---
	{
		tool: 'sketch',
		label: 'Sketch',
		description: 'Drag to draw a freehand line; right-click drag to pan while sketching.',
		mode: 'design',
		cursor: 'crosshair'
	},
	{
		tool: 'regular',
		label: 'Cone',
		description: 'Click the map to place a standard orange cone.',
		mode: 'design',
		cursor: 'crosshair'
	},
	{
		tool: 'pointer',
		label: 'Pointer cone',
		description: 'Click to place a lime directional cone that points toward the nearest standard cone.',
		mode: 'design',
		cursor: 'crosshair'
	},
	{
		tool: 'start-cone',
		label: 'Start',
		description: 'Click to place the green cone marking the course start.',
		mode: 'design',
		cursor: 'crosshair'
	},
	{
		tool: 'finish-cone',
		label: 'Finish',
		description: 'Click to place the checkered cone marking the course finish.',
		mode: 'design',
		cursor: 'crosshair'
	},
	{
		tool: 'gate',
		label: 'Gate',
		description: 'Click the gate center, then a direction point — places both gate cones.',
		mode: 'design',
		multiStep: true,
		cursor: 'crosshair'
	},
	{
		tool: 'slalom',
		label: 'Slalom',
		description: 'Click the start and end points, then fine-tune cone count and spacing in a dialog.',
		mode: 'design',
		multiStep: true,
		cursor: 'crosshair'
	},
	{
		tool: 'courseoutline',
		label: 'Course edge',
		description: 'Click twice per segment to draw the course boundary; drag the control point to curve it.',
		mode: 'design',
		multiStep: true,
		cursor: 'crosshair'
	},
	{
		tool: 'worker-zone',
		label: 'Corner station',
		description: 'Click to outline a corner station coverage zone; click the first point or press Enter to close.',
		mode: 'design',
		multiStep: true,
		cursor: 'crosshair'
	},
	// --- annotate ---
	{
		tool: 'note',
		label: 'Note pin',
		description: 'Click the map to drop a numbered text note.',
		mode: 'annotate',
		cursor: 'crosshair'
	},
	{
		tool: 'drivingline',
		label: 'Driving line',
		description: 'Click to add waypoints; the line is smoothed automatically.',
		mode: 'annotate',
		cursor: 'crosshair'
	},
	{
		tool: 'worker',
		label: 'Worker station',
		description: 'Click to place a numbered worker station; right-click it to rename or delete.',
		mode: 'annotate',
		cursor: 'crosshair'
	},
	// --- universal ---
	{
		tool: 'select',
		label: 'Select',
		description: 'Click or drag a box to select elements, then drag to move or press Delete.',
		mode: 'universal',
		cursor: 'default',
		hotkey: 'v'
	},
	{
		tool: 'measure',
		label: 'Measure',
		description: 'Click two points to measure the distance in feet; clicks near cones snap to them.',
		mode: 'universal',
		multiStep: true,
		cursor: 'crosshair',
		hotkey: 'm'
	}
];
