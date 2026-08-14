import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
	CONE_COLORS,
	WORKER_COLOR,
	NOTE_COLOR,
	MEASURE_COLOR,
	DRIVING_LINE_COLOR,
	STAGING_COLOR,
	HAZARD_COLOR,
	WORKER_ZONE_COLOR,
	BARRIER_COLOR,
	HANDLE_COLORS
} from './palette';

const appCss = readFileSync(fileURLToPath(new URL('../../app.css', import.meta.url)), 'utf-8');

function cssVar(name: string): string {
	const match = appCss.match(new RegExp(`${name}:\\s*([^;]+);`));
	if (!match) throw new Error(`app.css is missing ${name}`);
	return normalizeHex(match[1].trim());
}

function normalizeHex(hex: string): string {
	const lower = hex.toLowerCase();
	if (/^#[0-9a-f]{3}$/.test(lower)) {
		return '#' + [...lower.slice(1)].map((c) => c + c).join('');
	}
	return lower;
}

// app.css mirrors palette.ts — this test is what keeps them from drifting.
const EXPECTED: Record<string, string> = {
	'--cone-regular': CONE_COLORS.regular,
	'--cone-pointer': CONE_COLORS.pointer,
	'--cone-lying': CONE_COLORS.lying,
	'--cone-start': CONE_COLORS['start-cone'],
	'--cone-finish': CONE_COLORS['finish-cone'],
	'--cone-trailer': CONE_COLORS.trailer,
	'--worker': WORKER_COLOR,
	'--note': NOTE_COLOR,
	'--measure': MEASURE_COLOR,
	'--driving-line': DRIVING_LINE_COLOR,
	'--staging': STAGING_COLOR,
	'--hazard': HAZARD_COLOR,
	'--worker-zone': WORKER_ZONE_COLOR,
	'--barrier': BARRIER_COLOR,
	'--handle-resize': HANDLE_COLORS.resize,
	'--handle-rotate': HANDLE_COLORS.rotate
};

describe('palette.ts <-> app.css mirror', () => {
	for (const [varName, tsValue] of Object.entries(EXPECTED)) {
		it(`${varName} matches`, () => {
			expect(cssVar(varName)).toBe(normalizeHex(tsValue));
		});
	}
});
