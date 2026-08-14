<script lang="ts">
	import { createMarker, wrapForMapbox, type AnyMarker } from '$lib/engine/markerFactory';
	import { onMount } from 'svelte';
	import { mapStore } from '$lib/stores/mapStore.svelte';
	import { courseStore } from '$lib/stores/courseStore.svelte';
	import { toolStore } from '$lib/stores/toolStore.svelte';
	import { selectionStore } from '$lib/stores/selectionStore.svelte';
	import type { NoteData } from '$lib/types/course';

	let { note }: { note: NoteData } = $props();

	let marker: AnyMarker | null = null;
	let numberSpan: HTMLSpanElement | null = null;
	let innerEl: HTMLDivElement | null = null;
	let justDragged = false;

	onMount(() => {
		const map = mapStore.map;
		if (!map) return;

		const el = document.createElement('div');
		el.className = 'note-marker';
		el.title = note.text;
		innerEl = el;

		numberSpan = document.createElement('span');
		numberSpan.className = 'note-number';
		numberSpan.textContent = String(note.number);
		el.appendChild(numberSpan);

		const wrapper = wrapForMapbox(mapStore.mode, el);

		marker = createMarker(mapStore.mode, { element: wrapper, draggable: true })
			.setLngLat(note.lngLat as [number, number])
			.addTo(map);

		marker.on('dragstart', () => {
			courseStore.pushUndo();
		});

		marker.on('drag', () => {
			justDragged = true;
		});

		marker.on('dragend', () => {
			const pos = marker!.getLngLat();
			courseStore.updateNotePosition(note.id, [pos.lng, pos.lat]);
		});

		// Select tool: click selects (shift extends); deletion is select + Delete.
		wrapper.addEventListener('click', (e) => {
			if (toolStore.activeTool !== 'select') return;
			e.stopPropagation();
			if (justDragged) {
				justDragged = false;
				return;
			}
			if (e.shiftKey) {
				selectionStore.toggle('note', note.id);
			} else {
				selectionStore.clear();
				selectionStore.select('note', note.id);
			}
		});

		return () => {
			marker?.remove();
		};
	});

	$effect(() => {
		if (marker) {
			const [lng, lat] = note.lngLat;
			const current = marker.getLngLat();
			if (Math.abs(current.lng - lng) > 1e-8 || Math.abs(current.lat - lat) > 1e-8) {
				marker.setLngLat([lng, lat]);
			}
			if (innerEl) innerEl.title = note.text;
		}
	});

	$effect(() => {
		if (innerEl) {
			innerEl.classList.toggle('multi-selected', selectionStore.isSelected('note', note.id));
		}
	});
</script>

<style>
	:global(.note-marker) {
		width: 22px;
		height: 22px;
		background: var(--note);
		border: 2px solid #fff;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transform: scale(var(--marker-scale, 1));
	}

	:global(.note-number) {
		color: #fff;
		font-size: 11px;
		font-weight: bold;
		line-height: 1;
	}
</style>
