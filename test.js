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

// quiz answers: a reply to the bot's button question (sendNativeFlow wraps it in documentWithCaptionMessage)
const question = '3EB0AAAAAAAAAAAAAAAAAA' // v7 ids look like WhatsApp Web's: only the sent-id list tells them apart
conn.sentIds.add(question)
const reply = (stanzaId, participant) => smsg(conn, {
    key: { remoteJid: '1203@g.us', id: 'R' + stanzaId, participant: '62811@s.whatsapp.net' },
    message: { extendedTextMessage: { text: 'kucing', contextInfo: { stanzaId, participant, quotedMessage: { documentWithCaptionMessage: { message: { interactiveMessage: { body: { text: 'Timeout 120 detik\nKetik .hint untuk bantuan' } } } } } } } }
})
m = reply(question, '11100@lid')
assert.ok(m.quoted.isBaileys && m.quoted.fromMe, 'reply to bot question is recognized')
assert.match(m.quoted.contentText, /Ketik.*hint/i)
assert.equal(m.quoted.mtype, 'interactiveMessage')
assert.equal(m.isBaileys, false, 'the user reply itself is not a bot message')
m = reply('3EB0BBBBBBBBBBBBBBBBBB', '62811@s.whatsapp.net')
assert.ok(!m.quoted.isBaileys && !m.quoted.fromMe, 'reply to someone else is not a bot message')
console.log('Quoted bot questions OK')

// button image headers must be jpeg/png: WhatsApp shows "unsupported version" for webp (YouTube thumbnails are webp)
conn.user = { ...conn.user, id: '62800:5@s.whatsapp.net' }
conn.waUploadToServer = async () => ({ mediaUrl: 'https://mmg.whatsapp.net/x', directPath: '/x' }) // offline: no upload
let relayed
conn.relayMessage = async (jid, message, { messageId }) => (relayed = message, messageId)
const webp = await (await import('sharp')).default({ create: { width: 64, height: 64, channels: 3, background: '#f00' } }).webp().toBuffer()
await conn.sendButton('1203@g.us', 'Judul video', 'wm', webp, [['Audio', '.yta x']])
const header = relayed.documentWithCaptionMessage.message.interactiveMessage.header
assert.equal(header.imageMessage.mimetype, 'image/jpeg')
console.log('Button image headers OK')
conn.end(undefined)
process.exit(0)