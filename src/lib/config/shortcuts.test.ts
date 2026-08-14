import { describe, expect, it } from 'vitest';
import { digitMapFor, shortcutLabel, UNIVERSAL_KEY_MAP } from './shortcuts';
import { TOOL_DEFS, type ToolMode } from './tools';
import type { ModeId } from './modes';

const TOOL_MODES: ModeId[] = ['venue', 'design', 'annotate'];

describe('digitMapFor', () => {
	it('assigns index + 1 within the mode order, capped at 9', () => {
		for (const mode of TOOL_MODES) {
			const ordered = TOOL_DEFS.filter((def) => def.mode === mode)
				.slice(0, 9)
				.map((def) => def.tool);
			const map = digitMapFor(mode);
			ordered.forEach((tool, index) => {
				expect(map[String(index + 1)]).toBe(tool);
			});
			expect(Object.keys(map)).toHaveLength(ordered.length);
		}
	});

	it('assigns each digit at most once per mode', () => {
		for (const mode of TOOL_MODES) {
			const map = digitMapFor(mode);
			const tools = Object.values(map);
			expect(new Set(tools).size).toBe(tools.length);
			for (const key of Object.keys(map)) {
				expect(key).toMatch(/^[1-9]$/);
			}
		}
	});

	it('returns no digits for share mode', () => {
		expect(digitMapFor('share')).toEqual({});
	});
});

describe('UNIVERSAL_KEY_MAP', () => {
	it('maps every declared hotkey', () => {
		expect(UNIVERSAL_KEY_MAP).toEqual({ v: 'select', m: 'measure', l: 'lying', b: 'barrier', x: 'mirror' });
	});

	it('does not collide with digit shortcuts in any mode', () => {
		for (const mode of TOOL_MODES) {
			for (const key of Object.keys(digitMapFor(mode))) {
				expect(UNIVERSAL_KEY_MAP[key]).toBeUndefined();
			}
		}
	});
});

describe('shortcutLabel', () => {
	it('labels universal tools V and M in every mode', () => {
		for (const mode of ['venue', 'design', 'annotate', 'share'] as ModeId[]) {
			expect(shortcutLabel('select', mode)).toBe('V');
			expect(shortcutLabel('measure', mode)).toBe('M');
		}
	});

	it('labels a mode tool with its digit in its home mode', () => {
		expect(shortcutLabel('hazard-point', 'venue')).toBe('1');
		expect(shortcutLabel('scale', 'venue')).toBe('5');
		expect(shortcutLabel('sketch', 'design')).toBe('1');
		expect(shortcutLabel('regular', 'design')).toBe('2');
		expect(shortcutLabel('worker-zone', 'design')).toBe('9');
		expect(shortcutLabel('note', 'annotate')).toBe('1');
		expect(shortcutLabel('worker', 'annotate')).toBe('3');
	});

	it('reflects the home-mode digit even when another mode is passed', () => {
		// Documented choice: the home-mode digit is the only key that ever activates the tool.
		expect(shortcutLabel('regular', 'venue')).toBe('2');
		expect(shortcutLabel('hazard-point', 'share')).toBe('1');
	});

	it('labels every non-universal tool with its digit or its hotkey letter', () => {
		for (const mode of TOOL_MODES) {
			const ordered = TOOL_DEFS.filter((def) => def.mode === (mode as ToolMode));
			ordered.forEach((def, index) => {
				const expected = def.hotkey ? def.hotkey.toUpperCase() : String(index + 1);
				expect(shortcutLabel(def.tool, mode)).toBe(expected);
			});
		}
	});
});
