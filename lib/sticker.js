import { dirname } from 'path'
import { fileURLToPath } from 'url'
import * as fs from 'fs'
import * as path from 'path'
import * as  crypto from 'crypto'
import { ffmpeg } from './converter.js'
import fluent_ffmpeg from 'fluent-ffmpeg'
import { fileTypeFromBuffer } from 'file-type'
import webp from 'node-webpmux'
import fetch from 'node-fetch'

const __dirname = dirname(fileURLToPath(import.meta.url))

/**
 * Image to Sticker (static, 512x512)
 * @param {Buffer} img Image/Video Buffer
 * @param {String} url Image/Video URL
 */
async function sticker4(img, url) {
  if (url) {
    let res = await fetch(url)
    if (res.status !== 200) throw await res.text()
    img = await res.buffer()
  }
  const out = await ffmpeg(img, [
    '-vf', 'scale=512:512:flags=lanczos:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000,setsar=1'
  ], 'jpeg', 'webp')
  await out.delete()
  return out.data
}

/**
 * Image/Video to Sticker using fluent-ffmpeg (keeps animation)
 * @param {Buffer} img
 * @param {string} url
 */
function sticker6(img, url) {
  return new Promise(async (resolve, reject) => {
    // reject + return, never throw: a throw inside this async executor escapes and leaves sticker() hanging
    if (url) {
      let res = await fetch(url)
      if (res.status !== 200) return reject(`HTTP ${res.status} ${url}`)
      img = await res.buffer()
    }
    const type = await fileTypeFromBuffer(img) || {
      mime: 'application/octet-stream',
      ext: 'bin'
    }
    if (type.ext == 'bin') return reject('unknown file type')
    const tmp = path.join(__dirname, `../tmp/${+ new Date()}.${type.ext}`)
    const out = path.join(tmp + '.webp')
    await fs.promises.writeFile(tmp, img)
    // https://github.com/MhankBarBar/termux-wabot/blob/main/index.js#L313#L368
    let Fffmpeg = /video/i.test(type.mime) ? fluent_ffmpeg(tmp).inputFormat(type.ext) : fluent_ffmpeg(tmp).input(tmp)
    Fffmpeg
      .on('error', function (err) {
        fs.promises.unlink(tmp)
        reject(err)
      })
      .on('end', async function () {
        fs.promises.unlink(tmp)
        const data = await fs.promises.readFile(out)
        fs.promises.unlink(out)
        resolve(data)
      })
      .addOutputOptions([
        `-vcodec`, `libwebp`, `-vf`,
        `scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease,fps=15, pad=320:320:-1:-1:color=white@0.0, split [a][b]; [a] palettegen=reserve_transparent=on:transparency_color=ffffff [p]; [b][p] paletteuse`
      ])
      .toFormat('webp')
      .save(out)
  })
}

/**
 * Add WhatsApp JSON Exif Metadata
 * Taken from https://github.com/pedroslopez/whatsapp-web.js/pull/527/files
 * @param {Buffer} webpSticker
 * @param {String} packname
 * @param {String} author
 * @param {String} categories
 * @param {Object} extra
 * @returns
 */
async function addExif(webpSticker, packname, author, categories = [''], extra = {}) {
  const img = new webp.Image();
  const stickerPackId = crypto.randomBytes(32).toString('hex');
  const json = { 'sticker-pack-id': stickerPackId, 'sticker-pack-name': packname, 'sticker-pack-publisher': author, 'emojis': categories, ...extra };
  let exifAttr = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00]);
  let jsonBuffer = Buffer.from(JSON.stringify(json), 'utf8');
  let exif = Buffer.concat([exifAttr, jsonBuffer]);
  exif.writeUIntLE(jsonBuffer.length, 14, 4);
  await img.load(webpSticker)
  img.exif = exif
  return await img.save(null)
}

/**
 * Image/Video to Sticker, converted locally with ffmpeg
 * @param {Buffer} img Image/Video Buffer
 * @param {String} url Image/Video URL
 * @param {...String} args packname, author
 * @returns {Promise<Buffer>} webp with exif; throws if every method fails
 */
async function sticker(img, url, ...args) {
  let lastError
  for (let func of [
    global.support.ffmpeg && sticker6,
    global.support.ffmpeg && global.support.ffmpegWebp && sticker4,
  ].filter(f => f)) {
    try {
      const stiker = await func(img, url, ...args)
      if (!stiker.includes('WEBP')) throw stiker.toString()
      try {
        return await addExif(stiker, ...args)
      } catch (e) {
        console.error(e)
        return stiker
      }
    } catch (err) {
      lastError = err
    }
  }
  throw lastError || 'ffmpeg tidak tersedia'
}

export {
  sticker,
  sticker4,
  sticker6,
  addExif
}
