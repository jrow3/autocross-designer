<script lang="ts">
	import BaseDialog from '../BaseDialog.svelte';
	import Button from './Button.svelte';

	let {
		title,
		message,
		confirmLabel = 'Delete',
		danger = true,
		onconfirm,
		oncancel
	}: {
		title: string;
		message: string;
		confirmLabel?: string;
		danger?: boolean;
		onconfirm: () => void;
		oncancel: () => void;
	} = $props();
</script>

<BaseDialog {title} onclose={oncancel} size="sm">
	{#snippet children()}
		<p class="confirm-message">{message}</p>
	{/snippet}
	{#snippet actions()}
		<Button variant="secondary" onclick={oncancel}>Cancel</Button>
		<Button variant={danger ? 'danger' : 'primary'} onclick={onconfirm}>{confirmLabel}</Button>
	{/snippet}
</BaseDialog>

<style>
	.confirm-message {
		font-size: var(--text-md);
		color: var(--text-muted);
		line-height: 1.5;
	}
</style>
