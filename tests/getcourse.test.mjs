import test from 'node:test'
import assert from 'node:assert/strict'
import { getWidgetHeight } from '../src/lib/getcourse.ts'

test('GetCourse resize rejects other origins, frames, widgets and invalid heights', () => {
  const source = {}
  const valid = { origin: 'https://legendaschool.ru', source, data: { uniqName: 'legend', height: '1010' } }
  assert.equal(getWidgetHeight(valid, source, 'legend'), 1010)
  for (const event of [
    { ...valid, origin: 'https://example.com' },
    { ...valid, source: {} },
    { ...valid, data: null },
    { ...valid, data: { uniqName: 'basic', height: 1010 } },
    ...[0, -1, Infinity, 20001, {}, true, 'invalid'].map(height => ({ ...valid, data: { uniqName: 'legend', height } })),
  ]) assert.equal(getWidgetHeight(event, source, 'legend'), undefined)
  assert.equal(getWidgetHeight(valid, null, 'legend'), undefined)
})
