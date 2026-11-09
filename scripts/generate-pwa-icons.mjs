import fs from 'fs'
import path from 'path'
import zlib from 'zlib'
import { fileURLToPath } from 'url'

const outDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public')

function crc32(buf) {
  let c = ~0
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i]
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1))
  }
  return ~c >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const typeBuf = Buffer.from(type)
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])))
  return Buffer.concat([len, typeBuf, data, crcBuf])
}

function png(size) {
  const raw = Buffer.alloc((size * 4 + 1) * size)
  const cx = (size - 1) / 2
  const cy = (size - 1) / 2
  const outer = size * 0.28
  const inner = size * 0.1
  for (let y = 0; y < size; y++) {
    const row = y * (size * 4 + 1)
    raw[row] = 0
    const t = y / (size - 1)
    const br = Math.round(0x66 + (0x76 - 0x66) * t)
    const bg = Math.round(0x7e + (0x4b - 0x7e) * t)
    const bb = Math.round(0xea + (0xa2 - 0xea) * t)
    for (let x = 0; x < size; x++) {
      const i = row + 1 + x * 4
      const dx = x - cx
      const dy = y - cy
      const dist = Math.sqrt(dx * dx + dy * dy)
      const ring = dist <= outer && dist >= outer - Math.max(3, size * 0.045)
      const dot = dist <= inner
      if (ring || dot) {
        raw[i] = 255
        raw[i + 1] = 255
        raw[i + 2] = 255
        raw[i + 3] = 255
      } else {
        raw[i] = br
        raw[i + 1] = bg
        raw[i + 2] = bb
        raw[i + 3] = 255
      }
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

fs.mkdirSync(outDir, { recursive: true })
fs.writeFileSync(path.join(outDir, 'icon-192.png'), png(192))
fs.writeFileSync(path.join(outDir, 'icon-512.png'), png(512))
fs.writeFileSync(path.join(outDir, 'apple-touch-icon.png'), png(180))
console.log('wrote icons to', outDir)
