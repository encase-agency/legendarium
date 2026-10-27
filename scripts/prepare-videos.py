#!/usr/bin/env python3
"""Prepare referenced videos as H.264/AAC MP4; source files are never changed.

Requires ffmpeg/ffprobe. Use --source-dir for local originals or --public-disk
to stream originals from the project's public Yandex folder. No account required.
"""
import argparse
import concurrent.futures
import json
import hashlib
from pathlib import Path
import re
import subprocess
import urllib.parse
import urllib.request

ROOT = Path(__file__).resolve().parent.parent
FOLDER = 'https://disk.yandex.ru/d/BEXzD-yLmSyu3g'


def referenced_files():
    files = set()
    for relative in ['src/components/Cases/caseData.tsx', 'src/components/Showcase/Showcase.tsx']:
        files.update(re.findall(r"video: \{ file: '([^']+)'", (ROOT / relative).read_text()))
    return sorted(files)


def output_name(name):
    # ASCII names avoid filesystem Unicode normalization differences on macOS.
    if name == 'Данила 30к, ии (полный кейс).mp4':
        return 'case-danila-ai.mp4'
    return 'video-' + hashlib.sha256(name.encode()).hexdigest()[:12] + '.mp4'


def prepare(name, args):
    destination = args.output / output_name(name)
    if args.public_disk:
        query = urllib.parse.urlencode({'public_key': FOLDER, 'path': '/' + name})
        with urllib.request.urlopen('https://cloud-api.yandex.net/v1/disk/public/resources/download?' + query, timeout=30) as response:
            source = json.load(response)['href']
        if not source.startswith('https://'):
            raise ValueError('Invalid source URL')
    else:
        source = str(args.source_dir / name)
        if not Path(source).is_file():
            raise FileNotFoundError(name)
    input_options = ['-rw_timeout', '30000000'] if args.public_disk else []
    original_probe = subprocess.run(['ffprobe', '-v', 'error', *input_options, '-show_entries', 'format=duration', '-of', 'json', source], capture_output=True, text=True, timeout=90)
    if original_probe.returncode:
        raise RuntimeError('Source metadata unavailable')
    expected_duration = float(json.loads(original_probe.stdout)['format']['duration'])
    print(json.dumps({'file': name, 'sourceDuration': expected_duration}, ensure_ascii=False), flush=True)
    if destination.exists():
        existing_probe = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'json', str(destination)], capture_output=True, text=True, timeout=15)
        if existing_probe.returncode == 0 and abs(float(json.loads(existing_probe.stdout)['format']['duration']) - expected_duration) < 1:
            return {'file': name, 'output': destination.name, 'status': 'exists', 'bytes': destination.stat().st_size}
        destination.unlink()
    # The catalog maps source filenames to stable ASCII output names.
    temporary = destination.with_suffix('.partial.mp4')
    result = subprocess.run([
        'ffmpeg', '-hide_banner', '-loglevel', 'error', '-nostdin', '-y',
        *input_options, '-i', source, '-map', '0:v:0', '-map', '0:a:0?',
        '-vf', "scale=w='min(1920,iw)':h='min(1080,ih)':force_original_aspect_ratio=decrease:force_divisible_by=2,fps=30",
        '-c:v', 'libx264', '-preset', 'fast', '-crf', '25', '-pix_fmt', 'yuv420p',
        '-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart', str(temporary),
    ], capture_output=True, timeout=min(900, max(180, expected_duration * 3 + 120)))
    if result.returncode:
        temporary.unlink(missing_ok=True)
        # Do not expose temporary signed source URLs in command diagnostics.
        raise RuntimeError(f'Encoding failed for {name} (exit {result.returncode})')
    probe = subprocess.run(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', str(temporary)], capture_output=True, text=True, check=True)
    metadata = json.loads(probe.stdout)
    if abs(float(metadata['format']['duration']) - expected_duration) >= 1:
        temporary.unlink(missing_ok=True)
        raise RuntimeError('Incomplete download: output duration differs from the original')
    video = next(s for s in metadata['streams'] if s['codec_type'] == 'video')
    if video['codec_name'] != 'h264' or video.get('pix_fmt') != 'yuv420p':
        temporary.unlink(missing_ok=True)
        raise RuntimeError('Unexpected output video format')
    temporary.rename(destination)
    return {'file': name, 'output': destination.name, 'status': 'prepared', 'bytes': destination.stat().st_size,
            'duration': metadata['format']['duration'], 'width': video['width'], 'height': video['height'],
            'video': video['codec_name'], 'audio': [s['codec_name'] for s in metadata['streams'] if s['codec_type'] == 'audio']}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    source = parser.add_mutually_exclusive_group(required=True)
    source.add_argument('--source-dir', type=Path)
    source.add_argument('--public-disk', action='store_true')
    parser.add_argument('--output', type=Path, default=ROOT / 'public/media/videos')
    parser.add_argument('--jobs', type=int, choices=[1, 2], default=1)
    parser.add_argument('--file', help='Prepare only this referenced filename')
    parser.add_argument('--update-catalog', action='store_true', help='Register verified outputs in the site (default output directory only)')
    args = parser.parse_args()
    if args.update_catalog and args.output.resolve() != (ROOT / 'public/media/videos').resolve():
        parser.error('--update-catalog requires the default public/media/videos output')
    names = referenced_files()
    if args.file:
        if args.file not in names:
            parser.error('--file must name a video referenced by the site')
        names = [args.file]
    args.output.mkdir(parents=True, exist_ok=True)
    records = []
    failed = False
    with concurrent.futures.ThreadPoolExecutor(max_workers=args.jobs) as pool:
        tasks = {pool.submit(prepare, name, args): name for name in names}
        for future in concurrent.futures.as_completed(tasks):
            try:
                record = future.result()
                records.append(record)
                print(json.dumps(record, ensure_ascii=False), flush=True)
            except Exception as error:
                failed = True
                (args.output / output_name(tasks[future])).with_suffix('.partial.mp4').unlink(missing_ok=True)
                reason = str(error) if isinstance(error, (RuntimeError, ValueError)) else type(error).__name__
                record = {'file': tasks[future], 'status': 'failed', 'reason': reason}
                records.append(record)
                print(json.dumps(record, ensure_ascii=False), flush=True)
    (args.output / 'manifest.json').write_text(json.dumps(records, ensure_ascii=False, indent=2) + '\n')
    if args.update_catalog:
        prepared = {r['file']: r['output'] for r in records if r['status'] in ('prepared', 'exists')}
        (ROOT / 'src/components/Cases/preparedVideos.ts').write_text(
            '// Verified local H.264/AAC MP4s. Regenerate with scripts/prepare-videos.py --update-catalog.\n'
            + 'export const preparedVideos: Record<string, string> = ' + json.dumps(prepared, ensure_ascii=False, indent=2) + '\n')
    return 1 if failed else 0


if __name__ == '__main__':
    raise SystemExit(main())
