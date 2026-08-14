import type { Tool } from '$lib/stores/toolStore.svelte';
import type { ModeId } from './modes';
import { TOOL_DEFS } from './tools';

// Letter shortcuts derived from ToolDef.hotkey — consulted before the digit map.
export const UNIVERSAL_KEY_MAP: Record<string, Tool> = Object.fromEntries(
	TOOL_DEFS.filter((def) => def.hotkey).map((def) => [def.hotkey as string, def.tool])
);

// Digit shortcuts for a mode, derived from TOOL_DEFS order within that mode: index + 1.
export function digitMapFor(mode: ModeId): Record<string, Tool> {
	if (mode === 'share') return {};
	return Object.fromEntries(
		TOOL_DEFS.filter((def) => def.mode === mode).map((def, index) => [String(index + 1), def.tool])
	);
}

// The label reflects the tool's HOME mode: universal tools always show 'V'/'M', and
// mode tools show their digit within their own mode regardless of the mode passed in.
// Toolbars only render a tool inside its home mode (plus the universal cluster), so the
// passed mode never disagrees in practice; when it would, the home-mode digit is still
// the only key that ever activates the tool.
export function shortcutLabel(tool: Tool, mode: ModeId): string | undefined {
	void mode;
	const def = TOOL_DEFS.find((d) => d.tool === tool);
	if (!def) return undefined;
	if (def.hotkey) return def.hotkey.toUpperCase();
	if (def.mode === 'universal') return undefined;
	const digit = Object.entries(digitMapFor(def.mode)).find(([, t]) => t === tool);
	return digit?.[0];
}
