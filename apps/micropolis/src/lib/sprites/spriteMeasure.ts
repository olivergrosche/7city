import type { MapViewport } from '@micropolis/render-core';
import type {
	ResolvedSpriteAtlas,
	SpriteAttachmentScreen,
	SpriteInstance,
	SpriteMeasurementDef,
	SpriteScreenLayout,
} from './types';
import { PROCEDURAL_SMOKE_PUFF } from './types';
import { getManifest, smokePuffManifest } from './classicPack';

/**
 * Sprite coordinates, frame sizes and hotspots are all expressed in the
 * engine's pixel grid (16 px per world tile — see `x << 4` in sprite.cpp).
 * The viewport works in world tiles, so everything is divided by this.
 */
const SPRITE_PIXELS_PER_TILE = 16;

/**
 * Screen pixels per world tile, derived from the viewport itself rather than
 * from `zoom * tileWidth`: that ignores `screenZoomFactor`, which the map
 * renderer does apply, so sprites would not track the map when zooming.
 */
function screenPixelsPerTile(viewport: MapViewport): [number, number] {
	const [x0, y0] = viewport.worldTileToScreen([0, 0]);
	const [x1, y1] = viewport.worldTileToScreen([1, 1]);
	return [x1 - x0, y1 - y0];
}

function frameDef(manifest: ResolvedSpriteAtlas, frameIndex: number) {
	return manifest.frames.find((f) => f.index === frameIndex) ?? manifest.frames[0];
}

function measurementsForFrame(
	manifest: ResolvedSpriteAtlas,
	frameIndex: number,
): Record<string, SpriteMeasurementDef> {
	const frame = frameDef(manifest, frameIndex);
	return { ...manifest.defaultMeasurements, ...frame?.measurements };
}

export function resolveManifest(packId: string, manifestId: string): ResolvedSpriteAtlas | null {
	if (manifestId === PROCEDURAL_SMOKE_PUFF) return smokePuffManifest();
	return getManifest(packId, manifestId);
}

/** Screen layout for one sprite instance — same math holodeck measure will publish later. */
export function layoutSpriteOnScreen(
	viewport: MapViewport,
	instance: SpriteInstance,
): SpriteScreenLayout | null {
	const manifest = resolveManifest(instance.packId, instance.manifestId);
	if (!manifest) return null;

	// px per engine sprite-pixel, on screen
	const [tilePxX, tilePxY] = screenPixelsPerTile(viewport);
	const sx = tilePxX / SPRITE_PIXELS_PER_TILE;
	const sy = tilePxY / SPRITE_PIXELS_PER_TILE;
	const xHot = instance.xHot ?? measurementsForFrame(manifest, instance.frame).hotspot?.x ?? 0;
	const yHot = instance.yHot ?? measurementsForFrame(manifest, instance.frame).hotspot?.y ?? 0;
	const scale = instance.scale ?? 1;
	const fw = manifest.frameWidth * sx * scale;
	const fh = manifest.frameHeight * sy * scale;

	// A sprite's world position is `SimSprite.x + xHot`, not `SimSprite.x`:
	// that is the point spriteNotInBounds, checkSpriteCollision, getChar and
	// destroyMapTile all work from. Centring the frame on it keeps the artwork
	// over the tile the simulation is actually using — the ship stays on the
	// water it steers along, the monster wrecks what it walks over. Subtracting
	// the hotspot instead (as this did before) drew the ship four tiles to the
	// left of its own course, straight across land.
	const offsetX = manifest.drawOffset?.x ?? manifest.frameWidth / 2;
	const offsetY = manifest.drawOffset?.y ?? manifest.frameHeight / 2;
	const [x, y] = viewport.worldTileToScreen([
		(instance.worldX + xHot - offsetX * scale) / SPRITE_PIXELS_PER_TILE,
		(instance.worldY + yHot - offsetY * scale) / SPRITE_PIXELS_PER_TILE,
	]);
	const bounds = { x, y, w: fw, h: fh };

	const defs = measurementsForFrame(manifest, instance.frame);
	const attachments: SpriteAttachmentScreen[] = Object.entries(defs).map(([id, def]) => ({
		id,
		x: bounds.x + def.x * sx * scale,
		y: bounds.y + def.y * sy * scale,
	}));

	return { bounds, attachments };
}

export function attachmentScreenPoint(
	viewport: MapViewport,
	instance: SpriteInstance,
	attachmentId: string,
): { x: number; y: number } | null {
	const layout = layoutSpriteOnScreen(viewport, instance);
	return layout?.attachments.find((a) => a.id === attachmentId) ?? null;
}
