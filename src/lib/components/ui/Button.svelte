<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	let {
		variant = 'secondary',
		size = 'md',
		icon = false,
		label,
		disabled = false,
		onclick,
		type = 'button',
		children,
		...rest
	}: {
		variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
		size?: 'sm' | 'md';
		icon?: boolean;
		label?: string;
		children?: Snippet;
	} & HTMLButtonAttributes = $props();
</script>

<button
	{...rest}
	class="btn {variant} {size}"
	class:icon
	{type}
	{disabled}
	{onclick}
	aria-label={icon ? label : rest['aria-label']}
>
	{@render children?.()}
</button>

<style>
	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-1);
		border: 1px solid transparent;
		border-radius: var(--radius-md);
		font-family: var(--font-ui);
		font-weight: 500;
		cursor: pointer;
		white-space: nowrap;
		transition: background 0.12s ease, border-color 0.12s ease, color 0.12s ease;
	}

	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.sm {
		padding: var(--space-1) var(--space-2);
		font-size: var(--text-sm);
	}

	.md {
		padding: var(--space-2) var(--space-3);
		font-size: var(--text-md);
	}

	.icon.sm {
		padding: var(--space-1);
	}

	.icon.md {
		padding: var(--space-2);
	}

	.primary {
		background: var(--accent);
		color: #fff;
	}

	.primary:hover:not(:disabled) {
		background: var(--accent-hover);
	}

	.secondary {
		background: var(--bg-elevated);
		border-color: var(--border);
		color: var(--text-primary);
	}

	.secondary:hover:not(:disabled) {
		background: var(--bg-hover);
		border-color: var(--text-dim);
	}

	.ghost {
		background: transparent;
		color: var(--text-muted);
	}

	.ghost:hover:not(:disabled) {
		background: var(--bg-hover);
		color: var(--text-primary);
	}

	.danger {
		background: var(--danger);
		color: #fff;
	}

	.danger:hover:not(:disabled) {
		background: var(--danger-hover);
	}

	.success {
		background: var(--success);
		color: #fff;
		font-weight: 600;
	}

	.success:hover:not(:disabled) {
		background: var(--success-hover);
	}
</style>
