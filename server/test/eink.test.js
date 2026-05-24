import assert from 'node:assert/strict'
import { test } from 'node:test'
import { PNG } from 'pngjs'
import { packEinkFrame, parseEinkOptions, quantizeEinkPng, usesNativeEinkSize } from '../src/eink.js'

test('eink options default to the physical panel configuration', () => {
  const options = parseEinkOptions()

  assert.equal(options.panel, 'epd-4in2-bwr')
  assert.equal(options.width, 400)
  assert.equal(options.height, 300)
  assert.equal(options.palette, 'black-white-red')
  assert.equal(options.nativeFormat, 'bwr-planes-1bpp')
  assert.equal(options.layout, 'split')
})

test('GDEM075F52 panel selects its native resolution and four-color palette', () => {
  const options = parseEinkOptions({ panel: 'gdem075f52' })

  assert.equal(options.panel, 'gdem075f52')
  assert.equal(options.width, 800)
  assert.equal(options.height, 480)
  assert.equal(options.palette, 'black-white-yellow-red')
  assert.equal(options.nativeFormat, 'acep-2bpp')
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

test('GDEM075F52 device frame packs four palette pixels into one payload byte', () => {
  const source = new PNG({ width: 4, height: 1 })
  source.data.set([
    0, 0, 0, 255,
    255, 255, 255, 255,
    255, 255, 0, 255,
    255, 0, 0, 255,
  ])

  const frame = packEinkFrame({ source: PNG.sync.write(source), panel: 'gdem075f52' })

  assert.deepEqual(Array.from(frame), [0x1b])
})

test('three-color native frame emits black and red active-low planes', () => {
  const source = new PNG({ width: 8, height: 1 })
  source.data.set([
    0, 0, 0, 255,
    255, 0, 0, 255,
    255, 255, 255, 255,
    255, 255, 255, 255,
    255, 255, 255, 255,
    255, 255, 255, 255,
    255, 255, 255, 255,
    255, 255, 255, 255,
  ])

  const frame = packEinkFrame({ source: PNG.sync.write(source), panel: 'epd-4in2-bwr' })

  assert.deepEqual(Array.from(frame), [0x7f, 0xbf])
})

test('device frame endpoints require the selected panel native resolution', () => {
  assert.equal(usesNativeEinkSize({ panel: 'gdem075f52', width: 800, height: 480 }), true)
  assert.equal(usesNativeEinkSize({ panel: 'gdem075f52', width: 400, height: 300 }), false)
  assert.equal(usesNativeEinkSize({ panel: 'epd-4in2-bwr', width: 400, height: 300 }), true)
})

test('native panel frame payload sizes match the firmware contract', () => {
  const threeColor = new PNG({ width: 400, height: 300 })
  threeColor.data.fill(255)
  const fourColor = new PNG({ width: 800, height: 480 })
  fourColor.data.fill(255)

  assert.equal(packEinkFrame({ source: PNG.sync.write(threeColor), panel: 'epd-4in2-bwr' }).length, 30000)
  assert.equal(packEinkFrame({ source: PNG.sync.write(fourColor), panel: 'gdem075f52' }).length, 96000)
})
