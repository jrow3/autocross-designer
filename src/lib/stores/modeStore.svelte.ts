import { MODES, type ModeId } from '$lib/config/modes';
import { layerStore } from './layerStore.svelte';
import { toolStore } from './toolStore.svelte';

// Deliberately NOT persisted: the image-mode calibration flow relies on every
// session starting in 'venue'.
let activeMode = $state<ModeId>('venue');

export const modeStore = {
	get activeMode() {
		return activeMode;
	},

	setMode(mode: ModeId): void {
		if (mode === activeMode) return;
		activeMode = mode;
		const def = MODES.find((m) => m.id === mode)!;
		// Show-only preset: never hides a layer. Manual toggles win until the next setMode.
		for (const key of def.autoShowLayers) {
			layerStore.setVisible(key, true);
		}
		// Switching modes is navigation, not placement intent — and resetting to select
		// makes out-of-mode placement unreachable.
		toolStore.setTool('select');
	}
};
