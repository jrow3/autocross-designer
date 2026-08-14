import { type CourseData, type ConeData, type ObstacleData, type WorkerData, type NoteData, type WaypointData, type MeasurementData, type OutlineSegmentData, type SketchData, type LngLat, type StagingAreaData, type WorkerZoneData, type HazardMarkerData, type BarrierData, type ConeNumberMap } from '$lib/types/course';
import { emptyCourse } from '$lib/engine/courseSerializer';

const MAX_SNAPSHOTS = 50;

let course = $state<CourseData>(emptyCourse());
let undoStack = $state<string[]>([]);
let redoStack = $state<string[]>([]);

function snapshot(): string {
	return JSON.stringify(course);
}

function restore(json: string): void {
	// Snapshots are full stringifies of course, so every field is present
	Object.assign(course, JSON.parse(json) as CourseData);
}

export const courseStore = {
	get course() {
		return course;
	},

	get canUndo() {
		return undoStack.length > 0;
	},

	get canRedo() {
		return redoStack.length > 0;
	},

	pushUndo(): void {
		undoStack.push(snapshot());
		if (undoStack.length > MAX_SNAPSHOTS) {
			undoStack.shift();
		}
		redoStack.length = 0;
	},

	undo(): void {
		if (undoStack.length === 0) return;
		redoStack.push(snapshot());
		restore(undoStack.pop()!);
	},

	redo(): void {
		if (redoStack.length === 0) return;
		undoStack.push(snapshot());
		restore(redoStack.pop()!);
	},

	addCone(cone: ConeData): void {
		course.cones.push(cone);
	},

	removeCone(id: string): void {
		const idx = course.cones.findIndex((c) => c.id === id);
		if (idx !== -1) course.cones.splice(idx, 1);
	},

	updateConePosition(id: string, lngLat: LngLat): void {
		const cone = course.cones.find((c) => c.id === id);
		if (cone) cone.lngLat = lngLat;
	},

	updateConeDimensions(id: string, width: number, height: number): void {
		const cone = course.cones.find((c) => c.id === id);
		if (cone) {
			cone.width = width;
			cone.height = height;
		}
	},

	updateConeRotation(id: string, rotation: number): void {
		const cone = course.cones.find((c) => c.id === id);
		if (cone) cone.rotation = rotation;
	},

	addObstacle(obstacle: ObstacleData): void {
		course.obstacles.push(obstacle);
	},

	addWorker(worker: WorkerData): void {
		course.workers.push(worker);
	},

	removeWorker(id: string): void {
		const idx = course.workers.findIndex((w) => w.id === id);
		if (idx !== -1) {
			course.workers.splice(idx, 1);
			course.workers.forEach((w, i) => (w.number = i + 1));
		}
	},

	updateWorkerPosition(id: string, lngLat: LngLat): void {
		const w = course.workers.find((w) => w.id === id);
		if (w) w.lngLat = lngLat;
	},

	updateWorkerName(id: string, name: string): void {
		const w = course.workers.find((w) => w.id === id);
		if (w) w.name = name || undefined;
	},

	addNote(note: NoteData): void {
		course.notes.push(note);
	},

	removeNote(id: string): void {
		const idx = course.notes.findIndex((n) => n.id === id);
		if (idx !== -1) course.notes.splice(idx, 1);
	},

	updateNotePosition(id: string, lngLat: LngLat): void {
		const n = course.notes.find((n) => n.id === id);
		if (n) n.lngLat = lngLat;
	},

	addWaypoint(wp: WaypointData): void {
		course.drivingLine.push(wp);
	},

	removeWaypoint(index: number): void {
		course.drivingLine.splice(index, 1);
	},

	updateWaypointPosition(index: number, lngLat: LngLat): void {
		if (course.drivingLine[index]) course.drivingLine[index].lngLat = lngLat;
	},

	clearDrivingLine(): void {
		course.drivingLine.length = 0;
	},

	addMeasurement(m: MeasurementData): void {
		course.measurements.push(m);
	},

	removeMeasurement(index: number): void {
		course.measurements.splice(index, 1);
	},

	updateMeasurementEndpoint(index: number, endpoint: 0 | 1, lngLat: LngLat): void {
		const m = course.measurements[index];
		if (!m) return;
		if (endpoint === 0) {
			m.p1 = lngLat;
			m.coneId1 = null;
		} else {
			m.p2 = lngLat;
			m.coneId2 = null;
		}
	},

	addOutlineSegment(seg: OutlineSegmentData): void {
		course.courseOutline.push(seg);
	},

	removeOutlineSegment(index: number): void {
		course.courseOutline.splice(index, 1);
	},

	updateOutlineEndpoint(index: number, endpoint: 0 | 1, lngLat: LngLat): void {
		const seg = course.courseOutline[index];
		if (!seg) return;
		if (endpoint === 0) seg.p1 = lngLat;
		else seg.p2 = lngLat;
	},

	updateOutlineControlPoint(index: number, lngLat: LngLat): void {
		const seg = course.courseOutline[index];
		if (seg) seg.cp = lngLat;
	},

	addSketch(sketch: SketchData): void {
		course.sketches.push(sketch);
	},

	removeSketch(id: string): void {
		const idx = course.sketches.findIndex((s) => s.id === id);
		if (idx !== -1) course.sketches.splice(idx, 1);
	},

	addStagingArea(area: StagingAreaData): void {
		course.stagingAreas = [...course.stagingAreas, area];
	},

	removeStagingArea(id: string): void {
		course.stagingAreas = course.stagingAreas.filter((a) => a.id !== id);
	},

	addWorkerZone(zone: WorkerZoneData): void {
		course.workerZones = [...course.workerZones, zone];
	},

	removeWorkerZone(id: string): void {
		course.workerZones = course.workerZones.filter((z) => z.id !== id);
	},

	addHazardMarker(marker: HazardMarkerData): void {
		course.hazardMarkers = [...course.hazardMarkers, marker];
	},

	addBarrier(barrier: BarrierData): void {
		course.barriers = [...course.barriers, barrier];
	},

	appendBarrierPoint(id: string, point: LngLat): void {
		const barrier = course.barriers.find((b) => b.id === id);
		if (barrier) barrier.points = [...barrier.points, point];
	},

	removeBarrier(id: string): void {
		course.barriers = course.barriers.filter((b) => b.id !== id);
	},

	removeHazardMarker(id: string): void {
		course.hazardMarkers = course.hazardMarkers.filter((m) => m.id !== id);
	},

	setConeNumbers(numbers: ConeNumberMap): void {
		course.coneNumbers = { ...numbers };
	},

	clearConeNumbers(): void {
		course.coneNumbers = {};
	},

	setMapView(center: LngLat, zoom: number): void {
		course.mapCenter = center;
		course.mapZoom = zoom;
	},

	applyVenue(venue: {
		mapCenter: LngLat;
		mapZoom: number;
		hazardMarkers: HazardMarkerData[];
		obstacles: ObstacleData[];
	}): void {
		course.mapCenter = venue.mapCenter;
		course.mapZoom = venue.mapZoom;
		course.hazardMarkers = [...venue.hazardMarkers];
		course.obstacles = [...venue.obstacles];
	},

	load(data: CourseData): void {
		// Deduplicate IDs to prevent keyed {#each} crashes
		const seen = new Set<string>();
		let nextDedup = Date.now();
		for (const arr of [data.cones, data.obstacles, data.workers, data.notes, data.sketches ?? []]) {
			for (const item of arr) {
				if (seen.has(item.id)) {
					item.id = String(nextDedup++);
				}
				seen.add(item.id);
			}
		}
		// Start from a full empty course so fields the payload omits (older
		// schema versions) never leak through from the previous course.
		Object.assign(course, { ...emptyCourse(), ...data });
		undoStack.length = 0;
		redoStack.length = 0;
	}
};
