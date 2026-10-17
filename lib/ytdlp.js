import { spawn } from 'child_process'
import { existsSync, promises as fs } from 'fs'
import { join } from 'path'
import sharp from 'sharp'

/**
 * Download one video/audio with yt-dlp (must be on PATH, like ffmpeg).
 * Works for YouTube, Facebook and most other sites. Instagram needs login cookies:
 * export them in Netscape format to ./cookies.txt and they are used automatically.
 * @param {string} url
 * @param {{ audio?: boolean, maxSize?: number, format?: string, item?: number }} options maxSize in MB, item = 1-based playlist/carousel index
 * @returns {Promise<{ data: Buffer, ext: string, title: string, thumbnail: Buffer|null }>} thumbnail is a jpeg
 */
export async function ytdlp(url, { audio = false, maxSize = 100, format, item } = {}) {
  const id = 'ytdlp-' + Date.now() + '-' + (item || 0)
  const { code, stdout, stderr } = await run([
    ...(item ? ['--playlist-items', String(item)] : ['--no-playlist']), '--no-progress',
    '--max-filesize', maxSize + 'M',
    // video: prefer H.264 (avc1); YouTube also offers AV1/VP9, which phones' WhatsApp can't play
    '-f', format || (audio ? 'ba[ext=m4a]/ba' : 'b[ext=mp4][vcodec^=avc1][height<=720]/bv*[vcodec^=avc1][height<=720]+ba[ext=m4a]/b[ext=mp4][height<=720]/bv*[height<=720]+ba/b'),
    '--merge-output-format', 'mp4',
    '-o', join('tmp', id + '.%(ext)s'),
    '--print', 'after_move:YTDLP\t%(title)s\t%(thumbnail)s', // tagged: other tools can write to stdout too
    url
  ])
  const file = (await fs.readdir('tmp')).find(f => f.startsWith(id + '.') && !f.endsWith('.part'))
  if (!file) {
    // --print hides the "larger than max-filesize, aborting" notice; a clean exit without a file means exactly that
    if (code === 0) throw `File terlalu besar (maks ${maxSize} MB)`
    throw failure(code, stderr)
  }
  const path = audio ? join('tmp', file) : await playableOnPhones(join('tmp', file))
  const data = await fs.readFile(path)
  await fs.unlink(path)
  const [, title = '', thumbUrl = ''] = (stdout.split(/\r?\n/).find(l => l.startsWith('YTDLP\t')) || '').split('\t')
  return { data, ext: path.split('.').pop(), title, thumbnail: await toJpeg(thumbUrl) }
}

/**
 * WhatsApp on phones only plays 8-bit H.264 video with AAC audio ("something is wrong with the video file"
 * otherwise); WhatsApp Desktop plays more, which hides the problem. Re-encodes only the part that isn't.
 * @param {string} path
 * @returns {Promise<string>} path of a playable mp4 (the input itself if it already is)
 */
async function playableOnPhones(path) {
  const probe = await proc('ffprobe', ['-v', 'error', '-show_entries', 'stream=codec_type,codec_name,pix_fmt', '-of', 'json', path])
  const streams = JSON.parse(probe.stdout || '{}').streams || []
  const v = streams.find(s => s.codec_type === 'video'), a = streams.find(s => s.codec_type === 'audio')
  const videoOk = !v || (v.codec_name === 'h264' && v.pix_fmt === 'yuv420p')
  const audioOk = !a || a.codec_name === 'aac'
  if (videoOk && audioOk && path.endsWith('.mp4')) return path
  const out = path.replace(/\.\w+$/, '') + '.wa.mp4'
  const { code, stderr } = await proc('ffmpeg', ['-y', '-i', path,
    ...(videoOk ? ['-c:v', 'copy'] : ['-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23', '-pix_fmt', 'yuv420p']),
    ...(audioOk ? ['-c:a', 'copy'] : ['-c:a', 'aac', '-b:a', '128k']),
    '-movflags', '+faststart', out])
  await fs.unlink(path)
  if (code !== 0) throw 'Gagal mengonversi video: ' + stderr.trim().split('\n').pop()
  return out
}

function proc(cmd, args) {
  return new Promise((resolve, reject) => {
    let stdout = '', stderr = ''
    const p = spawn(cmd, args)
    p.stdout.on('data', d => stdout += d)
    p.stderr.on('data', d => stderr += d)
    p.on('error', reject)
    p.on('close', code => resolve({ code, stdout, stderr }))
  })
}

/**
 * Instagram post/reel/carousel as direct media links. yt-dlp only downloads videos,
 * but its metadata still has photos: a photo item has no formats and its largest thumbnail is the photo.
 * @param {string} url
 * @returns {Promise<{ type: 'image'|'video', media: Buffer }[]>} image: jpeg, video: mp4
 */
export async function instagram(url) {
  const { code, stdout, stderr } = await run(['-J', '--ignore-no-formats-error', url])
  if (code !== 0) throw failure(code, stderr)
  const info = JSON.parse(stdout.slice(stdout.indexOf('{'))) // Windows helpers can print junk before the JSON
  const items = []
  for (const [i, item] of (info.entries || [info]).entries()) {
    if (item.formats?.length) {
      // IG lists vp9/av1 dash streams first; WhatsApp on iPhone only plays h264
      const format = 'bv*[vcodec!*=?vp][vcodec!*=?av01]+ba/b[vcodec!*=?vp][vcodec!*=?av01]/bv*[vcodec!*=?vp][vcodec!*=?av01]/b/bv*'
      items.push({ type: 'video', media: (await ytdlp(url, { format, item: info.entries ? i + 1 : undefined })).data })
    } else {
      const photo = (item.thumbnails || []).filter(t => t.url).sort((a, b) => (a.width || 0) - (b.width || 0)).pop()
      const jpeg = photo && await toJpeg(photo.url, 2048) // instagram serves webp
      if (jpeg) items.push({ type: 'image', media: jpeg })
    }
  }
  return items
}

// yt-dlp's ERROR line, else its last real stderr line (Windows helpers add junk like 'Access is denied.')
function failure(code, stderr) {
  const lines = stderr.split(/\r?\n/).map(l => l.trim()).filter(l => l && !/directory name is invalid|symsrv|Access is denied/i.test(l))
  return lines.find(l => l.startsWith('ERROR: '))?.slice(7) || lines.pop() || `yt-dlp gagal (exit ${code})`
}

function run(args) {
  return new Promise((resolve, reject) => {
    let stdout = '', stderr = ''
    const p = spawn('yt-dlp', [
      '--js-runtimes', 'node', // YouTube needs a JS runtime; node is always installed here
      '--no-warnings',
      ...(existsSync('cookies.txt') ? ['--cookies', 'cookies.txt'] : []),
      ...args
    ])
    const timer = setTimeout(() => p.kill(), 5 * 60 * 1000)
    p.stdout.on('data', d => stdout += d)
    p.stderr.on('data', d => stderr += d)
    p.on('error', e => (clearTimeout(timer), reject(e.code === 'ENOENT' ? 'yt-dlp belum terinstall' : e)))
    p.on('close', code => (clearTimeout(timer), resolve({ code, stdout, stderr })))
  })
}

// sites often serve webp thumbnails, which sendFile would turn into a sticker
async function toJpeg(url, maxSide = 640) {
  if (!/^https?:\/\//.test(url)) return null
  try {
    return await sharp(Buffer.from(await (await fetch(url)).arrayBuffer())).resize(maxSide, maxSide, { fit: 'inside', withoutEnlargement: true }).jpeg().toBuffer()
  } catch {
    return null
  }
}
