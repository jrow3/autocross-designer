import type { LngLat } from '$lib/types/course';
import { courseStore } from '$lib/stores/courseStore.svelte';
import { toolStore } from '$lib/stores/toolStore.svelte';
import { mapStore } from '$lib/stores/mapStore.svelte';
import { computeGateCones, computeDirectionalCones } from '$lib/engine/gateLogic';
import { computeSlalomPositions } from '$lib/engine/slalomLogic';
import { createMarker, type AnyMarker } from '$lib/engine/markerFactory';
import { generateId } from '$lib/engine/id';

export function createGateFlow() {
	let center = $state<LngLat | null>(null);

	return {
		get center() {
			return center;
		},
		handleClick(lngLat: LngLat): void {
			if (!center) {
				center = lngLat;
				toolStore.setStatus('Click to set driving direction through the gate');
				return;
			}
			courseStore.pushUndo();
			const { left, right } = computeGateCones(center, lngLat, toolStore.gateWidthFeet, mapStore.mode);
			courseStore.addCone({ id: generateId(), type: 'regular', lngLat: left, lockedTargetId: null });
			courseStore.addCone({ id: generateId(), type: 'regular', lngLat: right, lockedTargetId: null });
			if (toolStore.gateDirectionalCones) {
				const { leftDirectional, rightDirectional } = computeDirectionalCones(
					center, lngLat, toolStore.gateWidthFeet, mapStore.mode
				);
				courseStore.addCone({ id: generateId(), type: 'pointer', lngLat: leftDirectional, lockedTargetId: null });
				courseStore.addCone({ id: generateId(), type: 'pointer', lngLat: rightDirectional, lockedTargetId: null });
			}
			center = null;
			toolStore.clearStatus();
		},
		reset(): void {
			center = null;
		}
	};
}

export function createSlalomFlow() {
	let start = $state<LngLat | null>(null);
	let end = $state<LngLat | null>(null);
	let showDialog = $state(false);

	function clearAll(): void {
		start = null;
		end = null;
		showDialog = false;
	}

	return {
		get start() {
			return start;
		},
		get end() {
			return end;
		},
		get showDialog() {
			return showDialog;
		},
		handleClick(lngLat: LngLat): void {
			if (showDialog) return;
			if (!start) {
				start = lngLat;
				toolStore.setStatus('Click the end position for the slalom');
			} else {
				end = lngLat;
				showDialog = true;
				toolStore.clearStatus();
			}
		},
		confirm(count: number, spacingFeet: number): void {
			if (!start || !end) return;
			courseStore.pushUndo();
			const positions = computeSlalomPositions(
				start, end, { count, spacingFeet: spacingFeet || undefined }, mapStore.mode
			);
			for (const pos of positions) {
				courseStore.addCone({ id: generateId(), type: 'regular', lngLat: pos, lockedTargetId: null });
			}
			clearAll();
		},
		cancel(): void {
			clearAll();
			toolStore.clearStatus();
		},
		// Tool switch keeps pending points while the dialog is deciding their fate
		reset(): void {
			if (!showDialog) {
				start = null;
				end = null;
			}
		}
	};
}

export function createScaleFlow() {
	let point1 = $state<LngLat | null>(null);
	let marker: AnyMarker | null = null;
	let pixelDist = $state(0);
	let showDialog = $state(false);

	function clearPoint(): void {
		point1 = null;
		marker?.remove();
		marker = null;
	}

	return {
		get pixelDist() {
			return pixelDist;
		},
		get showDialog() {
			return showDialog;
		},
		handleClick(lngLat: LngLat): void {
			if (!point1) {
				point1 = lngLat;
				const map = mapStore.map!;
				const el = document.createElement('div');
				el.className = 'measurement-endpoint';
				marker = createMarker(mapStore.mode, { element: el })
					.setLngLat(lngLat as [number, number])
					.addTo(map);
				toolStore.setStatus('Click the second point to set scale');
			} else {
				const dx = lngLat[0] - point1[0];
				const dy = lngLat[1] - point1[1];
				pixelDist = Math.sqrt(dx * dx + dy * dy);
				showDialog = true;
				clearPoint();
				toolStore.clearStatus();
			}
		},
		confirm(feetPerPixel: number): void {
			const map = mapStore.map;
			if (map && 'setScale' in map) {
				map.setScale(feetPerPixel);
			}
			// Persist so saved/shared image courses reopen already calibrated.
			courseStore.course.imageScale = feetPerPixel;
			showDialog = false;
			toolStore.setStatus(`Scale: ${feetPerPixel.toFixed(4)} ft/px`);
		},
		cancel(): void {
			showDialog = false;
			clearPoint();
			toolStore.clearStatus();
		},
		reset(): void {
			clearPoint();
		}
	};
}

export function createHazardLineFlow() {
	let points = $state<LngLat[]>([]);

	return {
		get points() {
			return points;
		},
		handleClick(lngLat: LngLat): void {
			if (points.length === 0) {
				points = [lngLat];
				toolStore.setStatus('Click second point to finish hazard line.');
			} else {
				courseStore.pushUndo();
				courseStore.addHazardMarker({
					id: generateId(),
					type: 'line',
					coordinates: [points[0], lngLat],
					bufferFeet: toolStore.hazardBufferFeet
				});
				points = [];
				toolStore.clearStatus();
			}
		},
		reset(): void {
			points = [];
		}
	};
}
