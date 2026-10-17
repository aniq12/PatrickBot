import { sticker } from '../../lib/sticker.js'
import { attp } from '../../lib/canvas.js'

// frame colors per variant; generated locally with ImageMagick (xteam/salism3 APIs are gone)
const styles = {
    1: ['red', 'orange', 'yellow', 'lime', 'cyan', 'blue', 'magenta'],
    2: ['white', 'red', 'white', 'yellow', 'white', 'cyan'],
}

let handler = async (m, { conn, text, command }) => {
    let teks = text ? text : m.quoted && m.quoted.text ? m.quoted.text : ''
    if (!teks) throw 'Teksnya mana?'
    let stiker = await sticker(await attp(teks, styles[command.match(/\d$/)?.[0] || 1]), false, global.packname, global.author)
    if (!stiker) throw eror
    await conn.sendFile(m.chat, stiker, '', '', m, false, { asSticker: true })
}
handler.help = new Array(2).fill('attp').map((v, i) => v + (i + 1) + ' <teks>')
handler.tags = ['sticker']

handler.command = /^attp[1-2]?$/i

export default handler
