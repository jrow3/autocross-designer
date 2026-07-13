import { beforeEach, describe, expect, it } from 'vitest';
import { modeStore } from './modeStore.svelte';
import { layerStore } from './layerStore.svelte';
import { toolStore } from './toolStore.svelte';
import { MODES } from '$lib/config/modes';

function autoShowLayers(id: string) {
	return MODES.find((m) => m.id === id)!.autoShowLayers;
}

beforeEach(() => {
	// modeStore is a module singleton — walk it back to the initial 'venue' state,
	// then restore layerStore defaults and a placement tool.
	if (modeStore.activeMode !== 'venue') modeStore.setMode('venue');
	for (const layer of layerStore.layers) {
		layerStore.setVisible(layer.key, layer.key !== 'coneNumbers');
	}
	toolStore.setTool('regular');
});

describe('modeStore', () => {
	it('starts in venue', () => {
		expect(modeStore.activeMode).toBe('venue');
	});

	it('setMode shows the mode\'s autoShowLayers', () => {
		layerStore.setVisible('coneNumbers', false);
		layerStore.setVisible('notes', false);
		modeStore.setMode('annotate');
		expect(modeStore.activeMode).toBe('annotate');
		for (const key of autoShowLayers('annotate')) {
			expect(layerStore.isVisible(key)).toBe(true);
		}
	});

	it('never hides layers outside the preset', () => {
		modeStore.setMode('design');
		// hazardMarkers is not in design's preset and stays as the user left it — visible.
		expect(layerStore.isVisible('hazardMarkers')).toBe(true);
		layerStore.setVisible('hazardMarkers', false);
		modeStore.setMode('annotate');
		expect(layerStore.isVisible('hazardMarkers')).toBe(false);
	});

	it('resets the active tool to select', () => {
		toolStore.setTool('gate');
		modeStore.setMode('design');
		expect(toolStore.activeTool).toBe('select');
	});

	it('same-mode setMode is a no-op', () => {
		toolStore.setTool('hazard-point');
		layerStore.setVisible('hazardMarkers', false);
		modeStore.setMode('venue');
		expect(modeStore.activeMode).toBe('venue');
		expect(toolStore.activeTool).toBe('hazard-point');
		expect(layerStore.isVisible('hazardMarkers')).toBe(false);
	});

	it('manual hide survives within the mode, re-shown only on re-entry of a listing mode', () => {
		modeStore.setMode('design');
		layerStore.setVisible('cones', false);
		// Still hidden while we stay in design — setMode only runs on transitions.
		expect(layerStore.isVisible('cones')).toBe(false);
		// Entering a mode that does NOT list cones leaves it hidden.
		modeStore.setMode('venue');
		expect(layerStore.isVisible('cones')).toBe(false);
		// Re-entering a mode that lists cones shows it again.
		modeStore.setMode('design');
		expect(layerStore.isVisible('cones')).toBe(true);
	});
});
