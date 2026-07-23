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
	const MONSTER_TYPE = 5;

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

		let xHot = s.xHot;
		let yHot = s.yHot;
		if (s.type === MONSTER_TYPE) {
			// The engine flattens the map at destroyMapTile(x + 48, y + 16),
			// but draws the sprite with hotspot (40, 16), so the destruction
			// trail lands ~4 tiles right of the visible monster. Re-anchor the
			// 48px frame so its centre sits on that destroyed tile; this only
			// moves the rendering, not the simulation.
			xHot = -24; // frame centre (24) lands on x + 48
			yHot = 8; // frame centre (24) lands on y + 16
		}

		out.push({
			id: `engine-${s.type}-${i}`,
			source: 'engine',
			manifestId: manifest.id,
			packId,
			frame,
			worldX: s.x,
			worldY: s.y,
			xHot,
			yHot,
		});
	}
	return out;
}
