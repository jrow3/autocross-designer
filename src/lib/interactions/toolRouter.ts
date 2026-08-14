import type { LngLat } from '$lib/types/course';
import type { Tool } from '$lib/stores/toolStore.svelte';
import { TOOL_HANDLERS } from './toolHandlers';

// Structural views of the overlay component instances the handlers drive.
export interface PolygonOverlayApi {
	getFirstVertex(): LngLat | null;
	close(): void;
	cancel(): void;
	handleClick(e: unknown): void;
	handleDoubleClick(e: unknown): void;
	handleMouseMove(e: unknown): void;
}

export interface OverlayRefs {
	measurement?: { handleClick(lngLat: LngLat): void };
	outline?: { handleClick(lngLat: LngLat): void };
	stagingPolygon?: PolygonOverlayApi;
	workerZonePolygon?: PolygonOverlayApi;
}

export interface FlowRefs {
	gate: { handleClick(lngLat: LngLat): void };
	slalom: { handleClick(lngLat: LngLat): void };
	scale: { handleClick(lngLat: LngLat): void };
	hazardLine: { handleClick(lngLat: LngLat): void };
	barrier: { handleClick(lngLat: LngLat): void };
}

export interface ToolCtx {
	lngLat: LngLat;
	// Raw map event — only handlers that need pixel coords (polygon close) touch it.
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	event: any;
	overlays: OverlayRefs;
	flows: FlowRefs;
	ui: { openNoteDialog(lngLat: LngLat): void };
}

export interface ToolHandler {
	onClick?(ctx: ToolCtx): void;
	onDblClick?(ctx: ToolCtx): void;
}

export function dispatchClick(tool: Tool, ctx: ToolCtx): void {
	TOOL_HANDLERS[tool]?.onClick?.(ctx);
}

export function dispatchDblClick(tool: Tool, ctx: ToolCtx): void {
	TOOL_HANDLERS[tool]?.onDblClick?.(ctx);
}
