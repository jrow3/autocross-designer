<script lang="ts">
	import Map from '@lucide/svelte/icons/map';
	import Image from '@lucide/svelte/icons/image';
	import Plus from '@lucide/svelte/icons/plus';
	import Button from './ui/Button.svelte';

	let {
		onselect,
		reloadPrompt = null
	}: {
		onselect: (mode: 'map' | 'image', imageSrc?: string, fileName?: string) => void;
		reloadPrompt?: { fileName?: string } | null;
	} = $props();

	let showGallery = $state(false);
	let galleryImages = $state<{ name: string; file: string }[]>([]);
	let fileInput: HTMLInputElement;

	async function loadManifest() {
		try {
			const res = await fetch('assets/courses/manifest.json?t=' + Date.now());
			galleryImages = await res.json();
		} catch {
			galleryImages = [];
		}
	}

	function selectMap() {
		onselect('map');
	}

	async function openGallery() {
		await loadManifest();
		showGallery = true;
	}

	function selectGalleryImage(img: { name: string; file: string }) {
		onselect('image', `assets/courses/${img.file}`, img.name);
	}

	function handleUpload(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = (ev) => {
			onselect('image', ev.target?.result as string, file.name);
		};
		reader.readAsDataURL(file);
	}
</script>

<div class="landing-overlay">
	{#if !showGallery}
		<div class="landing">
			{#if reloadPrompt}
				<h1 class="landing-title">Reload venue image</h1>
				<p class="landing-tagline">
					This course was built on the venue image
					{#if reloadPrompt.fileName}<strong>{reloadPrompt.fileName}</strong>{:else}you uploaded{/if}
					— choose that image to continue.
				</p>
				<div class="mode-cards">
					<button class="mode-card" onclick={openGallery}>
						<span class="mode-icon"><Image size={32} /></span>
						<span class="mode-name">Choose Image</span>
						<span class="mode-desc">Pick or upload the lot image this course was designed on</span>
					</button>
				</div>
			{:else}
				<h1 class="landing-title">Autocross Course Designer</h1>
				<p class="landing-tagline">Lay out cones, gates, and slaloms on your actual lot.</p>
				<div class="mode-cards">
					<button class="mode-card" onclick={selectMap}>
						<span class="mode-icon"><Map size={32} /></span>
						<span class="mode-name">Live Map</span>
						<span class="mode-desc">Design on live satellite imagery of your venue</span>
					</button>
					<button class="mode-card" onclick={openGallery}>
						<span class="mode-icon"><Image size={32} /></span>
						<span class="mode-name">Lot Image</span>
						<span class="mode-desc">Calibrate and design over an uploaded lot image</span>
					</button>
				</div>
				<p class="landing-hint">
					Click the <strong>?</strong> in the top bar anytime for tools & shortcuts
				</p>
			{/if}
		</div>
	{:else}
		<div class="gallery-panel">
			<h2 class="gallery-header">Choose a Course Image</h2>
			<div class="gallery-grid">
				{#each galleryImages as img (img.file)}
					<button class="gallery-thumb" onclick={() => selectGalleryImage(img)}>
						<img src="assets/courses/{img.file}" alt={img.name} />
						<span>{img.name}</span>
					</button>
				{/each}
				<button class="gallery-thumb gallery-upload" onclick={() => fileInput.click()}>
					<span class="upload-icon"><Plus size={32} /></span>
					<span>Upload</span>
				</button>
			</div>
			<div class="gallery-actions">
				<Button variant="secondary" onclick={() => (showGallery = false)}>Back</Button>
			</div>
		</div>
	{/if}
</div>

<input
	type="file"
	accept="image/*"
	bind:this={fileInput}
	onchange={handleUpload}
	style="display:none"
/>

<style>
	.landing-overlay {
		position: absolute;
		inset: 0;
		background: var(--bg-overlay);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: var(--z-landing);
	}

	.landing {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
	}

	.landing-title {
		font-size: var(--text-2xl);
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: var(--space-2);
	}

	.landing-tagline {
		font-size: var(--text-base);
		color: var(--text-muted);
		margin-bottom: var(--space-8);
	}

	.mode-cards {
		display: flex;
		gap: var(--space-6);
	}

	.mode-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-3);
		width: 240px;
		padding: var(--space-8) var(--space-6);
		background: var(--bg-surface);
		border: 2px solid var(--border);
		border-radius: var(--radius-lg);
		color: var(--text-primary);
		cursor: pointer;
		transition: border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;
	}

	.mode-card:hover {
		border-color: var(--border-focus);
		box-shadow: var(--shadow-md);
		transform: translateY(-2px);
	}

	.mode-icon {
		display: inline-flex;
		color: var(--accent-light);
	}

	.mode-name {
		font-size: var(--text-lg);
		font-weight: 600;
	}

	.mode-desc {
		font-size: var(--text-md);
		color: var(--text-muted);
		line-height: 1.4;
	}

	.landing-hint {
		margin-top: var(--space-8);
		font-size: var(--text-sm);
		color: var(--text-dim);
	}

	.landing-hint strong {
		color: var(--text-muted);
	}

	.gallery-panel {
		width: 90%;
		max-width: 700px;
		max-height: 80vh;
		overflow-y: auto;
	}

	.gallery-header {
		font-size: var(--text-xl);
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: var(--space-4);
		text-align: center;
	}

	.gallery-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
		gap: var(--space-3);
		margin-bottom: var(--space-4);
	}

	.gallery-thumb {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2);
		background: var(--bg-surface);
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		cursor: pointer;
		color: var(--text-secondary);
		font-size: var(--text-sm);
		text-align: center;
		transition: border-color 0.15s ease, box-shadow 0.15s ease;
	}

	.gallery-thumb:hover {
		border-color: var(--border-focus);
		box-shadow: var(--shadow-md);
	}

	.gallery-thumb img {
		width: 100%;
		aspect-ratio: 4/3;
		object-fit: cover;
		border-radius: var(--radius-sm);
	}

	.gallery-upload {
		justify-content: center;
		min-height: 120px;
	}

	.upload-icon {
		display: inline-flex;
		color: var(--text-dim);
	}

	.gallery-actions {
		display: flex;
		justify-content: center;
	}
</style>
