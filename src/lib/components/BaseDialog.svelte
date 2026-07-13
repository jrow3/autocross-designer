<script lang="ts">
	import type { Snippet } from 'svelte';
	import X from '@lucide/svelte/icons/x';

	let {
		title,
		onclose,
		size = 'sm',
		children,
		actions
	}: {
		title: string;
		onclose: () => void;
		size?: 'sm' | 'md' | 'lg';
		children: Snippet;
		actions?: Snippet;
	} = $props();

	const uid = $props.id();

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onclose();
			return;
		}
		if (e.key !== 'Tab') return;
		const focusables = dialogEl.querySelectorAll<HTMLElement>(
			'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex]:not([tabindex="-1"])'
		);
		if (focusables.length === 0) return;
		const first = focusables[0];
		const last = focusables[focusables.length - 1];
		const active = document.activeElement;
		if (e.shiftKey && (active === first || !dialogEl.contains(active))) {
			e.preventDefault();
			last.focus();
		} else if (!e.shiftKey && (active === last || !dialogEl.contains(active))) {
			e.preventDefault();
			first.focus();
		}
	}

	let dialogEl: HTMLDivElement;

	$effect(() => {
		const previouslyFocused = document.activeElement as HTMLElement | null;
		const first = dialogEl?.querySelector('input, select, button:not(.dialog-close)') as HTMLElement;
		first?.focus();
		return () => previouslyFocused?.focus();
	});
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="overlay" onclick={onclose} role="presentation">
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="dialog {size}"
		bind:this={dialogEl}
		role="dialog"
		tabindex="-1"
		aria-modal="true"
		aria-labelledby="dialog-title-{uid}"
		onclick={(e) => e.stopPropagation()}
	>
		<div class="dialog-header">
			<h2 class="dialog-title" id="dialog-title-{uid}">{title}</h2>
			<button class="dialog-close" aria-label="Close" onclick={onclose}>
				<X size={16} />
			</button>
		</div>
		<div class="dialog-body">
			{@render children()}
		</div>
		{#if actions}
			<div class="dialog-actions">
				{@render actions()}
			</div>
		{/if}
	</div>
</div>

<style>
	.overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(2px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: var(--z-dialog);
	}

	.dialog {
		background: var(--bg-surface);
		border: 1px solid var(--border);
		border-radius: 8px;
		padding: 20px;
		max-height: 80vh;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.dialog.sm {
		width: 360px;
	}

	.dialog.md {
		width: 500px;
	}

	.dialog.lg {
		width: 640px;
	}

	.dialog-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.dialog-title {
		font-size: 14px;
		font-weight: 600;
		color: var(--text-primary);
	}

	.dialog-close {
		display: inline-flex;
		padding: 2px;
		background: none;
		border: none;
		border-radius: var(--radius-sm);
		color: var(--text-muted);
		cursor: pointer;
	}

	.dialog-close:hover {
		color: var(--text-primary);
	}

	.dialog-body {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.dialog-actions {
		display: flex;
		gap: 8px;
		justify-content: flex-end;
		padding-top: 4px;
	}

	/* Shared field styles for children */
	:global(.dialog-field) {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	:global(.dialog-field label) {
		font-size: 12px;
		color: var(--text-muted);
	}

	:global(.dialog-field input),
	:global(.dialog-field select) {
		padding: 8px;
		background: var(--bg-base);
		border: 1px solid var(--border);
		border-radius: 4px;
		color: var(--text-primary);
		font-size: 14px;
		outline: none;
	}

	:global(.dialog-field input:focus),
	:global(.dialog-field select:focus) {
		border-color: var(--border-focus);
	}

	:global(.dialog-desc) {
		font-size: 13px;
		color: var(--text-muted);
		line-height: 1.4;
	}
</style>
