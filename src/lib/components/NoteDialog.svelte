<script lang="ts">
	import BaseDialog from './BaseDialog.svelte';
	import Button from './ui/Button.svelte';

	let {
		onconfirm,
		oncancel
	}: {
		onconfirm: (text: string) => void;
		oncancel: () => void;
	} = $props();

	let text = $state('');

	function handleConfirm() {
		const trimmed = text.trim();
		if (trimmed) onconfirm(trimmed);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') handleConfirm();
	}
</script>

<BaseDialog title="Add Note" onclose={oncancel}>
	{#snippet children()}
		<div class="dialog-field">
			<input
				type="text"
				bind:value={text}
				placeholder="Note text..."
				onkeydown={handleKeydown}
			/>
		</div>
	{/snippet}
	{#snippet actions()}
		<Button variant="secondary" onclick={oncancel}>Cancel</Button>
		<Button variant="primary" onclick={handleConfirm}>Add</Button>
	{/snippet}
</BaseDialog>
