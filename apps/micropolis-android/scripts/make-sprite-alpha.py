#!/usr/bin/env python3
"""Punch transparency into the classic sprite sheets.

The upstream sheets are fully opaque: each sprite sits on a solid key colour
(black for most, (0,0,49) for the monster). Replacing every key-coloured pixel
globally is wrong, because the key colour is also used *inside* the artwork --
the ship's hull is shaded with a black dither, and removing it left the ship
looking half-transparent and moth-eaten.

So the mask is built in three passes per sheet:

1. Flood-fill the key colour inward from each frame cell's border. Only
   background connected to the edge is cleared, so interior shading survives.
2. Clear enclosed key-coloured areas larger than 10% of a cell. These are
   background too -- the helicopter's rotor disc is a closed red circle with
   background inside it -- while a 1-2 pixel dither dot stays.
3. Drop free-floating specks of up to 3 pixels, which are sheet noise around
   the sprites. Skipped for the explosion, whose late frames *are* scattered
   single pixels of flying debris.

Run from the repo root; rewrites apps/micropolis/src/lib/images/tilesets/.
"""

from collections import Counter, deque
from pathlib import Path
import sys

from PIL import Image

TILESETS = Path("apps/micropolis/src/lib/images/tilesets")
FRAME_WIDTH = {
    "chopper": 32,
    "explode": 48,
    "monster": 48,
    "plane": 48,
    "ship": 48,
    "tornado": 48,
    "train": 32,
}
KEEP_SPECKS = {"explode"}
ENCLOSED_BACKGROUND_SHARE = 0.10
SPECK_MAX_PIXELS = 3

NEIGHBOURS_4 = ((1, 0), (-1, 0), (0, 1), (0, -1))
NEIGHBOURS_8 = NEIGHBOURS_4 + ((1, 1), (-1, -1), (1, -1), (-1, 1))


def components(matches, width, height, diagonal=False):
    """Connected pixel groups where matches(x, y) holds."""
    dirs = NEIGHBOURS_8 if diagonal else NEIGHBOURS_4
    seen = set()
    for y in range(height):
        for x in range(width):
            if (x, y) in seen or not matches(x, y):
                continue
            queue = deque([(x, y)])
            seen.add((x, y))
            group = []
            while queue:
                cx, cy = queue.popleft()
                group.append((cx, cy))
                for dx, dy in dirs:
                    n = (cx + dx, cy + dy)
                    if 0 <= n[0] < width and 0 <= n[1] < height and n not in seen and matches(*n):
                        seen.add(n)
                        queue.append(n)
            yield group


def key_colour(px, width, height, frame_width):
    """Most common colour along the frame cell borders."""
    counts = Counter()
    for cell_x in range(0, width, frame_width):
        for i in range(frame_width):
            for p in ((cell_x + i, 0), (cell_x + i, height - 1), (cell_x, i), (cell_x + frame_width - 1, i)):
                if p[0] < width and p[1] < height:
                    counts[px[p][:3]] += 1
    return counts.most_common(1)[0][0]


def punch(path, frame_width, despeckle):
    image = Image.open(path).convert("RGBA")
    width, height = image.size
    px = image.load()
    key = key_colour(px, width, height, frame_width)

    for cell_x in range(0, width, frame_width):
        right = min(cell_x + frame_width, width)
        seeds = (
            [(cell_x + i, 0) for i in range(frame_width)]
            + [(cell_x + i, height - 1) for i in range(frame_width)]
            + [(cell_x, i) for i in range(height)]
            + [(right - 1, i) for i in range(height)]
        )
        queue = deque(s for s in seeds if s[0] < width and px[s][:3] == key)
        seen = set(queue)
        while queue:
            x, y = queue.popleft()
            px[x, y] = (0, 0, 0, 0)
            for dx, dy in NEIGHBOURS_4:
                n = (x + dx, y + dy)
                if cell_x <= n[0] < right and 0 <= n[1] < height and n not in seen:
                    if px[n][3] > 0 and px[n][:3] == key:
                        seen.add(n)
                        queue.append(n)

    enclosed_limit = ENCLOSED_BACKGROUND_SHARE * frame_width * height
    is_key = lambda x, y: px[x, y][3] > 0 and px[x, y][:3] == key
    for group in list(components(is_key, width, height)):
        if len(group) > enclosed_limit:
            for p in group:
                px[p] = (0, 0, 0, 0)

    if despeckle:
        is_opaque = lambda x, y: px[x, y][3] > 0
        for group in list(components(is_opaque, width, height, diagonal=True)):
            if len(group) <= SPECK_MAX_PIXELS:
                for p in group:
                    px[p] = (0, 0, 0, 0)

    image.save(path)
    alpha = image.getchannel("A")
    covered = sum(1 for v in alpha.getdata() if v > 0)
    return key, 100.0 * covered / (width * height)


def main():
    if not TILESETS.is_dir():
        sys.exit(f"run from the repo root: {TILESETS} not found")
    for name, frame_width in FRAME_WIDTH.items():
        path = TILESETS / f"classic-sprite-{name}.png"
        if not path.exists():
            print(f"{name:<9} missing {path}")
            continue
        key, covered = punch(path, frame_width, despeckle=name not in KEEP_SPECKS)
        print(f"{name:<9} key={str(key):<14} opaque={covered:5.1f}%")


if __name__ == "__main__":
    main()
