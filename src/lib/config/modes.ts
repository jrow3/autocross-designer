import type { LayerKey } from '$lib/stores/layerStore.svelte';

export type ModeId = 'venue' | 'design' | 'annotate' | 'share';

export interface ModeDef {
	id: ModeId;
	label: string;
	autoShowLayers: LayerKey[];
}

export const MODES: ModeDef[] = [
	{
		id: 'venue',
		label: 'Venue & Safety',
		autoShowLayers: ['hazardMarkers', 'stagingAreas']
	},
	{
		id: 'design',
		label: 'Design',
		autoShowLayers: ['cones', 'sketches', 'courseOutline', 'workerZones']
	},
	{
		id: 'annotate',
		label: 'Annotate',
		autoShowLayers: ['coneNumbers', 'notes', 'workers', 'drivingLine', 'measurements']
	},
	{
		id: 'share',
		label: 'Check & Share',
		// All 11 content layers — everything except the grid overlay.
		autoShowLayers: [
			'cones',
			'workers',
			'drivingLine',
			'measurements',
			'notes',
			'courseOutline',
			'sketches',
			'stagingAreas',
			'workerZones',
			'hazardMarkers',
			'coneNumbers'
		]
	}
];
