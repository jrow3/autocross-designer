import { describe, expect, it } from 'vitest';
import { exportSVG } from './svgExport';
import { emptyCourse } from './courseSerializer';
import { CONE_COLORS, NOTE_COLOR, WORKER_COLOR } from './renderColors';
import type { ConeData, CourseData, LngLat } from '$lib/types/course';

function cone(id: string, type: ConeData['type'], lngLat: LngLat): ConeData {
	return { id, type, lngLat, lockedTargetId: null };
}

function course(overrides: Partial<CourseData> = {}): CourseData {
	return { ...emptyCourse(), ...overrides };
}

describe('exportSVG', () => {
	it('renders each cone type with its canonical color', () => {
		const svg = exportSVG(
			course({
				cones: [
					cone('c1', 'regular', [10, 10]),
					cone('c2', 'pointer', [20, 10]),
					cone('c3', 'start-cone', [30, 10]),
					cone('c4', 'finish-cone', [40, 10]),
					cone('c5', 'trailer', [50, 10])
				]
			})
		);
		expect(svg).toContain(`fill="${CONE_COLORS.regular}"`);
		expect(svg).toContain(`fill="${CONE_COLORS.pointer}"`);
		expect(svg).toContain(`fill="${CONE_COLORS['start-cone']}"`);
		expect(svg).toContain(`fill="${CONE_COLORS['finish-cone']}"`);
		expect(svg).toContain(`fill="${CONE_COLORS.trailer}"`);
	});

	it('renders worker and note circles with their numbers', () => {
		const svg = exportSVG(
			course({
				workers: [{ id: 'w1', number: 3, lngLat: [10, 10] }],
				notes: [{ id: 'n1', number: 7, text: 'apex', lngLat: [20, 20] }]
			})
		);
		expect(svg).toContain(`r="8" fill="${WORKER_COLOR}"`);
		expect(svg).toContain(`r="8" fill="${NOTE_COLOR}"`);
		expect(svg).toContain('>3</text>');
		expect(svg).toContain('>7</text>');
	});

	it('escapes XML in the title', () => {
		const svg = exportSVG(course(), '<b>Fast & "Loose"</b>');
		expect(svg).toContain('&lt;b&gt;Fast &amp; &quot;Loose&quot;&lt;/b&gt;');
		expect(svg).not.toContain('<b>');
	});

	it('omits the title element when no title is given', () => {
		const svg = exportSVG(course());
		expect(svg).not.toContain('<text');
	});
});
