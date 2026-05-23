import assert from 'node:assert/strict'
import { test } from 'node:test'
import { PNG } from 'pngjs'
import { parseEinkOptions, quantizeEinkPng } from '../src/eink.js'

test('eink options default to the physical panel configuration', () => {
  const options = parseEinkOptions()

  assert.equal(options.width, 400)
  assert.equal(options.height, 300)
  assert.equal(options.layout, 'split')
})

test('eink PNG quantization emits only black, white and red pixels', () => {
  const source = new PNG({ width: 5, height: 1 })
  source.data.set([
    0, 0, 0, 255,
    100, 100, 100, 255,
    210, 210, 210, 255,
    255, 160, 160, 255,
    255, 0, 0, 255,
  ])

  const result = PNG.sync.read(quantizeEinkPng(PNG.sync.write(source)))
  const pixels = Array.from({ length: result.width }, (_, index) => {
    const offset = index * 4
    return Array.from(result.data.subarray(offset, offset + 4))
  })

  assert.deepEqual(pixels, [
    [0, 0, 0, 255],
    [0, 0, 0, 255],
    [255, 255, 255, 255],
    [255, 0, 0, 255],
    [255, 0, 0, 255],
  ])
})
