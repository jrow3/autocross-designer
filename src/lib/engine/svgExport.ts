import type { CourseData, LngLat } from '$lib/types/course';
import { catmullRomSpline } from './catmullRom';
import { BARRIER_COLOR, coneColor, DRIVING_LINE_COLOR, MEASURE_COLOR, NOTE_COLOR, WORKER_COLOR } from '$lib/config/palette';

interface Bounds {
	minX: number; minY: number; maxX: number; maxY: number;
}

function allPoints(data: CourseData): LngLat[] {
	const pts: LngLat[] = [];
	for (const c of data.cones) pts.push(c.lngLat);
	for (const w of data.workers) pts.push(w.lngLat);
	for (const n of data.notes) pts.push(n.lngLat);
	for (const wp of data.drivingLine) pts.push(wp.lngLat);
	for (const m of data.measurements) { pts.push(m.p1); pts.push(m.p2); }
	for (const s of data.courseOutline) { pts.push(s.p1); pts.push(s.p2); pts.push(s.cp); }
	return pts;
}

function getBounds(pts: LngLat[], padding = 20): Bounds {
	if (pts.length === 0) return { minX: 0, minY: 0, maxX: 100, maxY: 100 };
	let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
	for (const [x, y] of pts) {
		if (x < minX) minX = x;
		if (y < minY) minY = y;
		if (x > maxX) maxX = x;
		if (y > maxY) maxY = y;
	}
	return { minX: minX - padding, minY: minY - padding, maxX: maxX + padding, maxY: maxY + padding };
}

function tx(x: number, b: Bounds): number { return x - b.minX; }
function ty(y: number, b: Bounds): number { return y - b.minY; }

export interface SvgExportOptions {
	// 'dotted' renders the Nationals-style round-dot path.
	pathStyle?: 'dashed' | 'dotted';
}

export function exportSVG(data: CourseData, title = '', options: SvgExportOptions = {}): string {
	const pts = allPoints(data);
	const b = getBounds(pts);
	const w = b.maxX - b.minX;
	const h = b.maxY - b.minY;

	const lines: string[] = [];
	lines.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w.toFixed(2)} ${h.toFixed(2)}" width="${w.toFixed(0)}" height="${h.toFixed(0)}">`);
	lines.push(`<rect width="100%" height="100%" fill="#1a1a2e"/>`);

	if (title) {
		lines.push(`<text x="${w / 2}" y="16" text-anchor="middle" fill="#e2e8f0" font-size="14" font-family="sans-serif" font-weight="bold">${esc(title)}</text>`);
	}

	// Driving line
	if (data.drivingLine.length >= 2) {
		const coords = data.drivingLine.map((wp) => wp.lngLat);
		const smooth = catmullRomSpline(coords, 20);
		const d = smooth.map((p, i) => `${i === 0 ? 'M' : 'L'}${tx(p[0], b).toFixed(2)},${ty(p[1], b).toFixed(2)}`).join(' ');
		const dash =
			options.pathStyle === 'dotted'
				? 'stroke-dasharray="0.1,8" stroke-linecap="round" stroke-width="3"'
				: 'stroke-dasharray="4,4" stroke-width="2"';
		lines.push(`<path d="${d}" fill="none" stroke="${DRIVING_LINE_COLOR}" ${dash}/>`);
	}

	// Measurements
	for (const m of data.measurements) {
		lines.push(`<line x1="${tx(m.p1[0], b).toFixed(2)}" y1="${ty(m.p1[1], b).toFixed(2)}" x2="${tx(m.p2[0], b).toFixed(2)}" y2="${ty(m.p2[1], b).toFixed(2)}" stroke="${MEASURE_COLOR}" stroke-width="1.5" stroke-dasharray="4,3"/>`);
	}

	// Course outline
	for (const s of data.courseOutline) {
		lines.push(`<path d="M${tx(s.p1[0], b).toFixed(2)},${ty(s.p1[1], b).toFixed(2)} Q${tx(s.cp[0], b).toFixed(2)},${ty(s.cp[1], b).toFixed(2)} ${tx(s.p2[0], b).toFixed(2)},${ty(s.p2[1], b).toFixed(2)}" fill="none" stroke="#fff" stroke-width="2"/>`);
	}

	// Walls
	for (const barrier of data.barriers ?? []) {
		const pts = barrier.points.map((p) => `${tx(p[0], b).toFixed(2)},${ty(p[1], b).toFixed(2)}`).join(' ');
		lines.push(`<polyline points="${pts}" fill="none" stroke="${BARRIER_COLOR}" stroke-width="3"/>`);
	}

	// Cones
	for (const c of data.cones) {
		const cx = tx(c.lngLat[0], b).toFixed(2);
		const cy = ty(c.lngLat[1], b).toFixed(2);
		lines.push(`<circle cx="${cx}" cy="${cy}" r="4" fill="${coneColor(c.type)}" stroke="#fff" stroke-width="1"/>`);
	}

	// Workers
	for (const w of data.workers) {
		const wx = tx(w.lngLat[0], b).toFixed(2);
		const wy = ty(w.lngLat[1], b).toFixed(2);
		lines.push(`<circle cx="${wx}" cy="${wy}" r="8" fill="${WORKER_COLOR}" stroke="#fff" stroke-width="1.5"/>`);
		lines.push(`<text x="${wx}" y="${wy}" text-anchor="middle" dominant-baseline="central" fill="#fff" font-size="8" font-weight="bold">${w.number}</text>`);
	}

	// Notes
	for (const n of data.notes) {
		const nx = tx(n.lngLat[0], b).toFixed(2);
		const ny = ty(n.lngLat[1], b).toFixed(2);
		lines.push(`<circle cx="${nx}" cy="${ny}" r="8" fill="${NOTE_COLOR}" stroke="#fff" stroke-width="1.5"/>`);
		lines.push(`<text x="${nx}" y="${ny}" text-anchor="middle" dominant-baseline="central" fill="#fff" font-size="8" font-weight="bold">${n.number}</text>`);
	}

	lines.push('</svg>');
	return lines.join('\n');
}

function esc(s: string): string {
	return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function downloadSVG(
	data: CourseData,
	title = '',
	filename = 'autocross-course.svg',
	options: SvgExportOptions = {}
): void {
	const svg = exportSVG(data, title, options);
	const blob = new Blob([svg], { type: 'image/svg+xml' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}
