#!/usr/bin/env python3
"""Regenerate proportional WebP derivatives without changing original artwork. Requires cwebp."""
from pathlib import Path
import json
import subprocess

root = Path(__file__).resolve().parent.parent / 'public/assets/hero'
(root / 'optimized').mkdir(exist_ok=True)
records = []
for phone, width in [(False, 2560), (True, 1600)]:
    suffix = '-phone' if phone else ''
    for stem in ['new-base-cutout', 'new-blueprint-cutout', 'new-knight-cutout', 'new-knight-opening-mask']:
        source = root / f'{stem}{suffix}.png'
        destination = root / 'optimized' / f'{stem}{suffix}.webp'
        options = ['-lossless'] if 'mask' in stem else ['-q', '90', '-alpha_q', '100', '-m', '6']
        subprocess.run(['cwebp', '-quiet', '-mt', '-resize', str(width), '0', *options, str(source), '-o', str(destination)], check=True)
        records.append({'file': destination.name, 'sourceBytes': source.stat().st_size, 'outputBytes': destination.stat().st_size})
print(json.dumps(records, indent=2))
