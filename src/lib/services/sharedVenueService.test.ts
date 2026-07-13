import { describe, expect, it } from 'vitest';
import { mapSharedVenueRow, toSharedVenueRow, type SharedVenueRow } from './sharedVenueService';
import type { HazardMarkerData, ObstacleData } from '$lib/types/course';

const hazardMarkers: HazardMarkerData[] = [
	{ id: 'h1', type: 'point', coordinates: [[-80.05, 40.44]], bufferFeet: 15 },
	{
		id: 'h2',
		type: 'line',
		coordinates: [
			[-80.05, 40.44],
			[-80.06, 40.45]
		],
		bufferFeet: 10
	}
];

const obstacles: ObstacleData[] = [{ id: 'o1', type: 'pole', lngLat: [-80.051, 40.441] }];

describe('mapSharedVenueRow', () => {
	it('maps snake_case columns to camelCase fields', () => {
		const row: SharedVenueRow = {
			id: 'abc',
			name: 'Cumberland Lot',
			map_center: [-80.05, 40.44],
			map_zoom: 17.5,
			hazard_markers: hazardMarkers,
			obstacles
		};
		expect(mapSharedVenueRow(row)).toEqual({
			id: 'abc',
			name: 'Cumberland Lot',
			mapCenter: [-80.05, 40.44],
			mapZoom: 17.5,
			hazardMarkers,
			obstacles
		});
	});
});

describe('toSharedVenueRow', () => {
	it('maps camelCase fields to snake_case columns without an id', () => {
		const row = toSharedVenueRow({
			name: 'Cumberland Lot',
			mapCenter: [-80.05, 40.44],
			mapZoom: 17.5,
			hazardMarkers,
			obstacles
		});
		expect(row).toEqual({
			name: 'Cumberland Lot',
			map_center: [-80.05, 40.44],
			map_zoom: 17.5,
			hazard_markers: hazardMarkers,
			obstacles
		});
		expect('id' in row).toBe(false);
	});

	it('round-trips through mapSharedVenueRow', () => {
		const venue = {
			name: 'Beaver Run',
			mapCenter: [-79.7, 40.8] as [number, number],
			mapZoom: 16,
			hazardMarkers,
			obstacles
		};
		const mapped = mapSharedVenueRow({ id: 'x', ...toSharedVenueRow(venue) });
		expect(mapped).toEqual({ id: 'x', ...venue });
	});
});
