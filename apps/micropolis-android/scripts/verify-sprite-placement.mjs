/**
 * Verify that sprites are drawn where the simulation thinks they are.
 *
 * A sprite's world position is `SimSprite.x + xHot`, not `SimSprite.x` — that
 * is the point spriteNotInBounds, checkSpriteCollision, getChar and
 * destroyMapTile all work from (packages/micropolis-engine/src/sprite.cpp).
 * The renderer centres each frame on it.
 *
 * The renderer used to subtract the hotspot instead, which drew the ship four
 * tiles left of the water it was steering along, so it appeared to sail
 * through land. These checks assert the invariant that would have caught it:
 * the engine hotspot, and every map point the engine derives from a sprite,
 * must fall inside the drawn frame.
 *
 *   node apps/micropolis-android/scripts/verify-sprite-placement.mjs
 */

import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const manifestDir = join(here, '../../micropolis/src/lib/sprites/manifests/classic');

// initSprite() in sprite.cpp, plus the map points each sprite's own update
// derives from its position (water probe, destruction, explosion origin).
const ENGINE = {
	train: { hot: { x: 40, y: -8 }, probes: [] },
	helicopter: { hot: { x: 40, y: -8 }, probes: [] },
	airplane: { hot: { x: 48, y: 16 }, probes: [] },
	// doShipSprite: water test at (x + 47, y), destroyMapTile(x + 48, y)
	ship: { hot: { x: 48, y: 0 }, probes: [{ x: 47, y: 0 }, { x: 48, y: 0 }] },
	// doMonsterSprite: getChar at the hotspot, destroyMapTile(x + 48, y + 16)
	monster: { hot: { x: 40, y: 16 }, probes: [{ x: 48, y: 16 }] },
	tornado: { hot: { x: 40, y: 36 }, probes: [] },
	explosion: { hot: { x: 40, y: 16 }, probes: [] },
};

const problems = [];

for (const file of readdirSync(manifestDir).filter((f) => f.endsWith('.json'))) {
	const manifest = JSON.parse(readFileSync(join(manifestDir, file), 'utf8'));
	const spec = ENGINE[manifest.id];
	if (!spec) continue;

	// Engine sprite parked at x = y = 0, so points are their raw offsets.
	const offsetX = manifest.drawOffset?.x ?? manifest.frameWidth / 2;
	const offsetY = manifest.drawOffset?.y ?? manifest.frameHeight / 2;
	const left = spec.hot.x - offsetX;
	const top = spec.hot.y - offsetY;
	const right = left + manifest.frameWidth;
	const bottom = top + manifest.frameHeight;

	const failures = [];
	const inside = (p) => p.x >= left && p.x <= right && p.y >= top && p.y <= bottom;
	if (!inside(spec.hot)) failures.push(`hotspot (${spec.hot.x}, ${spec.hot.y}) outside the frame`);
	for (const p of spec.probes) {
		if (!inside(p)) failures.push(`map point (${p.x}, ${p.y}) outside the frame`);
	}

	const columns = manifest.sheetColumns ?? manifest.frames.length;
	const stray = manifest.frames.filter((f) => f.atlas.x / manifest.frameWidth >= columns);
	if (stray.length) failures.push(`${stray.length} frame(s) beyond the sheet's ${columns} columns`);

	const box = `[${left}, ${top}]-[${right}, ${bottom}]`;
	if (failures.length) {
		problems.push(`${manifest.id}: ${failures.join('; ')} — frame ${box}`);
	} else {
		console.log(
			`${manifest.id.padEnd(11)} frame ${box.padEnd(22)} hotspot + ${spec.probes.length} map point(s) inside`,
		);
	}
}

if (problems.length) {
	console.error('');
	for (const p of problems) console.error(p);
	console.error(`\n${problems.length} sprite(s) drawn away from their simulated position`);
	process.exit(1);
}
console.log('\nevery sprite covers the map points its simulation uses');
