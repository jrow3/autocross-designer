import mapboxgl from 'mapbox-gl';
import { ImageMarker, type ImageMap } from './imageMap';

interface MarkerOptions {
	element: HTMLElement;
	draggable?: boolean;
}

// Structural subset shared by mapboxgl.Marker and ImageMarker. A plain union is
// uncallable here: addTo() on a union receiver demands mapboxgl.Map & ImageMap.
export interface AnyMarker {
	setLngLat(coords: [number, number] | { lng: number; lat: number }): AnyMarker;
	getLngLat(): { lng: number; lat: number };
	addTo(map: mapboxgl.Map | ImageMap): AnyMarker;
	remove(): void;
	on(event: string, cb: (e?: unknown) => void): AnyMarker;
	getElement(): HTMLElement;
}

export function createMarker(mode: 'map' | 'image', opts: MarkerOptions): AnyMarker {
	if (mode === 'image') {
		return new ImageMarker(opts);
	}
	return new mapboxgl.Marker(opts);
}

/**
 * Wraps a visual element in a plain div so Mapbox can control the wrapper's
 * transform for positioning, while the inner element keeps its own CSS transform
 * (e.g. scale) without conflict.
 */
export function wrapForMapbox(mode: 'map' | 'image', inner: HTMLElement): HTMLDivElement {
	if (mode === 'image') return inner as HTMLDivElement;
	const wrapper = document.createElement('div');
	wrapper.style.cssText = 'cursor:pointer;';
	wrapper.appendChild(inner);
	return wrapper;
}
