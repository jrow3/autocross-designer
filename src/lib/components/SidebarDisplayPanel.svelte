<script lang="ts">
	import { layerStore } from '$lib/stores/layerStore.svelte';
	import { mapStore } from '$lib/stores/mapStore.svelte';
	import type { LayerKey } from '$lib/stores/layerStore.svelte';
	import SectionHeader from './ui/SectionHeader.svelte';

	function toggleLayer(key: LayerKey) {
		layerStore.toggle(key);
	}

	let markerSizePercent = $derived(`${(mapStore.markerSize * 100).toFixed(0)}%`);
</script>

<section>
	<SectionHeader title="Layers" />
	<div class="layers-list">
		{#each layerStore.layers as layer (layer.key)}
			<label class="layer-toggle">
				<input
					type="checkbox"
					checked={layer.visible}
					onchange={() => toggleLayer(layer.key)}
				/>
				<span>{layer.label}</span>
			</label>
		{/each}
	</div>
</section>

<section>
	<SectionHeader title="Marker Size" />
	<div class="slider-row">
		<label class="sr-only" for="marker-size">Marker size</label>
		<input
			id="marker-size"
			type="range"
			min="0.5"
			max="2"
			step="0.05"
			value={mapStore.markerSize}
			aria-valuetext={markerSizePercent}
			oninput={(e) => mapStore.setMarkerSize(parseFloat((e.target as HTMLInputElement).value))}
		/>
		<span class="slider-value">{markerSizePercent}</span>
	</div>
</section>

<section>
	<SectionHeader title="Grid Overlay" />
	<label class="layer-toggle">
		<input
			type="checkbox"
			checked={mapStore.gridActive}
			onchange={() => mapStore.setGridActive(!mapStore.gridActive)}
		/>
		<span>Show Grid</span>
	</label>
	{#if mapStore.gridActive}
		<div class="control-row">
			<label for="grid-spacing">Spacing</label>
			<div class="input-row">
				<input
					id="grid-spacing"
					type="number"
					min="1"
					max="500"
					step="1"
					value={mapStore.gridSpacingFt}
					onchange={(e) => mapStore.setGridSpacingFt(parseFloat((e.target as HTMLInputElement).value) || 10)}
				/>
				<span class="unit">ft</span>
			</div>
		</div>
		<div class="control-row">
			<label for="grid-rotation">Rotation</label>
			<div class="input-row">
				<input
					id="grid-rotation"
					type="number"
					min="-180"
					max="180"
					step="1"
					value={mapStore.gridRotation}
					onchange={(e) => mapStore.setGridRotation(parseFloat((e.target as HTMLInputElement).value) || 0)}
				/>
				<span class="unit">°</span>
			</div>
		</div>
		<div class="control-row">
			<span class="control-label" id="grid-lines-label">Lines</span>
			<div class="toggle-btns" role="group" aria-labelledby="grid-lines-label">
				<button
					class="toggle-btn"
					class:active={mapStore.gridLineMode === 'light'}
					aria-pressed={mapStore.gridLineMode === 'light'}
					onclick={() => mapStore.setGridLineMode('light')}
				>Light</button>
				<button
					class="toggle-btn"
					class:active={mapStore.gridLineMode === 'dark'}
					aria-pressed={mapStore.gridLineMode === 'dark'}
					onclick={() => mapStore.setGridLineMode('dark')}
				>Dark</button>
			</div>
		</div>
	{/if}
</section>

<section>
	<SectionHeader title="Map Fade" />
	<div class="slider-row">
		<label class="sr-only" for="map-fade">Map fade</label>
		<input
			id="map-fade"
			type="range"
			min="0"
			max="100"
			step="5"
			value={mapStore.mapFade}
			aria-valuetext="{mapStore.mapFade}%"
			oninput={(e) => mapStore.setMapFade(parseFloat((e.target as HTMLInputElement).value))}
		/>
		<span class="slider-value">{mapStore.mapFade}%</span>
	</div>
</section>

<style>
	section {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		margin-bottom: var(--space-4);
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip: rect(0 0 0 0);
		white-space: nowrap;
	}

	.layers-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.layer-toggle {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: 2px 0;
		font-size: var(--text-md);
		color: var(--text-secondary);
		cursor: pointer;
	}

	.layer-toggle input {
		width: 14px;
		height: 14px;
		accent-color: var(--accent-light);
	}

	.slider-row {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.slider-row input[type='range'] {
		flex: 1;
		accent-color: var(--accent-light);
		height: 4px;
	}

	.slider-value {
		font-size: var(--text-xs);
		color: var(--text-muted);
		min-width: 32px;
		text-align: right;
	}

	.control-row {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.control-row label,
	.control-label {
		font-size: var(--text-sm);
		color: var(--text-muted);
	}

	.input-row {
		display: flex;
		align-items: center;
		gap: var(--space-1);
	}

	.input-row input {
		width: 60px;
		padding: 3px var(--space-2);
		background: var(--bg-base);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		color: var(--text-primary);
		font-size: var(--text-sm);
		text-align: center;
	}

	.input-row input:focus {
		border-color: var(--border-focus);
		outline: none;
	}

	.unit {
		font-size: var(--text-xs);
		color: var(--text-dim);
	}

	.toggle-btns {
		display: flex;
		gap: var(--space-1);
	}

	.toggle-btn {
		flex: 1;
		padding: 3px var(--space-2);
		background: var(--bg-base);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		color: var(--text-muted);
		font-size: var(--text-xs);
		cursor: pointer;
	}

	.toggle-btn.active {
		background: var(--accent);
		border-color: var(--accent-light);
		color: #fff;
	}
</style>
