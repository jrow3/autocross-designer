import { untrack } from 'svelte';
import { courseStore } from './courseStore.svelte';
import { mapStore } from './mapStore.svelte';
import { simulate, type SimResult } from '$lib/engine/speedSim';
import { carProfile } from '$lib/config/carProfiles';

export type SimStatus = 'ready' | 'computing' | 'no-line' | 'needs-scale';

const DEBOUNCE_MS = 200;

let result = $state<SimResult | null>(null);
let profileId = $state('street');
let status = $state<SimStatus>('no-line');
let timer: ReturnType<typeof setTimeout> | null = null;
let initialized = false;

function recompute(): void {
	const line = courseStore.course.drivingLine;
	if (line.length < 2) {
		result = null;
		status = 'no-line';
		return;
	}
	const mode = mapStore.mode;
	const feetPerPixel = mode === 'image' ? mapStore.feetPerPixel ?? undefined : undefined;
	if (mode === 'image' && !feetPerPixel) {
		result = null;
		status = 'needs-scale';
		return;
	}
	result = simulate(line, carProfile(profileId), mode, feetPerPixel);
	status = result ? 'ready' : 'no-line';
}

function schedule(): void {
	if (timer) clearTimeout(timer);
	timer = setTimeout(() => {
		timer = null;
		recompute();
	}, DEBOUNCE_MS);
}

export const simStore = {
	get result() {
		return result;
	},

	get status() {
		return status;
	},

	get profileId() {
		return profileId;
	},

	setProfile(id: string): void {
		profileId = id;
		schedule();
	},

	// Starts the debounced recompute loop; returns a teardown. Deep-tracks the
	// driving line via JSON.stringify of the $state proxy — cheap at 5000-item cap.
	init(): () => void {
		if (initialized) return () => {};
		initialized = true;
		const stop = $effect.root(() => {
			$effect(() => {
				const key = JSON.stringify(courseStore.course.drivingLine);
				void key;
				void mapStore.mode;
				void mapStore.feetPerPixel;
				void profileId;
				untrack(() => {
					status = courseStore.course.drivingLine.length < 2 ? 'no-line' : 'computing';
					schedule();
				});
			});
		});
		return () => {
			initialized = false;
			if (timer) clearTimeout(timer);
			stop();
		};
	},

	// Test hook: run the pending computation immediately.
	flushNow(): void {
		if (timer) clearTimeout(timer);
		timer = null;
		recompute();
	}
};
