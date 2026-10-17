import { readFileSync, readdirSync } from 'fs'
import { basename, join } from 'path'

let handler = async (m, { conn, isROwner, usedPrefix, command, text }) => {
    if (!isROwner) return
    let files = readdirSync('./plugins', { recursive: true }).filter(v => v.endsWith('.js'))
    let ar1 = files.map(v => basename(v, '.js'))
    if (!text) throw `Uhm.. where the text?\n\nexample:\n${usedPrefix + command} menu`
    if (!ar1.includes(text)) return m.reply(`Not found!\n\n${ar1.map(v => ' ' + v).join`\n`}`)

    m.reply(readFileSync(join('./plugins', files[ar1.indexOf(text)]), 'utf-8'))
}
handler.help = ['getplugin'].map(v => v + ' <text>')
handler.tags = ['owner']
handler.command = /^(getplugin|gp)$/i

export default handler
