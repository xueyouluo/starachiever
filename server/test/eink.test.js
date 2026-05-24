import assert from 'node:assert/strict'
import { test } from 'node:test'
import { PNG } from 'pngjs'
import { parseEinkOptions, quantizeEinkPng } from '../src/eink.js'

test('eink options default to the physical panel configuration', () => {
  const options = parseEinkOptions()

  assert.equal(options.panel, 'epd-4in2-bwr')
  assert.equal(options.width, 400)
  assert.equal(options.height, 300)
  assert.equal(options.palette, 'black-white-red')
  assert.equal(options.layout, 'split')
})

test('GDEM075F52 panel selects its native resolution and four-color palette', () => {
  const options = parseEinkOptions({ panel: 'gdem075f52' })

  assert.equal(options.panel, 'gdem075f52')
  assert.equal(options.width, 800)
  assert.equal(options.height, 480)
  assert.equal(options.palette, 'black-white-yellow-red')
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

test('four-color PNG quantization preserves yellow for compatible panels', () => {
  const source = new PNG({ width: 3, height: 1 })
  source.data.set([
    255, 220, 40, 255,
    255, 0, 0, 255,
    240, 240, 240, 255,
  ])

  const result = PNG.sync.read(quantizeEinkPng(PNG.sync.write(source), 'black-white-yellow-red'))
  const pixels = Array.from({ length: result.width }, (_, index) => {
    const offset = index * 4
    return Array.from(result.data.subarray(offset, offset + 4))
  })

  assert.deepEqual(pixels, [
    [255, 255, 0, 255],
    [255, 0, 0, 255],
    [255, 255, 255, 255],
  ])
})
