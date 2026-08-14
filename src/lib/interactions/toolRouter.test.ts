import { describe, it, expect } from 'vitest';
import { TOOL_HANDLERS } from './toolHandlers';
import { TOOL_DEFS } from '$lib/config/tools';

describe('toolRouter', () => {
	it('every registered tool has a handler', () => {
		for (const def of TOOL_DEFS) {
			expect(TOOL_HANDLERS[def.tool], `missing handler for tool "${def.tool}"`).toBeDefined();
		}
	});

	it('every multi-vertex polygon tool closes on double click', () => {
		expect(TOOL_HANDLERS['staging-area'].onDblClick).toBeDefined();
		expect(TOOL_HANDLERS['worker-zone'].onDblClick).toBeDefined();
	});
});
