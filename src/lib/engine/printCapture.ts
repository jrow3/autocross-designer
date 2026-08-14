import type mapboxgl from 'mapbox-gl';
import type { ImageMap } from './imageMap';
import type { CourseData } from '$lib/types/course';
import { BARRIER_COLOR, CONE_COLORS, coneColor, NOTE_COLOR, WORKER_COLOR } from '$lib/config/palette';

export interface CaptureOptions {
	map: mapboxgl.Map | ImageMap | null;
	mode: 'map' | 'image';
	course: CourseData;
	mapFade: number;
	markerSize: number;
	// Upscales the output canvas; overlay elements render crisply, map tiles
	// upscale from screen resolution.
	scale?: number;
	isLayerVisible: (layer: 'cones' | 'workers' | 'notes' | 'barriers') => boolean;
}

export async function captureMapCanvas(options: CaptureOptions): Promise<HTMLCanvasElement | null> {
	const { map, mode, course, mapFade, markerSize, isLayerVisible } = options;
	const scale = options.scale ?? 1;
	if (!map) return null;

	if (mode !== 'map') {
		if ('getCanvas' in map) return map.getCanvas();
		return null;
	}

	if (!('getCanvas' in map)) return null;
	const mapCanvas = map.getCanvas();
	if (!mapCanvas) return null;

	const copy = document.createElement('canvas');
	copy.width = mapCanvas.width * scale;
	copy.height = mapCanvas.height * scale;
	const ctx = copy.getContext('2d')!;

	// Draw map tiles
	ctx.drawImage(mapCanvas, 0, 0, copy.width, copy.height);

	// Apply map fade as a filter overlay
	if (mapFade > 0) {
		const alpha = mapFade / 100 * 0.8;
		ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
		ctx.fillRect(0, 0, copy.width, copy.height);
	}

	const ratio = copy.width / mapCanvas.clientWidth;
	const markerScale = markerSize;

	// Draw cones
	if (isLayerVisible('cones')) {
		for (const cone of course.cones) {
			const px = map.project(cone.lngLat);
			const x = px.x * ratio;
			const y = px.y * ratio;

			if (cone.type === 'trailer') {
				const w = (cone.width ?? 80) * markerScale * ratio * 0.15;
				const h = (cone.height ?? 40) * markerScale * ratio * 0.15;
				ctx.save();
				ctx.translate(x, y);
				if (cone.rotation) ctx.rotate(cone.rotation * Math.PI / 180);
				ctx.fillStyle = CONE_COLORS.trailer;
				ctx.fillRect(-w / 2, -h / 2, w, h);
				ctx.strokeStyle = '#ffffff';
				ctx.lineWidth = ratio;
				ctx.strokeRect(-w / 2, -h / 2, w, h);
				ctx.restore();
			} else {
				const r = 5 * markerScale * ratio;
				ctx.beginPath();
				ctx.arc(x, y, r, 0, Math.PI * 2);
				ctx.fillStyle = coneColor(cone.type);
				ctx.fill();
				ctx.strokeStyle = '#000000';
				ctx.lineWidth = 1.5 * ratio;
				ctx.stroke();
				// Glow effect
				ctx.shadowColor = coneColor(cone.type);
				ctx.shadowBlur = 4 * ratio;
				ctx.beginPath();
				ctx.arc(x, y, r, 0, Math.PI * 2);
				ctx.fill();
				ctx.shadowBlur = 0;
			}
		}
	}

	// Draw walls
	if (isLayerVisible('barriers')) {
		for (const barrier of course.barriers ?? []) {
			if (barrier.points.length < 2) continue;
			ctx.beginPath();
			barrier.points.forEach((p, i) => {
				const px = map.project(p);
				if (i === 0) ctx.moveTo(px.x * ratio, px.y * ratio);
				else ctx.lineTo(px.x * ratio, px.y * ratio);
			});
			ctx.strokeStyle = BARRIER_COLOR;
			ctx.lineWidth = 3 * ratio;
			ctx.stroke();
		}
	}

	// Draw workers
	if (isLayerVisible('workers')) {
		for (const w of course.workers) {
			const px = map.project(w.lngLat);
			const x = px.x * ratio;
			const y = px.y * ratio;
			const r = 8 * markerScale * ratio;

			ctx.beginPath();
			ctx.arc(x, y, r, 0, Math.PI * 2);
			ctx.fillStyle = WORKER_COLOR;
			ctx.fill();
			ctx.strokeStyle = '#ffffff';
			ctx.lineWidth = 1.5 * ratio;
			ctx.stroke();

			ctx.fillStyle = '#ffffff';
			ctx.font = `bold ${8 * markerScale * ratio}px sans-serif`;
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.fillText(String(w.number), x, y);
		}
	}

	// Draw notes
	if (isLayerVisible('notes')) {
		for (const n of course.notes) {
			const px = map.project(n.lngLat);
			const x = px.x * ratio;
			const y = px.y * ratio;
			const r = 8 * markerScale * ratio;

			ctx.beginPath();
			ctx.arc(x, y, r, 0, Math.PI * 2);
			ctx.fillStyle = NOTE_COLOR;
			ctx.fill();
			ctx.strokeStyle = '#ffffff';
			ctx.lineWidth = 1.5 * ratio;
			ctx.stroke();

			ctx.fillStyle = '#ffffff';
			ctx.font = `bold ${8 * markerScale * ratio}px sans-serif`;
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.fillText(String(n.number), x, y);
		}
	}

	return copy;
}

export interface PrintLayout {
	title: string;
	showConeCount: boolean;
	showLegend: boolean;
	showScaleBar: boolean;
}

export function renderPrintCanvas(
	mapCanvas: HTMLCanvasElement,
	layout: PrintLayout,
	coneCount: number,
	lineLength: string
): HTMLCanvasElement {
	const padding = 40;
	const headerHeight = layout.title ? 60 : 20;
	const footerHeight = (layout.showConeCount || layout.showLegend || layout.showScaleBar) ? 80 : 20;

	const width = mapCanvas.width + padding * 2;
	const height = mapCanvas.height + headerHeight + footerHeight;

	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext('2d')!;

	ctx.fillStyle = '#fff';
	ctx.fillRect(0, 0, width, height);

	if (layout.title) {
		ctx.fillStyle = '#1e293b';
		ctx.font = 'bold 24px -apple-system, sans-serif';
		ctx.textAlign = 'center';
		ctx.fillText(layout.title, width / 2, 36);
	}

	ctx.drawImage(mapCanvas, padding, headerHeight);

	const footerY = headerHeight + mapCanvas.height + 24;
	ctx.fillStyle = '#475569';
	ctx.font = '14px -apple-system, sans-serif';
	ctx.textAlign = 'left';

	let x = padding;

	if (layout.showConeCount) {
		ctx.fillText(`Cones: ${coneCount}`, x, footerY);
		x += 120;
		ctx.fillText(`Line: ${lineLength}`, x, footerY);
		x += 140;
	}

	if (layout.showLegend) {
		const legends = [
			{ color: CONE_COLORS.regular, label: 'Regular' },
			{ color: CONE_COLORS['start-cone'], label: 'Start' },
			{ color: CONE_COLORS.pointer, label: 'Pointer' }
		];
		for (const leg of legends) {
			ctx.fillStyle = leg.color;
			ctx.beginPath();
			ctx.arc(x + 6, footerY - 4, 5, 0, Math.PI * 2);
			ctx.fill();
			ctx.fillStyle = '#475569';
			ctx.fillText(leg.label, x + 16, footerY);
			x += 80;
		}
	}

	if (layout.showScaleBar) {
		ctx.fillStyle = '#475569';
		ctx.textAlign = 'right';
		ctx.fillText('Autocross Course Designer', width - padding, footerY);
	}

	return canvas;
}
