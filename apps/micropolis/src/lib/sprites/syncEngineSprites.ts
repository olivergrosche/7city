import type { Micropolis } from '../../types/micropolisengine.d.js';
import type { EngineSpriteSnapshot } from './engineSpriteSnapshot';
import { getManifestByEngineType } from './classicPack';
import type { SpriteInstance } from './types';

export function syncEngineSprites(micropolis: Micropolis | null, packId: string): SpriteInstance[] {
	if (!micropolis) return [];

	const getActiveSprites = micropolis.getActiveSprites;
	if (typeof getActiveSprites !== 'function') return [];

	let sprites: EngineSpriteSnapshot[];
	try {
		sprites = getActiveSprites.call(micropolis) as EngineSpriteSnapshot[];
	} catch {
		return [];
	}
	if (!sprites?.length) return [];

	const AIRPLANE_TYPE = 3; // engineType of the airplane sprite

	const out: SpriteInstance[] = [];
	for (let i = 0; i < sprites.length; i++) {
		const s = sprites[i];
		if (!s || s.frame === 0) continue;
		const manifest = getManifestByEngineType(packId, s.type);
		if (!manifest) continue;

		// The engine numbers sprite frames from 1; manifests index from 0.
		// Airplane: frames 1..8 are the 8 flight directions (nose forward);
		// frames 9..11 are brief takeoff/runway poses the sheet has no art for,
		// so clamp them to the eastbound frame (index 2), which the engine's own
		// takeoff logic settles into.
		let frame = s.frame - 1;
		if (s.type === AIRPLANE_TYPE && frame > 7) frame = 2;

		out.push({
			id: `engine-${s.type}-${i}`,
			source: 'engine',
			manifestId: manifest.id,
			packId,
			frame,
			worldX: s.x,
			worldY: s.y,
			// Pass the engine hotspot through untouched; the manifest's
			// drawOffset places the frame around it (see spriteMeasure).
			xHot: s.xHot,
			yHot: s.yHot,
		});
	}
	return out;
}
