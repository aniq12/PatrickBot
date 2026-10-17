// libsignal dumps whole session objects (incl. private keys) on every re-key; keep them out of the console/logs
const signalNoise = /^(Closing session|Opening session|Removing old closed session|Closing open session|Session already|Migrating session)/
for (const level of ['info', 'warn']) {
  const original = console[level]
  console[level] = (...args) => typeof args[0] === 'string' && signalNoise.test(args[0]) ? undefined : original(...args)
}
import './config.js';

import path, { join } from 'path'
import pino from 'pino'
import { platform } from 'process'
global.__dirname = function dirname(pathURL) { return path.dirname(global.__filename(pathURL, true)) }

import {
  useMultiFileAuthState,
  DisconnectReason,
  Browsers,
  fetchLatestBaileysVersion
} from 'baileys'
import { createInterface } from 'node:readline/promises'
import qrcode from 'qrcode-terminal'
import {
  readdirSync,
  statSync,
  unlinkSync,
  existsSync,
  readFileSync,
  mkdirSync,
  watch
} from 'fs';
import yargs from 'yargs';
import { spawn } from 'child_process';
import lodash from 'lodash';
import syntaxerror from 'syntax-error';
import { format } from 'util'
import { makeWASocket, protoType } from './lib/simple.js';
import { Low, JSONFile } from 'lowdb'
import { mongoDB } from './lib/mongoDB.js';

const { chain } = lodash

protoType()
mkdirSync('./tmp', { recursive: true }) // scratch space for media conversions; not in git

global.timestamp = {
  start: new Date
}

const __dirname = global.__dirname(import.meta.url)

global.opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse())
global.prefix = new RegExp('^[' + (opts['prefix'] || '‎/!#$%+£¢€¥^°=¶∆×÷π√✓©®:;&.,\\-').replace(/[|\\{}()[\]^$+*,.\-\^]/g, '\\$&') + ']')

// --mongo stores the database in MongoDB (MONGODB_URI in .env); otherwise in database.json
if (opts['mongo'] && !process.env.MONGODB_URI) throw new Error('--mongo needs MONGODB_URI in .env (see .env.example)')
global.db = new Low(
  opts['mongo']
    ? new mongoDB(process.env.MONGODB_URI)
    : new JSONFile(`${opts._[0] ? opts._[0] + "_" : ""}database.json`),
);

global.loadDatabase = async function loadDatabase() {
  if (global.db.READ) return new Promise((resolve) => setInterval(async function () {
    if (!global.db.READ) {
      clearInterval(this)
      resolve(global.db.data == null ? await global.loadDatabase() : global.db.data)
    }
  }, 1 * 1000))
  if (global.db.data !== null) return
  global.db.READ = true
  await global.db.read().catch(console.error)
  global.db.READ = null
  global.db.data = {
    users: {},
    chats: {},
    stats: {},
    msgs: {},
    sticker: {},
    settings: {},
    ...(global.db.data || {})
  }
  global.db.chain = chain(global.db.data)
}
loadDatabase()

const { state, saveCreds } = await useMultiFileAuthState('sessions')
// requestPairingCode() saves creds.me before pairing completes; an interrupted pairing
// would then make Baileys attempt a login with unregistered creds -> 401. Register fresh instead.
if (!state.creds.registered) delete state.creds.me

const { version } = await fetchLatestBaileysVersion()
const connectionOptions = {
  auth: state,
  version,
  browser: Browsers.macOS('Safari'),
  logger: pino({ level: opts['debug'] ? 'debug' : 'silent' }),
}

global.conn = makeWASocket(connectionOptions)
conn.isInit = false

if (!opts['test']) {
  setInterval(async () => {
    if (global.db.data) await global.db.write().catch(console.error)
    try {
      clearTmp()
    } catch (e) { console.error(e) }
  }, 60 * 1000)
}

function clearTmp() {
  let dirname = './tmp'
  const filename = []
  readdirSync(dirname).forEach(file => filename.push(join(dirname, file)))
  return filename.map(file => {
    const stats = statSync(file)
    if (stats.isFile() && (Date.now() - stats.mtimeMs >= 1000 * 60 * 1)) return unlinkSync(file) // 3 minutes
    return false
  })
}
async function clearsesi() {
  let dirname = './sessions'
  let filename = await readdirSync(dirname).filter(file => file !== 'creds.json')
  return filename.map(file => {
    const stats = statSync('./sessions/' + file)
    if (stats.isFile() && (Date.now() - stats.mtimeMs >= 10000 * 60 * 1)) return unlinkSync('./sessions/' + file)
    return false
  })
}

let pairingNumber = opts['pairing'] || process.env.PAIRING_NUMBER
async function connectionUpdate(update) {
  const { connection, lastDisconnect, isNewLogin, qr } = update
  if (isNewLogin) conn.isInit = true
  // Baileys emits `qr` when it is ready for login (and again on every QR refresh).
  // With a number (--pairing / PAIRING_NUMBER / typed in) -> pairing code once; without one -> scan the QR
  if (qr && !this.authState.creds.registered) {
    if (!pairingNumber && process.stdin.isTTY && !this.pairingRequested) {
      this.pairingRequested = true
      const rl = createInterface({ input: process.stdin, output: process.stdout })
      pairingNumber = (await rl.question('Bot WhatsApp number with country code (e.g. 628123456789), or leave empty to scan QR: ')).replace(/\D/g, '')
      rl.close()
    }
    if (!pairingNumber) {
      qrcode.generate(qr, { small: true })
      console.log('WhatsApp > Linked devices > Link a device > scan the QR above\n')
    } else if (!this.pairingCodeSent) {
      this.pairingCodeSent = true
      const pairCode = await this.requestPairingCode(String(pairingNumber).replace(/\D/g, '')).catch(console.error)
      if (pairCode) console.log(`\nPairing code: ${pairCode.match(/.{1,4}/g).join('-')}\nWhatsApp > Linked devices > Link with phone number\n`)
    }
  }
  const code = lastDisconnect?.error?.output?.statusCode || lastDisconnect?.error?.output?.payload?.statusCode
  if (code && code !== DisconnectReason.loggedOut && !conn?.ws.isConnecting) {
    console.log(await global.reloadHandler(true).catch(console.error))
    global.timestamp.connect = new Date
  }
  console.log(JSON.stringify(update, null, 4))
  if (global.db.data == null) loadDatabase()
}

process.on('uncaughtException', console.error)

let isInit = true;
let handler = await import('./handler.js')
global.reloadHandler = async function (restatConn) {
  try {
    const Handler = await import(`./handler.js?update=${Date.now()}`)
    if (Object.keys(Handler || {}).length) handler = Handler
  } catch (e) {
    console.error(e)
  }
  if (restatConn) {
    const oldChats = global.conn.chats
    try { global.conn.ws.close() } catch { }
    conn.ev.removeAllListeners()
    global.conn = makeWASocket(connectionOptions, { chats: oldChats })
    isInit = true
  }
  if (!isInit) {
    conn.ev.off('messages.upsert', conn.handler)
    conn.ev.off('connection.update', conn.connectionUpdate)
    conn.ev.off('creds.update', conn.credsUpdate)
  }

  conn.handler = handler.handler.bind(global.conn)
  conn.connectionUpdate = connectionUpdate.bind(global.conn)
  conn.credsUpdate = saveCreds.bind(global.conn)

  conn.ev.on('messages.upsert', conn.handler)
  conn.ev.on('connection.update', conn.connectionUpdate)
  conn.ev.on('creds.update', conn.credsUpdate)
  isInit = false
  return true
}

const pluginFolder = global.__dirname(join(__dirname, './plugins/index'))
const pluginFilter = filename => /\.js$/.test(filename)
global.plugins = {}
// plugins live in category subfolders (plugins/<category>/<name>.js) but are keyed by bare filename,
// so stats, menu and getplugin keep working; filenames must stay unique across folders
async function filesInit() {
  for (let relPath of readdirSync(pluginFolder, { recursive: true }).filter(pluginFilter)) {
    const filename = path.basename(relPath)
    try {
      let file = global.__filename(join(pluginFolder, relPath))
      const module = await import(file)
      global.plugins[filename] = module.default || module
    } catch (e) {
      conn.logger.error(e)
      delete global.plugins[filename]
    }
  }
}
filesInit().then(_ => console.log(Object.keys(global.plugins))).catch(console.error)

global.reload = async (_ev, relPath) => {
  if (pluginFilter(relPath)) {
    const filename = path.basename(relPath)
    let dir = global.__filename(join(pluginFolder, relPath), true)
    if (filename in global.plugins) {
      if (existsSync(dir)) conn.logger.info(`re - require plugin '${filename}'`)
      else {
        conn.logger.warn(`deleted plugin '${filename}'`)
        return delete global.plugins[filename]
      }
    } else conn.logger.info(`requiring new plugin '${filename}'`)
    let err = syntaxerror(readFileSync(dir), filename, {
      sourceType: 'module',
      allowAwaitOutsideFunction: true
    })
    if (err) conn.logger.error(`syntax error while loading '${filename}'\n${format(err)}`)
    else try {
      const module = (await import(`${global.__filename(dir)}?update=${Date.now()}`))
      global.plugins[filename] = module.default || module
    } catch (e) {
      conn.logger.error(`error require plugin '${filename}\n${format(e)}'`)
    } finally {
      global.plugins = Object.fromEntries(Object.entries(global.plugins).sort(([a], [b]) => a.localeCompare(b)))
    }
  }
}
Object.freeze(global.reload)
watch(pluginFolder, { recursive: true }, global.reload)
await global.reloadHandler()

// Quick Test
async function _quickTest() {
  let test = await Promise.all([
    spawn('ffmpeg'),
    spawn('ffprobe'),
    spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-filter_complex', 'color', '-frames:v', '1', '-f', 'webp', '-']),
    spawn('convert'),
    spawn('magick'),
    spawn('gm'),
    spawn('find', ['--version'])
  ].map(p => {
    return Promise.race([
      new Promise(resolve => {
        p.on('close', code => {
          resolve(code !== 127)
        })
      }),
      new Promise(resolve => {
        p.on('error', _ => resolve(false))
      })
    ])
  }))
  let [ffmpeg, ffprobe, ffmpegWebp, convert, magick, gm, find] = test
  console.log(test)
  let s = global.support = {
    ffmpeg,
    ffprobe,
    ffmpegWebp,
    convert: convert && platform !== 'win32', // on Windows `convert` is the system disk-conversion tool, not ImageMagick
    magick,
    gm,
    find
  }
  // require('./lib/sticker').support = s
  Object.freeze(global.support)

  if (!s.ffmpeg) conn.logger.warn('Please install ffmpeg for sending videos (pkg install ffmpeg)')
  if (s.ffmpeg && !s.ffmpegWebp) conn.logger.warn('Stickers may not animated without libwebp on ffmpeg (--enable-ibwebp while compiling ffmpeg)')
  if (!s.convert && !s.magick && !s.gm) conn.logger.warn('Stickers may not work without imagemagick if libwebp on ffmpeg doesnt isntalled (pkg install imagemagick)')
}

_quickTest()
  .then(() => conn.logger.info('Quick Test Done'))
  .catch(console.error)

export {
  clearTmp,
  clearsesi
}
