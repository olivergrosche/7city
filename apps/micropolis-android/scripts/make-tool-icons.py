#!/usr/bin/env python3
"""Build 7CITY toolbar icons from the original Micropolis tile atlas.

Atlas: all.png, 512x5120, 16x16 tiles, 32 per row (index -> col = N%32,
row = N//32). Each icon composes one or more real game tiles, so the toolbar
shows genuine SimCity-1 artwork rather than redrawn approximations.
"""
import os
from PIL import Image

SRC = '/Users/admin/7city/MicropolisCore/apps/micropolis/src/lib/images/tilesets/all.png'
OUT = '/Users/admin/7city/MicropolisCore/apps/micropolis/static/mobile/tools'
TILE = 16
PER_ROW = 32
ICON = 64  # rendered icon size in px

# toolId -> (tile indices in reading order, tiles per row)
TOOLS = {
    'wire':     ([220], 1),
    'road':     ([0, 67, 0, 66, 76, 66, 0, 67, 0], 3),
    'rail':     ([0, 227, 0, 226, 236, 226, 0, 227, 0], 3),
    'park':     ([840], 1),
    'res':      (list(range(240, 249)), 3),
    'com':      (list(range(423, 432)), 3),
    'ind':      (list(range(612, 621)), 3),
    'police':   (list(range(770, 779)), 3),
    'fire':     (list(range(761, 770)), 3),
    'seaport':  ([698, 699, 702, 703], 2),
    'coal':     ([745, 746, 747, 749, 750, 751, 753, 754, 755, 757, 758, 759], 3),
    'stadium':  (list(range(779, 795)), 4),
    'nuclear':  ([812, 813, 814, 816, 817, 818, 820, 821, 822], 3),
    'airport':  ([730, 731, 736, 737], 2),
}

atlas = Image.open(SRC).convert('RGBA')

DIRT_BG = (204, 127, 102, 255)

def _px(grid, palette):
    """16x16 icon from a character grid; '.' = transparent."""
    img = Image.new('RGBA', (TILE, TILE), (0, 0, 0, 0))
    for y, row in enumerate(grid):
        for x, ch in enumerate(row):
            if ch != '.':
                img.putpixel((x, y), palette[ch])
    return img

# Bulldozer: yellow dozer with blade and tracks, on the game's dirt colour.
BULLDOZER = [
    "bbbbbbbbbbbbbbbb",
    "bbbbbbbbbbbbbbbb",
    "bbbbbbbbbyyyybbb",
    "bbbbbbbbyyyyyybb",
    "bbbbbbbbyKKKKybb",
    "Wbbbbbbbyyyyyybb",
    "WWbbbbyyyyyyyybb",
    "WWWbbyyyyyyyyybb",
    "WWWbbyyyyyyyyybb",
    "WWWbKKKKKKKKKKbb",
    "WWWbKooooooooKbb",
    "WWWbKoKKKKKKoKbb",
    "WWWbKooooooooKbb",
    "WWWbKKKKKKKKKKbb",
    "WWbbbbbbbbbbbbbb",
    "bbbbbbbbbbbbbbbb",
]
BULLDOZER_PAL = {
    'b': DIRT_BG,
    'y': (250, 200, 40, 255),
    'K': (40, 32, 16, 255),
    'o': (120, 120, 120, 255),
    'W': (225, 225, 230, 255),
}

# Query: magnifying glass over the dirt colour.
QUERY = [
    "bbbbbbbbbbbbbbbb",
    "bbbbbKKKKKbbbbbb",
    "bbbKKwwwwwKKbbbb",
    "bbKwwwwwwwwwKbbb",
    "bbKwwWWwwwwwKbbb",
    "bKwwWWwwwwwwwKbb",
    "bKwwWwwwwwwwwKbb",
    "bKwwwwwwwwwwwKbb",
    "bbKwwwwwwwwwKbbb",
    "bbKwwwwwwwwwKbbb",
    "bbbKKwwwwwKKbbbb",
    "bbbbbKKKKKKKbbbb",
    "bbbbbbbbbbKKKbbb",
    "bbbbbbbbbbbKKKbb",
    "bbbbbbbbbbbbKKKb",
    "bbbbbbbbbbbbbKKb",
]
QUERY_PAL = {
    'b': DIRT_BG,
    'K': (40, 32, 16, 255),
    'w': (150, 205, 235, 255),
    'W': (235, 245, 255, 255),
}

DRAWN = {
    'bulldoze': (BULLDOZER, BULLDOZER_PAL),
    'query': (QUERY, QUERY_PAL),
}



def tile_img(idx):
    col, row = idx % PER_ROW, idx // PER_ROW
    return atlas.crop((col * TILE, row * TILE, (col + 1) * TILE, (row + 1) * TILE))


def compose(indices, w):
    h = (len(indices) + w - 1) // w
    out = Image.new('RGBA', (w * TILE, h * TILE), (0, 0, 0, 0))
    for i, idx in enumerate(indices):
        out.paste(tile_img(idx), ((i % w) * TILE, (i // w) * TILE))
    return out


def render(indices, w):
    """Scale the composition to fill ICON without distortion, nearest-neighbour."""
    comp = compose(indices, w)
    scale = min(ICON / comp.width, ICON / comp.height)
    nw, nh = max(1, round(comp.width * scale)), max(1, round(comp.height * scale))
    comp = comp.resize((nw, nh), Image.NEAREST)
    canvas = Image.new('RGBA', (ICON, ICON), (0, 0, 0, 0))
    canvas.paste(comp, ((ICON - nw) // 2, (ICON - nh) // 2))
    return canvas


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    order = ['query', 'bulldoze'] + list(TOOLS.keys())
    sheet = Image.new('RGBA', (ICON * len(order), ICON), (40, 40, 55, 255))
    for i, tool in enumerate(order):
        if tool in DRAWN:
            grid, pal = DRAWN[tool]
            img = _px(grid, pal).resize((ICON, ICON), Image.NEAREST)
        else:
            idx, w = TOOLS[tool]
            img = render(idx, w)
        img.save(f'{OUT}/tool_{tool}.png')
        sheet.paste(img, (i * ICON, 0), img)
        print(f'tool_{tool}.png')
    sheet.resize((sheet.width * 2, sheet.height * 2), Image.NEAREST).save('/tmp/icon-sheet.png')
    print('\nKontaktbogen: /tmp/icon-sheet.png')
