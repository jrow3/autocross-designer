<script lang="ts">
	import type { Snippet } from 'svelte';
	import Button from './Button.svelte';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';

	interface MenuItem {
		label: string;
		icon?: Snippet;
		onselect: () => void;
	}

	let {
		label,
		icon,
		items
	}: {
		label: string;
		icon?: Snippet;
		items: MenuItem[];
	} = $props();

	let isOpen = $state(false);
	let root: HTMLDivElement;
	let panel = $state<HTMLDivElement>();

	function itemButtons(): HTMLButtonElement[] {
		return Array.from(panel?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? []);
	}

	function focusTrigger(): void {
		root.querySelector('button')?.focus();
	}

	function toggle(): void {
		isOpen = !isOpen;
	}

	function close(refocus = false): void {
		isOpen = false;
		if (refocus) focusTrigger();
	}

	function select(item: MenuItem): void {
		close(true);
		item.onselect();
	}

	function handlePanelKeydown(e: KeyboardEvent): void {
		const buttons = itemButtons();
		const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
		if (e.key === 'Escape') {
			e.preventDefault();
			close(true);
		} else if (e.key === 'ArrowDown') {
			e.preventDefault();
			buttons[(index + 1) % buttons.length]?.focus();
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			buttons[(index - 1 + buttons.length) % buttons.length]?.focus();
		} else if (e.key === 'Home') {
			e.preventDefault();
			buttons[0]?.focus();
		} else if (e.key === 'End') {
			e.preventDefault();
			buttons[buttons.length - 1]?.focus();
		}
	}

	$effect(() => {
		if (!isOpen) return;
		itemButtons()[0]?.focus();
		function onOutsidePointerdown(e: PointerEvent) {
			if (!root.contains(e.target as Node)) close();
		}
		document.addEventListener('pointerdown', onOutsidePointerdown);
		return () => document.removeEventListener('pointerdown', onOutsidePointerdown);
	});
</script>

<div class="menu" bind:this={root}>
	<Button size="sm" onclick={toggle} aria-haspopup="menu" aria-expanded={isOpen}>
		{#if icon}{@render icon()}{/if}
		{label}
		<ChevronDown size={12} />
	</Button>
	{#if isOpen}
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div class="panel" bind:this={panel} role="menu" tabindex="-1" onkeydown={handlePanelKeydown}>
			{#each items as item (item.label)}
				<button role="menuitem" tabindex="-1" class="item" onclick={() => select(item)}>
					{#if item.icon}<span class="item-icon">{@render item.icon()}</span>{/if}
					{item.label}
				</button>
			{/each}
		</div>
	{/if}
</div>

<style>
	.menu {
		position: relative;
		display: inline-flex;
	}

	.panel {
		position: absolute;
		top: calc(100% + var(--space-1));
		right: 0;
		min-width: 180px;
		display: flex;
		flex-direction: column;
		padding: var(--space-1);
		background: var(--bg-surface);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-lg);
		z-index: var(--z-menu);
	}

	.item {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-3);
		background: none;
		border: none;
		border-radius: var(--radius-sm);
		font-size: var(--text-md);
		color: var(--text-primary);
		text-align: left;
		white-space: nowrap;
		cursor: pointer;
	}

	.item:hover,
	.item:focus-visible {
		background: var(--bg-hover);
	}

	.item-icon {
		display: inline-flex;
		color: var(--text-muted);
	}
</style>
