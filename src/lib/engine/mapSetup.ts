import mapboxgl from 'mapbox-gl';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import type { LngLat } from '$lib/types/course';

export interface MapSetupOptions {
	center: LngLat;
	zoom: number;
	token: string;
}

export function createMapboxMap(container: HTMLElement, options: MapSetupOptions): mapboxgl.Map {
	mapboxgl.accessToken = options.token;
	mapboxgl.workerUrl = '/mapbox-gl-csp-worker.js';

	const map = new mapboxgl.Map({
		container,
		style: 'mapbox://styles/mapbox/satellite-streets-v12',
		center: options.center as [number, number],
		zoom: options.zoom,
		minZoom: 10,
		maxZoom: 22,
		preserveDrawingBuffer: true,
		dragRotate: false,
		pitchWithRotate: false,
		touchPitch: false
	});

	map.doubleClickZoom.disable();
	map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

	map.addControl(new MapboxGeocoder({
		accessToken: options.token,
		mapboxgl: mapboxgl as never,
		collapsed: true,
		placeholder: 'Search location...'
	}), 'top-right');

	return map;
}
