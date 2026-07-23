#!/usr/bin/env python3
"""Generate all 7CITY launcher icons from resources/icon-source.png.

The artwork must be FULL-BLEED (no baked-in frame) — platform launcher masks
are applied on top. Adaptive icon: artwork as background layer, transparent
foreground. Legacy + round icons use the artwork directly.

Usage:
    python3 scripts/make_icons.py [play-store-icon-512.png]
"""
import os
import sys
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, '..', 'resources', 'icon-source.png')
RES = os.path.join(HERE, '..', 'android', 'app', 'src', 'main', 'res')

FG_SIZES = {'mdpi': 108, 'hdpi': 162, 'xhdpi': 216, 'xxhdpi': 324, 'xxxhdpi': 432}
LEGACY_SIZES = {'mdpi': 48, 'hdpi': 72, 'xhdpi': 96, 'xxhdpi': 144, 'xxxhdpi': 192}

art = Image.open(SRC).convert('RGBA')
side = min(art.size)
art = art.crop(((art.width - side) // 2, (art.height - side) // 2,
                (art.width + side) // 2, (art.height + side) // 2))

for dpi, px in FG_SIZES.items():
    art.resize((px, px), Image.LANCZOS).save(f'{RES}/mipmap-{dpi}/ic_launcher_bgimage.png')
    Image.new('RGBA', (px, px), (0, 0, 0, 0)).save(f'{RES}/mipmap-{dpi}/ic_launcher_foreground.png')

for dpi, px in LEGACY_SIZES.items():
    art.resize((px, px), Image.LANCZOS).save(f'{RES}/mipmap-{dpi}/ic_launcher.png')
    art.resize((px, px), Image.LANCZOS).save(f'{RES}/mipmap-{dpi}/ic_launcher_round.png')

if len(sys.argv) > 1:
    art.resize((512, 512), Image.LANCZOS).save(sys.argv[1])
    print(f'Play-Store-Icon: {sys.argv[1]}')

print('Launcher-Icons erzeugt.')
