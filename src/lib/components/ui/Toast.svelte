<script lang="ts">
	import X from '@lucide/svelte/icons/x';
	import { toastStore } from '$lib/stores/toastStore.svelte';
</script>

{#if toastStore.toasts.length > 0}
	<div class="toast-stack" role="status" aria-live="polite">
		{#each toastStore.toasts as toast (toast.id)}
			<div class="toast {toast.kind}">
				<span class="message">{toast.message}</span>
				<button class="dismiss" aria-label="Dismiss" onclick={() => toastStore.dismiss(toast.id)}>
					<X size={14} />
				</button>
			</div>
		{/each}
	</div>
{/if}

<style>
	.toast-stack {
		position: fixed;
		bottom: var(--space-6);
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-2);
		z-index: var(--z-toast);
	}

	.toast {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		max-width: 420px;
		padding: var(--space-2) var(--space-3);
		background: var(--bg-elevated);
		border: 1px solid var(--border);
		border-left-width: 3px;
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-md);
		animation: toast-in 0.18s ease-out;
	}

	.toast.error {
		border-left-color: var(--danger);
	}

	.toast.success {
		border-left-color: var(--success);
	}

	.toast.info {
		border-left-color: var(--accent-light);
	}

	.message {
		font-size: var(--text-md);
		color: var(--text-primary);
		line-height: 1.4;
	}

	.dismiss {
		display: inline-flex;
		flex-shrink: 0;
		padding: 2px;
		background: none;
		border: none;
		border-radius: var(--radius-sm);
		color: var(--text-muted);
		cursor: pointer;
	}

	.dismiss:hover {
		color: var(--text-primary);
	}

	@keyframes toast-in {
		from {
			opacity: 0;
			transform: translateY(8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
