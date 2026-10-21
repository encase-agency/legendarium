import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { preparedVideos } from '../src/components/Cases/preparedVideos.ts'

test('registered media exists under stable ASCII paths and supports fast start', () => {
  for (const [source, filename] of Object.entries(preparedVideos)) {
    assert.ok(source.length > 0)
    assert.match(filename, /^[a-z0-9-]+\.mp4$/)
    const bytes = readFileSync(new URL(`../public/media/videos/${filename}`, import.meta.url))
    const boxes = []
    for (let offset = 0; offset + 8 <= bytes.length;) {
      let size = bytes.readUInt32BE(offset)
      boxes.push(bytes.toString('ascii', offset + 4, offset + 8))
      if (size === 1) size = Number(bytes.readBigUInt64BE(offset + 8))
      if (size === 0) break
      assert.ok(size >= 8, 'valid MP4 box length')
      offset += size
    }
    assert.ok(boxes.includes('moov'))
    assert.ok(boxes.includes('mdat'))
    assert.ok(boxes.indexOf('moov') < boxes.indexOf('mdat'), 'metadata precedes the video payload')
  }
})
