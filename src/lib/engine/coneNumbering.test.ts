import { describe, expect, it } from 'vitest';
import { numberCones } from './coneNumbering';
import type { ConeData, LngLat, WaypointData, WorkerZoneData } from '$lib/types/course';

function cone(id: string, lngLat: LngLat, type: ConeData['type'] = 'regular'): ConeData {
	return { id, type, lngLat, lockedTargetId: null };
}

function zone(id: string, stationNumber: number, vertices: LngLat[]): WorkerZoneData {
	return { id, stationNumber, vertices };
}

const square: LngLat[] = [
	[0, 0],
	[10, 0],
	[10, 10],
	[0, 10]
];

const lineThrough: WaypointData[] = [{ lngLat: [-5, 5] }, { lngLat: [15, 5] }];

describe('numberCones', () => {
	it('numbers cones as stationNumber*100 + order along the driving line', () => {
		const cones = [
			cone('c-mid', [5, 5]),
			cone('c-first', [2, 5]),
			cone('c-last', [8, 5])
		];
		const result = numberCones(cones, [zone('z1', 3, square)], lineThrough);
		expect(result).toEqual({
			'c-first': '301',
			'c-mid': '302',
			'c-last': '303'
		});
	});

	it('excludes cones outside every zone and pointer cones inside', () => {
		const cones = [
			cone('inside', [5, 5]),
			cone('outside', [20, 20]),
			cone('ptr', [3, 5], 'pointer')
		];
		const result = numberCones(cones, [zone('z1', 2, square)], lineThrough);
		expect(result).toEqual({ inside: '201' });
	});

	it('falls back to nearest-neighbor ordering when the line misses the zone', () => {
		const farSquare: LngLat[] = [
			[100, 100],
			[110, 100],
			[110, 110],
			[100, 110]
		];
		const cones = [
			cone('b', [102, 102]),
			cone('c', [105, 105]),
			cone('a', [101, 101])
		];
		const result = numberCones(cones, [zone('z1', 1, farSquare)], lineThrough);
		expect(result).toEqual({ a: '101', b: '102', c: '103' });
	});

	it('numbers zones independently', () => {
		const secondSquare: LngLat[] = [
			[20, 0],
			[30, 0],
			[30, 10],
			[20, 10]
		];
		const cones = [cone('one', [5, 5]), cone('two', [25, 5])];
		const zones = [zone('z1', 1, square), zone('z2', 4, secondSquare)];
		const result = numberCones(cones, zones, []);
		expect(result).toEqual({ one: '101', two: '401' });
	});

	it('returns an empty map with no zones or no cones in zones', () => {
		expect(numberCones([cone('c', [5, 5])], [], lineThrough)).toEqual({});
		expect(numberCones([], [zone('z1', 1, square)], lineThrough)).toEqual({});
	});
});
