import { beforeEach, describe, expect, it } from 'vitest';
import { createGateFlow, createSlalomFlow, createScaleFlow, createHazardLineFlow } from './placementFlows.svelte';
import { courseStore } from '$lib/stores/courseStore.svelte';
import { toolStore } from '$lib/stores/toolStore.svelte';
import { mapStore } from '$lib/stores/mapStore.svelte';
import { emptyCourse } from '$lib/engine/courseSerializer';
import type { MapInstance } from '$lib/stores/mapStore.svelte';

const A: [number, number] = [-80.05, 40.44];
const B: [number, number] = [-80.0495, 40.44];

beforeEach(() => {
	courseStore.load(emptyCourse());
	toolStore.clearStatus();
	mapStore.setMode('map');
});

describe('createGateFlow', () => {
	it('arms on first click and places two cones on second', () => {
		const flow = createGateFlow();
		flow.handleClick(A);
		expect(flow.center).toEqual(A);
		expect(toolStore.statusMessage).not.toBe('');
		flow.handleClick(B);
		expect(flow.center).toBeNull();
		expect(courseStore.course.cones).toHaveLength(2);
		expect(toolStore.statusMessage).toBe('');
	});

	it('adds directional pointer cones when enabled', () => {
		toolStore.setGateDirectionalCones(true);
		const flow = createGateFlow();
		flow.handleClick(A);
		flow.handleClick(B);
		toolStore.setGateDirectionalCones(false);
		expect(courseStore.course.cones).toHaveLength(4);
		expect(courseStore.course.cones.filter((c) => c.type === 'pointer')).toHaveLength(2);
	});

	it('reset disarms a pending gate', () => {
		const flow = createGateFlow();
		flow.handleClick(A);
		flow.reset();
		expect(flow.center).toBeNull();
		flow.handleClick(B);
		expect(courseStore.course.cones).toHaveLength(0);
	});
});

describe('createSlalomFlow', () => {
	it('collects start then end and opens the dialog', () => {
		const flow = createSlalomFlow();
		flow.handleClick(A);
		expect(flow.start).toEqual(A);
		expect(flow.showDialog).toBe(false);
		flow.handleClick(B);
		expect(flow.end).toEqual(B);
		expect(flow.showDialog).toBe(true);
	});

	it('ignores clicks while the dialog is open', () => {
		const flow = createSlalomFlow();
		flow.handleClick(A);
		flow.handleClick(B);
		flow.handleClick([-80.03, 40.4]);
		expect(flow.end).toEqual(B);
	});

	it('confirm places the requested cone count and resets', () => {
		const flow = createSlalomFlow();
		flow.handleClick(A);
		flow.handleClick(B);
		flow.confirm(5, 0);
		expect(courseStore.course.cones).toHaveLength(5);
		expect(flow.start).toBeNull();
		expect(flow.showDialog).toBe(false);
	});

	it('reset keeps pending points while the dialog is open, cancel clears them', () => {
		const flow = createSlalomFlow();
		flow.handleClick(A);
		flow.handleClick(B);
		flow.reset();
		expect(flow.start).toEqual(A);
		flow.cancel();
		expect(flow.start).toBeNull();
		expect(flow.end).toBeNull();
	});

	it('reset clears a half-finished slalom when no dialog is open', () => {
		const flow = createSlalomFlow();
		flow.handleClick(A);
		flow.reset();
		expect(flow.start).toBeNull();
	});
});

describe('createScaleFlow', () => {
	it('confirm applies the scale to an image map and closes the dialog', () => {
		let applied = 0;
		mapStore.setMap({ setScale: (f: number) => (applied = f) } as unknown as MapInstance);
		const flow = createScaleFlow();
		flow.confirm(0.25);
		expect(applied).toBe(0.25);
		expect(flow.showDialog).toBe(false);
		expect(toolStore.statusMessage).toContain('0.2500');
	});

	it('cancel closes the dialog and clears status', () => {
		const flow = createScaleFlow();
		flow.cancel();
		expect(flow.showDialog).toBe(false);
		expect(toolStore.statusMessage).toBe('');
	});
});

describe('createHazardLineFlow', () => {
	it('arms on first click and creates a line hazard on second', () => {
		toolStore.setHazardBufferFeet(30);
		const flow = createHazardLineFlow();
		flow.handleClick(A);
		expect(flow.points).toEqual([A]);
		flow.handleClick(B);
		expect(flow.points).toEqual([]);
		expect(courseStore.course.hazardMarkers).toHaveLength(1);
		expect(courseStore.course.hazardMarkers[0]).toMatchObject({
			type: 'line',
			coordinates: [A, B],
			bufferFeet: 30
		});
	});

	it('reset clears a pending first point without creating a hazard', () => {
		const flow = createHazardLineFlow();
		flow.handleClick(A);
		flow.reset();
		expect(flow.points).toEqual([]);
		flow.handleClick(B);
		expect(courseStore.course.hazardMarkers).toHaveLength(0);
	});
});
