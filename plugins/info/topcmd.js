let handler = async (m, { args }) => {
    let stats = Object.entries(global.db.data.stats).map(([key, value]) => {
        return { ...value, name: key }
    })
    let sortedCmd = stats.map(toNumber('total')).sort(sort('total'))
    let len = args[0] && args[0].length > 0 ? Math.min(100, Math.max(parseInt(args[0]), 3)) : Math.min(5, sortedCmd.length)
    let capt = `
┌「 *Top ${len} Perintah* 」
${sortedCmd.slice(0, len).map(({ name, total }, i) => `├ ${i + 1}. ${name.includes('-') ? name.split`-`[1].replace(/.js/, '') : name.replace(/.js/, '')} ( *${total}* digunakan )`).join`\n`}
└────`.trim()
    m.reply(capt)
}
handler.help = ['topcmd [angka]']
handler.tags = ['info']
handler.command = /^(topcmd)$/i

export default handler

function sort(property, ascending = true) {
    if (property) return (...args) => args[ascending & 1][property] - args[!ascending & 1][property]
    else return (...args) => args[ascending & 1] - args[!ascending & 1]
}

function toNumber(property, _default = 0) {
    if (property) return (a, i, b) => {
        return { ...b[i], [property]: a[property] === undefined ? _default : a[property] }
    }
    else return a => a === undefined ? _default : a
}