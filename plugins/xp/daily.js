const free = 500
const prem = 5000
const cooldown = 86400000
let handler = async (m, { conn, usedPrefix, isPrems }) => {
    if (db.data.users[m.sender].level < 1) return await conn.sendButton(m.chat, 'Naikan level kamu', wm, null, ['Level Up', `${usedPrefix}levelup`], m)

    let user = global.db.data.users[m.sender]
    let time = user.lastclaim + 86400000
    let timers = msToTime(time - new Date())
    if (new Date - user.lastclaim < 86400000) throw `Kamu sudah mengklaim klaim harian hari ini\ntunggu selama ${timers} lagi`
    conn.reply(m.chat, `✉️ +${isPrems ? prem * db.data.users[m.sender].level : free * db.data.users[m.sender].level} XP`, m)
    user.exp += isPrems ? prem * db.data.users[m.sender].level : free * db.data.users[m.sender].level
    user.lastclaim = new Date * 1
}
handler.help = ['daily', 'claim']
handler.tags = ['xp']
handler.command = /^(daily|claim)$/i

export default handler

function msToTime(duration) {
    var milliseconds = parseInt((duration % 1000) / 100),
        seconds = Math.floor((duration / 1000) % 60),
        minutes = Math.floor((duration / (1000 * 60)) % 60),
        hours = Math.floor((duration / (1000 * 60 * 60)) % 24)

    hours = (hours < 10) ? "0" + hours : hours
    minutes = (minutes < 10) ? "0" + minutes : minutes
    seconds = (seconds < 10) ? "0" + seconds : seconds

    return hours + " jam " + minutes + " menit"
}

function clockString(ms) {
    let h = Math.floor(ms / 3600000)
    let m = Math.floor(ms / 60000) % 60
    let s = Math.floor(ms / 1000) % 60
    return [h, m, s].map(v => v.toString().padStart(2, 0)).join(':')
}