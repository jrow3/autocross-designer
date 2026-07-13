<script lang="ts">
	import { toolStore } from '$lib/stores/toolStore.svelte';
	import { courseStore } from '$lib/stores/courseStore.svelte';
	import X from '@lucide/svelte/icons/x';

	const STORAGE_KEY = 'onboarded';

	const HINTS = [
		'Pick a tool on the left — number keys work too',
		'Click the map to place cones',
		'Save & Share when ready — press ? button for help'
	];

	let step = $state(loadStep());

	function loadStep(): number {
		try {
			return localStorage.getItem(STORAGE_KEY) ? HINTS.length : 0;
		} catch {
			return HINTS.length;
		}
	}

	function dismiss() {
		step = HINTS.length;
		try {
			localStorage.setItem(STORAGE_KEY, '1');
		} catch {
			/* storage unavailable — hints just reappear next visit */
		}
	}

	// Advance on the user's own actions: tool change → step 1 done; first element placed → step 2 done
	$effect(() => {
		if (step === 0 && toolStore.activeTool !== 'select') {
			step = 1;
		}
	});

	$effect(() => {
		if (step === 1 && courseStore.course.cones.length > 0) {
			step = 2;
		}
	});

	$effect(() => {
		if (step === 2 && courseStore.course.cones.length >= 5) {
			dismiss();
		}
	});
</script>

{#if step < HINTS.length}
	<div class="hint-pill" role="status">
		<span class="hint-step">{step + 1}/{HINTS.length}</span>
		{HINTS[step]}
		<button class="hint-dismiss" onclick={dismiss} aria-label="Dismiss hints">
			<X size={13} />
		</button>
	</div>
{/if}

<style>
	.hint-pill {
		position: absolute;
		bottom: var(--space-6);
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		align-items: center;
		gap: var(--space-2);
		background: var(--bg-overlay);
		border: 1px solid var(--border);
		color: var(--text-primary);
		padding: var(--space-2) var(--space-3);
		border-radius: var(--radius-full);
		font-size: var(--text-sm);
		box-shadow: var(--shadow-md);
		backdrop-filter: blur(4px);
		z-index: var(--z-map-ui);
		white-space: nowrap;
	}

	.hint-step {
		color: var(--text-dim);
		font-size: var(--text-xs);
	}

	.hint-dismiss {
		display: flex;
		align-items: center;
		background: none;
		border: none;
		color: var(--text-muted);
		cursor: pointer;
		padding: 2px;
		border-radius: var(--radius-sm);
	}

	.hint-dismiss:hover {
		color: var(--text-primary);
	}
</style>
