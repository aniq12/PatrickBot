import { sticker } from '../../lib/sticker.js'
import { ttp } from '../../lib/canvas.js'

// [fill, stroke] per variant; generated locally with ImageMagick (the old ttp APIs are all gone)
const styles = {
    1: () => ['white', 'black'],
    2: () => ['black', 'white'],
    3: () => [['red', 'orange', 'gold', 'lime', 'cyan', 'dodgerblue', 'magenta', 'hotpink'].getRandom(), 'black'],
    4: () => ['black', 'red'],
}

let handler = async (m, { conn, text, command }) => {
    let teks = text ? text : m.quoted && m.quoted.text ? m.quoted.text : ''
    if (!teks) throw 'Teksnya mana?'
    const [fill, stroke] = styles[command.match(/\d$/)?.[0] || 1]()
    let stiker = await sticker(await ttp(teks, fill, stroke), false, global.packname, global.author)
    if (!stiker) throw eror
    await conn.sendFile(m.chat, stiker, '', '', m, false, { asSticker: true })
}
handler.help = new Array(4).fill('ttp').map((v, i) => v + (i + 1) + ' <teks>')
handler.tags = ['sticker']

handler.command = /^ttp[1-4]?$/i

export default handler
