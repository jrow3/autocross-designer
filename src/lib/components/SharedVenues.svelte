<script lang="ts">
	import { onMount } from 'svelte';
	import { courseStore } from '$lib/stores/courseStore.svelte';
	import { mapStore } from '$lib/stores/mapStore.svelte';
	import { toastStore } from '$lib/stores/toastStore.svelte';
	import { isSupabaseConfigured } from '$lib/services/supabase';
	import { opsAuth } from '$lib/services/opsAuth.svelte';
	import {
		listSharedVenues,
		loadSharedVenue,
		saveSharedVenue,
		deleteSharedVenue,
		type SharedVenueSummary
	} from '$lib/services/sharedVenueService';
	import SectionHeader from './ui/SectionHeader.svelte';
	import EmptyState from './ui/EmptyState.svelte';
	import Button from './ui/Button.svelte';
	import BaseDialog from './BaseDialog.svelte';
	import ConfirmDialog from './ui/ConfirmDialog.svelte';
	import Trash2 from '@lucide/svelte/icons/trash-2';

	const configured = isSupabaseConfigured();

	let venues = $state<SharedVenueSummary[]>([]);
	let isLoading = $state(false);
	let pendingLoad = $state<SharedVenueSummary | null>(null);
	let pendingDelete = $state<SharedVenueSummary | null>(null);
	let isSaveDialogOpen = $state(false);
	let saveName = $state('');
	let isSignInDialogOpen = $state(false);
	let email = $state('');
	let password = $state('');

	onMount(async () => {
		if (!configured) return;
		opsAuth.init();
		isLoading = true;
		venues = await listSharedVenues();
		isLoading = false;
	});

	function requestLoad(venue: SharedVenueSummary) {
		const { hazardMarkers, obstacles } = courseStore.course;
		if (hazardMarkers.length > 0 || obstacles.length > 0) {
			pendingLoad = venue;
		} else {
			applyVenue(venue);
		}
	}

	async function applyVenue(summary: SharedVenueSummary) {
		pendingLoad = null;
		const venue = await loadSharedVenue(summary.id);
		if (!venue) {
			toastStore.error(`Couldn't load venue "${summary.name}"`);
			return;
		}
		courseStore.pushUndo();
		courseStore.applyVenue(venue);
		const map = mapStore.map;
		if (map && 'flyTo' in map) {
			map.flyTo({ center: venue.mapCenter, zoom: venue.mapZoom });
		}
	}

	async function saveVenue() {
		const name = saveName.trim();
		if (!name) return;
		isSaveDialogOpen = false;
		saveName = '';
		const ok = await saveSharedVenue({
			name,
			mapCenter: courseStore.course.mapCenter,
			mapZoom: courseStore.course.mapZoom,
			hazardMarkers: [...courseStore.course.hazardMarkers],
			obstacles: [...courseStore.course.obstacles]
		});
		if (ok) {
			toastStore.success('Venue saved for everyone');
			venues = await listSharedVenues();
		} else {
			toastStore.error('Venue save failed');
		}
	}

	async function confirmDelete() {
		if (!pendingDelete) return;
		const target = pendingDelete;
		pendingDelete = null;
		const ok = await deleteSharedVenue(target.id);
		if (ok) {
			venues = venues.filter((v) => v.id !== target.id);
		} else {
			toastStore.error('Delete failed');
		}
	}

	async function submitSignIn() {
		const result = await opsAuth.signIn(email.trim(), password);
		if (!result.ok) {
			toastStore.error(result.reason);
			return;
		}
		isSignInDialogOpen = false;
		email = '';
		password = '';
	}
</script>

{#if configured}
	<section>
		<SectionHeader title="Shared Venues" count={venues.length} />
		{#if isLoading}
			<div class="loading-text">Loading...</div>
		{:else if venues.length === 0}
			<EmptyState message="No shared venues" hint="Venues saved by ops appear here for everyone" />
		{:else}
			<div class="venue-list">
				{#each venues as v (v.id)}
					<div class="venue-item">
						<button class="venue-load" onclick={() => requestLoad(v)}>{v.name}</button>
						{#if opsAuth.isOps}
							<Button
								variant="ghost"
								size="sm"
								icon
								label={`Delete shared venue "${v.name}"`}
								onclick={() => (pendingDelete = v)}
							>
								<Trash2 size={14} />
							</Button>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
		{#if opsAuth.isOps}
			<Button variant="secondary" size="sm" onclick={() => (isSaveDialogOpen = true)}>
				Save as shared venue
			</Button>
			<div class="ops-status">
				Ops: signed in ·
				<button class="ops-link" onclick={() => opsAuth.signOut()}>Sign out</button>
			</div>
		{:else}
			<button class="ops-link" onclick={() => (isSignInDialogOpen = true)}>Ops sign-in</button>
		{/if}
	</section>
{/if}

{#if pendingLoad}
	<ConfirmDialog
		title="Load shared venue"
		message={`Load venue "${pendingLoad.name}"? Its hazards replace the current ones — cones and notes stay.`}
		confirmLabel="Load"
		danger={false}
		onconfirm={() => applyVenue(pendingLoad!)}
		oncancel={() => (pendingLoad = null)}
	/>
{/if}

{#if pendingDelete}
	<ConfirmDialog
		title="Delete shared venue"
		message={`Delete shared venue "${pendingDelete.name}" for everyone? This can't be undone.`}
		confirmLabel="Delete"
		danger
		onconfirm={confirmDelete}
		oncancel={() => (pendingDelete = null)}
	/>
{/if}

{#if isSaveDialogOpen}
	<BaseDialog title="Save as shared venue" onclose={() => (isSaveDialogOpen = false)} size="sm">
		{#snippet children()}
			<p class="dialog-desc">
				Saves the current map view, hazards, and obstacles for everyone. An existing venue with
				the same name is overwritten.
			</p>
			<div class="dialog-field">
				<label for="shared-venue-name">Venue name</label>
				<input
					id="shared-venue-name"
					type="text"
					bind:value={saveName}
					onkeydown={(e) => e.key === 'Enter' && saveVenue()}
				/>
			</div>
		{/snippet}
		{#snippet actions()}
			<Button variant="secondary" onclick={() => (isSaveDialogOpen = false)}>Cancel</Button>
			<Button variant="primary" disabled={!saveName.trim()} onclick={saveVenue}>Save</Button>
		{/snippet}
	</BaseDialog>
{/if}

{#if isSignInDialogOpen}
	<BaseDialog title="Ops sign-in" onclose={() => (isSignInDialogOpen = false)} size="sm">
		{#snippet children()}
			<div class="dialog-field">
				<label for="ops-email">Email</label>
				<input
					id="ops-email"
					type="email"
					autocomplete="username"
					bind:value={email}
				/>
			</div>
			<div class="dialog-field">
				<label for="ops-password">Password</label>
				<input
					id="ops-password"
					type="password"
					autocomplete="current-password"
					bind:value={password}
					onkeydown={(e) => e.key === 'Enter' && submitSignIn()}
				/>
			</div>
		{/snippet}
		{#snippet actions()}
			<Button variant="secondary" onclick={() => (isSignInDialogOpen = false)}>Cancel</Button>
			<Button variant="primary" disabled={!email.trim() || !password} onclick={submitSignIn}>
				Sign in
			</Button>
		{/snippet}
	</BaseDialog>
{/if}

<style>
	section {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		margin-bottom: var(--space-4);
	}

	.loading-text {
		font-size: var(--text-sm);
		color: var(--text-dim);
	}

	.venue-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.venue-item {
		display: flex;
		align-items: center;
		gap: var(--space-1);
	}

	.venue-load {
		flex: 1;
		min-width: 0;
		padding: var(--space-1) var(--space-2);
		background: var(--bg-surface);
		border: none;
		border-radius: var(--radius-md);
		color: var(--text-secondary);
		font-size: var(--text-md);
		cursor: pointer;
		text-align: left;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.venue-load:hover {
		background: var(--bg-hover);
		color: var(--text-primary);
	}

	.ops-status {
		font-size: var(--text-sm);
		color: var(--text-dim);
	}

	.ops-link {
		align-self: flex-start;
		display: inline;
		padding: 0;
		background: none;
		border: none;
		color: var(--text-dim);
		font-size: var(--text-sm);
		cursor: pointer;
		text-decoration: underline;
	}

	.ops-link:hover {
		color: var(--text-primary);
	}
</style>
