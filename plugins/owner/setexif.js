import path from 'path'
import fs from 'fs'

const loc = './lib/exif.json'
let handler = async (m, { usedPrefix, command, args, text }) => {
    let [packname, ...author] = text.split`|`
    author = (author || []).join`|`
    if (packname) {
        fs.writeFile(loc, JSON.stringify({
            spackname: `${packname || ''}`,
            sauthor: `${author || ''}`,
        }, null, 4), function (err) {
            if (err) throw err;
            console.log('Replaced!');
            m.reply(`\`\`\`Sukses mengganti exif\`\`\``)
        });
        global.packname = packname
        global.author = author
    } else {
        m.reply(`Format salah ${usedPrefix + command} <packname>|<owner>`)
    }

}

handler.help = ['set'].map(v => v + 'exif <packname>|<owner>')
handler.tags = ['owner']
handler.command = /^setexif$/i

handler.owner = true

export default handler