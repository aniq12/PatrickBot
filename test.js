import fs from 'fs'
import path, { dirname } from 'path'
import assert from 'assert'
import { spawn } from 'child_process'
import syntaxError from 'syntax-error'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const require = createRequire(__dirname)

let folders = ['.', ...Object.keys(require(path.join(__dirname, './package.json')).directories)]
let files = []
for (let folder of folders)
    for (let file of fs.readdirSync(folder, { recursive: folder !== '.' }).filter(v => v.endsWith('.js')))
        files.push(path.resolve(path.join(folder, file)))
for (let file of files) {
    if (file == __filename) continue
    console.error('Checking', file)
    const error = syntaxError(fs.readFileSync(file, 'utf8'), file, {
        sourceType: 'module',
        allowReturnOutsideFunction: true,
        allowAwaitOutsideFunction: true
    })
    if (error) assert.ok(error.length < 1, file + '\n\n' + error)
    assert.ok(file)
    console.log('Done', file)
}

// LID -> phone-number normalization (lib/simple.js). Socket points at a dead local port: no WhatsApp traffic.
global.opts = {}
const { initAuthCreds } = await import('baileys')
const { makeWASocket, smsg } = await import('./lib/simple.js')
const mem = {}
const conn = makeWASocket({
    auth: {
        creds: { ...initAuthCreds(), me: { id: '62800:5@s.whatsapp.net', lid: '11100:5@lid' } },
        keys: { get: async (t, ids) => Object.fromEntries(ids.map(i => [i, mem[t + i]])), set: async d => { for (const t in d) for (const i in d[t]) mem[t + i] = d[t][i] } }
    },
    logger: (await import('pino')).default({ level: 'silent' }),
    waWebSocketUrl: 'ws://127.0.0.1:9'
})
let m = smsg(conn, {
    key: { remoteJid: '1203@g.us', id: 'ABCD', participant: '999@lid', participantAlt: '62811@s.whatsapp.net' },
    message: { extendedTextMessage: { text: '.menu', contextInfo: { mentionedJid: ['999@lid', '555@lid'] } } }
})
assert.equal(m.sender, '62811@s.whatsapp.net')
assert.deepEqual(m.mentionedJid, ['62811@s.whatsapp.net', '555@lid'])
m = smsg(conn, { key: { remoteJid: '888@lid', remoteJidAlt: '62822@s.whatsapp.net', id: 'EFGH' }, message: { conversation: 'hi' } })
assert.equal(m.chat, '62822@s.whatsapp.net')
assert.equal(conn.decodeJid('11100:5@lid'), '62800@s.whatsapp.net')
assert.equal(conn.decodeJid('62811:3@s.whatsapp.net'), '62811@s.whatsapp.net')
console.log('LID normalization OK')
conn.end(undefined)
process.exit(0)