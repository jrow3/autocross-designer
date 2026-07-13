import type { Tool } from '$lib/stores/toolStore.svelte';

export interface ToolDef {
	tool: Tool;
	label: string;
	description: string;
	section: 'cones' | 'course' | 'areas' | 'safety' | 'annotations' | 'edit';
	multiStep?: boolean;
	cursor?: string;
	imageModeOnly?: boolean;
}

export const TOOL_DEFS: ToolDef[] = [
	{
		tool: 'regular',
		label: 'Regular',
		description: 'Click the map to place a standard orange cone.',
		section: 'cones',
		cursor: 'crosshair'
	},
	{
		tool: 'pointer',
		label: 'Pointer',
		description: 'Click to place a lime directional cone that points toward the nearest regular cone.',
		section: 'cones',
		cursor: 'crosshair'
	},
	{
		tool: 'start-cone',
		label: 'Start',
		description: 'Click to place the green cone marking the course start.',
		section: 'cones',
		cursor: 'crosshair'
	},
	{
		tool: 'finish-cone',
		label: 'Finish',
		description: 'Click to place the checkered cone marking the course finish.',
		section: 'cones',
		cursor: 'crosshair'
	},
	{
		tool: 'gate',
		label: 'Gate',
		description: 'Click the gate center, then a direction point — places both gate cones.',
		section: 'cones',
		multiStep: true,
		cursor: 'crosshair'
	},
	{
		tool: 'slalom',
		label: 'Slalom',
		description: 'Click the start and end points, then fine-tune cone count and spacing in a dialog.',
		section: 'cones',
		multiStep: true,
		cursor: 'crosshair'
	},
	{
		tool: 'drivingline',
		label: 'Driving Line',
		description: 'Click to add waypoints; the line is smoothed automatically.',
		section: 'course',
		cursor: 'crosshair'
	},
	{
		tool: 'courseoutline',
		label: 'Outline',
		description: 'Click twice per segment to draw the course boundary; drag the control point to curve it.',
		section: 'course',
		multiStep: true,
		cursor: 'crosshair'
	},
	{
		tool: 'sketch',
		label: 'Sketch',
		description: 'Drag to draw a freehand line; right-click drag to pan while sketching.',
		section: 'course',
		cursor: 'crosshair'
	},
	{
		tool: 'trailer',
		label: 'Trailer',
		description: 'Click to place a trailer marker you can resize and rotate.',
		section: 'areas',
		cursor: 'crosshair'
	},
	{
		tool: 'staging-area',
		label: 'Staging Area',
		description: 'Click to outline the staging polygon; click the first point or press Enter to close.',
		section: 'areas',
		multiStep: true,
		cursor: 'crosshair'
	},
	{
		tool: 'worker',
		label: 'Worker Station',
		description: 'Click to place a numbered worker station; right-click it to rename or delete.',
		section: 'areas',
		cursor: 'crosshair'
	},
	{
		tool: 'worker-zone',
		label: 'Worker Zone',
		description: 'Click to outline a worker coverage zone; click the first point or press Enter to close.',
		section: 'areas',
		multiStep: true,
		cursor: 'crosshair'
	},
	{
		tool: 'hazard-point',
		label: 'Hazard Point',
		description: 'Click to mark a point hazard (pole, drain) with a safety buffer circle.',
		section: 'safety',
		cursor: 'crosshair'
	},
	{
		tool: 'hazard-line',
		label: 'Hazard Line',
		description: 'Click two points to mark a line hazard (wall, curb) with a safety buffer.',
		section: 'safety',
		multiStep: true,
		cursor: 'crosshair'
	},
	{
		tool: 'note',
		label: 'Note',
		description: 'Click the map to drop a numbered text note.',
		section: 'annotations',
		cursor: 'crosshair'
	},
	{
		tool: 'measure',
		label: 'Measure',
		description: 'Click two points to measure the distance in feet; clicks near cones snap to them.',
		section: 'annotations',
		multiStep: true,
		cursor: 'crosshair'
	},
	{
		tool: 'select',
		label: 'Select',
		description: 'Click or drag a box to select elements, then drag to move or press Delete.',
		section: 'edit',
		cursor: 'default'
	},
	{
		tool: 'scale',
		label: 'Set Scale',
		description: 'Click two points a known distance apart to calibrate the image scale.',
		section: 'edit',
		multiStep: true,
		cursor: 'crosshair',
		imageModeOnly: true
	}
];

export const TOOL_SECTIONS: { key: ToolDef['section']; label: string }[] = [
	{ key: 'cones', label: 'Cones' },
	{ key: 'course', label: 'Course' },
	{ key: 'areas', label: 'Areas' },
	{ key: 'safety', label: 'Safety' },
	{ key: 'annotations', label: 'Annotations' },
	{ key: 'edit', label: 'Edit' }
];
