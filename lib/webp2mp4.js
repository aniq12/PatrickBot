import fetch from 'node-fetch';
import sharp from 'sharp';
import { ffmpeg } from './converter.js';
/**
 * 
 * @param {Buffer|String} source 
 */
/**
 * Converts locally with ffmpeg (ezgif scraping broke). Needs an ffmpeg that decodes animated webp (8.0+).
 * Transparent areas come out black: mp4 has no alpha.
 * @param {Buffer|String} source webp buffer or URL
 * @returns {Promise<Buffer>} mp4
 */
async function webp2mp4(source) {
  if (typeof source === 'string') source = Buffer.from(await (await fetch(source)).arrayBuffer())
  const out = await ffmpeg(source, [
    '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2', // h264 needs even dimensions
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart'
  ], 'webp', 'mp4')
  await out.delete()
  return out.data
}

/**
 * Converts locally with sharp (ezgif scraping broke). Animated stickers give their first frame.
 * @param {Buffer|String} source webp buffer or URL
 * @returns {Promise<Buffer>} png
 */
async function webp2png(source) {
  if (typeof source === 'string') source = Buffer.from(await (await fetch(source)).arrayBuffer())
  return sharp(source).png().toBuffer()
}

export {
  webp2mp4,
  webp2png
}