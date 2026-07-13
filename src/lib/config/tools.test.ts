import { describe, expect, it } from 'vitest';
import { TOOL_DEFS, type ToolMode } from './tools';

function idsFor(mode: ToolMode): string[] {
	return TOOL_DEFS.filter((def) => def.mode === mode).map((def) => def.tool);
}

describe('TOOL_DEFS modes', () => {
	it('assigns every tool one of the four modes', () => {
		const modes: ToolMode[] = ['venue', 'design', 'annotate', 'universal'];
		for (const def of TOOL_DEFS) {
			expect(modes).toContain(def.mode);
		}
	});

	it('universal mode is exactly select and measure', () => {
		expect(idsFor('universal')).toEqual(['select', 'measure']);
	});

	// Array order within a mode defines toolbar order AND digit shortcuts — pinned exactly.
	it('pins the venue tool order', () => {
		expect(idsFor('venue')).toEqual([
			'hazard-point',
			'hazard-line',
			'staging-area',
			'trailer',
			'scale'
		]);
	});

	it('pins the design tool order', () => {
		expect(idsFor('design')).toEqual([
			'sketch',
			'regular',
			'pointer',
			'start-cone',
			'finish-cone',
			'gate',
			'slalom',
			'courseoutline',
			'worker-zone'
		]);
	});

	it('pins the annotate tool order', () => {
		expect(idsFor('annotate')).toEqual(['note', 'drivingline', 'worker']);
	});

	it('keeps every mode within the 9 digit shortcuts', () => {
		for (const mode of ['venue', 'design', 'annotate'] as ToolMode[]) {
			expect(idsFor(mode).length).toBeLessThanOrEqual(9);
		}
	});

	it('applies the renamed labels', () => {
		const labels = Object.fromEntries(TOOL_DEFS.map((def) => [def.tool, def.label]));
		expect(labels['regular']).toBe('Cone');
		expect(labels['pointer']).toBe('Pointer cone');
		expect(labels['worker-zone']).toBe('Corner station');
		expect(labels['worker']).toBe('Worker station');
		expect(labels['hazard-point']).toBe('Hazard spot');
		expect(labels['hazard-line']).toBe('Hazard edge');
		expect(labels['staging-area']).toBe('Grid / staging');
		expect(labels['scale']).toBe('Calibrate scale');
		expect(labels['courseoutline']).toBe('Course edge');
		expect(labels['note']).toBe('Note pin');
		expect(labels['drivingline']).toBe('Driving line');
	});

	it('marks only scale as imageModeOnly', () => {
		const imageOnly = TOOL_DEFS.filter((def) => def.imageModeOnly).map((def) => def.tool);
		expect(imageOnly).toEqual(['scale']);
	});
});
