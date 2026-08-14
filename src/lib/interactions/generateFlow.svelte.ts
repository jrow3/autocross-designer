import { courseStore } from '$lib/stores/courseStore.svelte';
import { mapStore } from '$lib/stores/mapStore.svelte';
import { toolStore } from '$lib/stores/toolStore.svelte';
import { generateCourse, type GeneratedCourse, type GeneratorOptions } from '$lib/engine/generator/courseGenerator';
import { sketchToWaypoints, stitchSketches } from '$lib/engine/sketchToLine';
import { generateId } from '$lib/engine/id';

// Types the generator emits — a run replaces these, leaving hand-placed
// trailers, staging grids, and lying cones alone.
const GENERATED_TYPES = new Set(['regular', 'pointer', 'start-cone', 'finish-cone']);

// Promote the freehand sketches into the driving line (one undo step):
// multiple strokes are stitched end-to-end by best-fit before resampling.
export function useSketchAsDrivingLine(): boolean {
	const sketches = courseStore.course.sketches;
	if (sketches.length === 0) return false;

	const feetPerPixel = mapStore.mode === 'image' ? mapStore.feetPerPixel ?? undefined : undefined;
	const merged = stitchSketches(sketches.map((s) => s.points), mapStore.mode, feetPerPixel);
	const waypoints = sketchToWaypoints(merged, mapStore.mode, feetPerPixel);
	if (!waypoints) return false;

	courseStore.pushUndo();
	courseStore.clearDrivingLine();
	for (const waypoint of waypoints) courseStore.addWaypoint(waypoint);
	for (const sketch of [...sketches]) courseStore.removeSketch(sketch.id);
	toolStore.setStatus(
		sketches.length > 1
			? `Centerline stitched from ${sketches.length} sketches (${waypoints.length} waypoints) — drag points to refine`
			: `Centerline created from your sketch (${waypoints.length} waypoints) — drag points to refine`
	);
	return true;
}

export function runGenerator(options: GeneratorOptions): GeneratedCourse | null {
	const feetPerPixel = mapStore.mode === 'image' ? mapStore.feetPerPixel ?? undefined : undefined;
	const result = generateCourse(
		courseStore.course.drivingLine,
		options,
		mapStore.mode,
		feetPerPixel,
		{ hazards: courseStore.course.hazardMarkers, outline: courseStore.course.courseOutline }
	);
	if (!result) return null;

	courseStore.pushUndo();
	for (const cone of courseStore.course.cones.filter((c) => GENERATED_TYPES.has(c.type))) {
		courseStore.removeCone(cone.id);
	}
	for (const cone of result.cones) {
		courseStore.addCone({ ...cone, id: generateId() });
	}
	toolStore.setStatus(`Generated ${result.stats.coneCount} cones (${result.stats.gateCount} gates, ${result.stats.slalomCount} slaloms)`);
	return result;
}
