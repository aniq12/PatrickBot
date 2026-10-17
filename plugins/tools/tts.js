import gtts from 'node-gtts'
import fs from 'fs'
import path from 'path'
import { spawn } from 'child_process'

const defaultLang = 'id'
let handler = async (m, { conn, args }) => {

    let lang = args[0]
    let text = args.slice(1).join(' ')
    if ((args[0] || '').length !== 2) {
        lang = defaultLang
        text = args.join(' ')
    }
    if (!text && m.quoted && m.quoted.text) text = m.quoted.text

    let res
    try { res = await tts(text, lang) }
    catch (e) {
        m.reply(e + '')
        res = await tts(text)
    } finally {
        conn.sendFile(m.chat, res, 'tts.opus', null, m, true)
    }
}
handler.help = ['tts <lang> <teks>']
handler.tags = ['tools']
handler.command = /^g?tts$/i
export default handler

function tts(text, lang = 'id') {
    return new Promise((resolve, reject) => {
        try {
            let tts = gtts(lang)
            let filePath = path.join('./tmp', (1 * new Date) + '.wav')
            tts.save(filePath, text, () => {
                resolve(fs.readFileSync(filePath))
                fs.unlinkSync(filePath)
            })
        } catch (e) { reject(e) }
    })
}