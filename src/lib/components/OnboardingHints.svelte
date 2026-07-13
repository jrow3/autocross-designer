<script lang="ts">
	import { courseStore } from '$lib/stores/courseStore.svelte';
	import { modeStore } from '$lib/stores/modeStore.svelte';
	import { toastStore } from '$lib/stores/toastStore.svelte';
	import X from '@lucide/svelte/icons/x';

	const STORAGE_KEY = 'onboarded-v2';

	const HINTS = [
		'Start in Venue & Safety — load a venue or mark hazards first',
		'Switch to Design and press 2 to place cones',
		"Check & Share when you're ready to print or send"
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

	// Advance on the user's own actions: left venue mode or marked it up → step 1 done;
	// first cone placed → step 2 done; a real course underway or share mode → dismissed
	$effect(() => {
		if (
			step === 0 &&
			(modeStore.activeMode !== 'venue' ||
				courseStore.course.hazardMarkers.length > 0 ||
				courseStore.course.stagingAreas.length > 0)
		) {
			step = 1;
		}
	});

	$effect(() => {
		if (step === 1 && courseStore.course.cones.length > 0) {
			step = 2;
		}
	});

	$effect(() => {
		if (step === 2 && (courseStore.course.cones.length >= 5 || modeStore.activeMode === 'share')) {
			dismiss();
		}
	});
</script>

{#if step < HINTS.length}
	<div class="hint-pill" class:raised={toastStore.toasts.length > 0} role="status">
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
		transition: bottom 0.15s ease;
	}

	/* Toasts share the bottom-center slot — step aside while one is showing */
	.hint-pill.raised {
		bottom: calc(var(--space-6) + 56px);
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
