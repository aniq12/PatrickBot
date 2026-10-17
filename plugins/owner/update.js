import { execSync } from 'child_process'
import { readdirSync } from 'fs'
// pulls with the git credentials already configured on the host (never put a token in here)
let handler = async (m, { conn, text, isROwner }) => {
    if (global.conn.user.jid == conn.user.jid) {
        let stdout = execSync('git pull' + (isROwner && text ? ' ' + text : ''))
        if (isROwner) readdirSync('plugins', { recursive: true }).filter(v => v.endsWith('.js')).map(v => global.reload('', v))
        m.reply(stdout.toString())
    }
}
handler.help = ['update']
handler.tags = ['host']
handler.command = /^u(pdate)?$/i

handler.owner = true

export default handler
