import { watchFile, unwatchFile, readFileSync } from 'fs';
import chalk from 'chalk';
import { fileURLToPath, pathToFileURL } from 'url';
import { platform } from 'process';

// Settings that are personal or secret live in .env (copy .env.example). config.js is the first
// module main.js loads, so the file is read here.
try { process.loadEnvFile() } catch { /* no .env: rely on the real environment */ }

// [number, name, isDeveloper] — developers also receive the error report when a plugin crashes
global.owner = (process.env.OWNER_NUMBERS || '')
  .split(',')
  .map(number => number.replace(/\D/g, ''))
  .filter(Boolean)
  .map(number => [number, process.env.OWNER_NAME || 'Owner', true])
if (!global.owner.length) console.warn(chalk.yellow('OWNER_NUMBERS is empty: nobody can use owner commands (see .env.example)'))

// Sticker WM (editable at runtime with .setexif)
const file_exif = "lib/exif.json"
const stickerpack = JSON.parse(readFileSync(file_exif))
global.packname = stickerpack.spackname || '© PatrickBot'
global.author = stickerpack.spackname ? stickerpack.sauthor : ''
unwatchFile(file_exif)
watchFile(file_exif, () => {
  console.log(chalk.redBright("Update 'exif.json'"))
  reloadConfig() // config re-reads exif.json on load
})

global.done = '_*Success*_'
global.eror = '_*Server Error*_'
global.wait = '_*Tunggu sedang di proses...*_'
global.wm = '© PatrickBot'

global.multiplier = 60 // The higher, The harder levelup

global.__filename = function filename(pathURL = import.meta.url, rmPrefix = platform !== 'win32') {
  return rmPrefix ? /file:\/\/\//.test(pathURL) ? fileURLToPath(pathURL) : pathURL : pathToFileURL(pathURL).toString()
}

let file = global.__filename(import.meta.url, true)
// Windows ESM needs a file:// URL, not a D:\ path
const reloadConfig = () => import(`${pathToFileURL(file)}?update=${Date.now()}`).catch(console.error)
unwatchFile(file)
watchFile(file, () => {
  console.log(chalk.redBright("Update 'config.js'"))
  reloadConfig()
})
