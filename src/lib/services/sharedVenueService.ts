import { getSupabase } from './supabase';
import type { HazardMarkerData, LngLat, ObstacleData } from '$lib/types/course';

export interface SharedVenue {
	id: string;
	name: string;
	mapCenter: LngLat;
	mapZoom: number;
	hazardMarkers: HazardMarkerData[];
	obstacles: ObstacleData[];
}

export interface SharedVenueSummary {
	id: string;
	name: string;
}

export interface SharedVenueRow {
	id: string;
	name: string;
	map_center: LngLat;
	map_zoom: number;
	hazard_markers: HazardMarkerData[];
	obstacles: ObstacleData[];
}

export function mapSharedVenueRow(row: SharedVenueRow): SharedVenue {
	return {
		id: row.id,
		name: row.name,
		mapCenter: row.map_center,
		mapZoom: row.map_zoom,
		hazardMarkers: row.hazard_markers,
		obstacles: row.obstacles
	};
}

export function toSharedVenueRow(venue: Omit<SharedVenue, 'id'>): Omit<SharedVenueRow, 'id'> {
	return {
		name: venue.name,
		map_center: venue.mapCenter,
		map_zoom: venue.mapZoom,
		hazard_markers: venue.hazardMarkers,
		obstacles: venue.obstacles
	};
}

export async function listSharedVenues(): Promise<SharedVenueSummary[]> {
	const sb = getSupabase();
	if (!sb) return [];

	const { data: rows, error } = await sb
		.from('shared_venues')
		.select('id, name')
		.order('name');

	if (error) {
		console.error('listSharedVenues:', error);
		return [];
	}
	return (rows ?? []) as SharedVenueSummary[];
}

export async function loadSharedVenue(id: string): Promise<SharedVenue | null> {
	const sb = getSupabase();
	if (!sb) return null;

	const { data: row, error } = await sb
		.from('shared_venues')
		.select()
		.eq('id', id)
		.single();

	if (error) {
		console.error('loadSharedVenue:', error);
		return null;
	}
	return mapSharedVenueRow(row as SharedVenueRow);
}

export async function saveSharedVenue(venue: Omit<SharedVenue, 'id'>): Promise<boolean> {
	const sb = getSupabase();
	if (!sb) return false;

	const { error } = await sb
		.from('shared_venues')
		.upsert(toSharedVenueRow(venue), { onConflict: 'name' });

	if (error) {
		console.error('saveSharedVenue:', error);
		return false;
	}
	return true;
}

export async function deleteSharedVenue(id: string): Promise<boolean> {
	const sb = getSupabase();
	if (!sb) return false;

	const { error } = await sb
		.from('shared_venues')
		.delete()
		.eq('id', id);

	if (error) {
		console.error('deleteSharedVenue:', error);
		return false;
	}
	return true;
}
