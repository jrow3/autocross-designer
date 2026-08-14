import type { LayerKey } from '$lib/stores/layerStore.svelte';

export type ModeId = 'venue' | 'design' | 'annotate' | 'share';
export type DockTab = 'findings' | 'stats' | 'generator' | 'course';

export interface ModeDef {
	id: ModeId;
	label: string;
	autoShowLayers: LayerKey[];
	defaultDockTab: DockTab;
}

export const MODES: ModeDef[] = [
	{
		id: 'venue',
		label: 'Venue',
		autoShowLayers: ['hazardMarkers', 'stagingAreas'],
		defaultDockTab: 'findings'
	},
	{
		id: 'design',
		label: 'Design',
		autoShowLayers: ['cones', 'sketches', 'courseOutline', 'workerZones'],
		defaultDockTab: 'findings'
	},
	{
		id: 'annotate',
		label: 'Annotate',
		autoShowLayers: ['coneNumbers', 'notes', 'workers', 'drivingLine', 'measurements'],
		defaultDockTab: 'findings'
	},
	{
		id: 'share',
		label: 'Review & Share',
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
		],
		defaultDockTab: 'course'
	}
];
