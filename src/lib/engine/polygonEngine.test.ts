import { describe, expect, it } from 'vitest';
import { pointInPolygon, polygonToGeoJSON, lineToGeoJSON, verticesCollection } from './polygonEngine';
import type { LngLat } from '$lib/types/course';

const square: LngLat[] = [
	[0, 0],
	[10, 0],
	[10, 10],
	[0, 10]
];

describe('pointInPolygon', () => {
	it('detects interior points', () => {
		expect(pointInPolygon([5, 5], square)).toBe(true);
		expect(pointInPolygon([0.1, 0.1], square)).toBe(true);
	});

	it('rejects exterior points', () => {
		expect(pointInPolygon([15, 5], square)).toBe(false);
		expect(pointInPolygon([5, -1], square)).toBe(false);
		expect(pointInPolygon([-0.1, 0.1], square)).toBe(false);
	});

	it('classifies vertices asymmetrically (ray-cast edge behavior)', () => {
		expect(pointInPolygon([0, 0], square)).toBe(true);
		expect(pointInPolygon([10, 10], square)).toBe(false);
	});

	it('handles a concave polygon', () => {
		const concave: LngLat[] = [
			[0, 0],
			[10, 0],
			[10, 10],
			[5, 5],
			[0, 10]
		];
		expect(pointInPolygon([5, 7], concave)).toBe(false);
		expect(pointInPolygon([2, 2], concave)).toBe(true);
	});
});

describe('polygonToGeoJSON', () => {
	it('closes the ring by repeating the first vertex last', () => {
		const feature = polygonToGeoJSON(square);
		const ring = feature.geometry.coordinates[0];
		expect(ring).toHaveLength(square.length + 1);
		expect(ring[0]).toEqual(square[0]);
		expect(ring[ring.length - 1]).toEqual(square[0]);
	});

	it('wraps the ring as a Polygon Feature', () => {
		const feature = polygonToGeoJSON(square);
		expect(feature.type).toBe('Feature');
		expect(feature.geometry.type).toBe('Polygon');
		expect(feature.properties).toEqual({});
	});
});

describe('lineToGeoJSON', () => {
	it('passes points through as a LineString', () => {
		const points: LngLat[] = [
			[0, 0],
			[1, 2]
		];
		const feature = lineToGeoJSON(points);
		expect(feature.geometry.type).toBe('LineString');
		expect(feature.geometry.coordinates).toEqual(points);
	});
});

describe('verticesCollection', () => {
	it('emits one Point feature per vertex with its index', () => {
		const collection = verticesCollection(square);
		expect(collection.type).toBe('FeatureCollection');
		expect(collection.features).toHaveLength(4);
		collection.features.forEach((f, i) => {
			expect(f.properties).toEqual({ index: i });
			expect(f.geometry).toEqual({ type: 'Point', coordinates: square[i] });
		});
	});
});
