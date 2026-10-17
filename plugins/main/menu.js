import { promises } from 'fs'
import fetch from 'node-fetch'
import { join } from 'path'
import { xpRange } from '../../lib/levelling.js'

const defaultMenu = {
  before: `*Ⓛ : Memakai Limit*
*Ⓟ : Khusus Pengguna Premium*\n\n%readmore`.trimStart(),
  header: '┏ ┅ ━━ *〘 %category 〙*\n┇',
  body: '┃ ⍚  %cmd %islimit %isPremium',
  footer: '┗ ┅ ━━━━━━━━━━━━━━\n',
  after: ``,
}
let handler = async (m, { conn, usedPrefix: _p, args, __dirname }) => {
  let tags
  let teks = `${args[0]}`.toLowerCase()
  let arrayMenu = ['all', 'game', 'xp', 'stiker', 'kerangajaib', 'quotes', 'admin', 'grup', 'premium', 'internet', 'nulis', 'downloader', 'tools', 'fun', 'jadian', 'database', 'vote', 'quran', 'audio', 'info', 'tanpakategori', 'owner']
  if (!arrayMenu.includes(teks)) teks = '404'
  if (teks == 'all') tags = {
    'main': 'Utama',
    'game': 'Game',
    'xp': 'Exp & Limit',
    'sticker': 'Stiker',
    'kerang': 'Kerang Ajaib',
    'quotes': 'Quotes',
    'admin': `Admin`,
    'group': 'Grup',
    'premium': 'Premium',
    'internet': 'Internet',
    'nulis': 'MagerNulis & Logo',
    'downloader': 'Downloader',
    'tools': 'Tools',
    'fun': 'Fun',
    'jadian': 'Jadian',
    'database': 'Database',
    'vote': 'Voting',
    'absen': 'Absen',
    'quran': 'Al Qur\'an',
    'audio': 'Pengubah Suara',
    'info': 'Info',
    '': 'Tanpa Kategori',
  }
  if (teks == 'game') tags = {
    'game': 'Game'
  }
  if (teks == 'xp') tags = {
    'xp': 'Exp & Limit'
  }
  if (teks == 'stiker') tags = {
    'sticker': 'Stiker'
  }
  if (teks == 'kerangajaib') tags = {
    'kerang': 'Kerang Ajaib'
  }
  if (teks == 'quotes') tags = {
    'quotes': 'Quotes'
  }
  if (teks == 'admin') tags = {
    'admin': `Admin`
  }
  if (teks == 'grup') tags = {
    'group': 'Grup'
  }
  if (teks == 'premium') tags = {
    'premium': 'Premium'
  }
  if (teks == 'internet') tags = {
    'internet': 'Internet'
  }
  if (teks == 'nulis') tags = {
    'nulis': 'MagerNulis & Logo'
  }
  if (teks == 'downloader') tags = {
    'downloader': 'Downloader'
  }
  if (teks == 'tools') tags = {
    'tools': 'Tools'
  }
  if (teks == 'fun') tags = {
    'fun': 'Fun'
  }
  if (teks == 'jadian') tags = {
    'jadian': 'Jadian'
  }
  if (teks == 'database') tags = {
    'database': 'Database'
  }
  if (teks == 'vote') tags = {
    'vote': 'Voting',
    'absen': 'Absen'
  }
  if (teks == 'quran') tags = {
    'quran': 'Al Qur\'an'
  }
  if (teks == 'audio') tags = {
    'audio': 'Pengubah Suara'
  }
  if (teks == 'info') tags = {
    'info': 'Info'
  }
  if (teks == 'tanpakategori') tags = {
    '': 'Tanpa Kategori'
  }
  if (teks == 'owner') tags = {
    'owner': 'Owner',
    'host': 'Host',
    'advanced': 'Advanced'
  }




  try {
    let _package = JSON.parse(await promises.readFile(join(__dirname, '../package.json')).catch(_ => ({})))
    let { exp, limit, level, role } = global.db.data.users[m.sender]
    let { min, xp, max } = xpRange(level, global.multiplier)
    let name = await conn.getName(m.sender)
    let d = new Date(new Date + 3600000)
    let locale = 'id'
    let weton = ['Pahing', 'Pon', 'Wage', 'Kliwon', 'Legi'][Math.floor(d / 84600000) % 5]
    let week = d.toLocaleDateString(locale, { weekday: 'long' })
    let date = d.toLocaleDateString(locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
    let dateIslamic = Intl.DateTimeFormat(locale + '-TN-u-ca-islamic', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(d)
    let time = d.toLocaleTimeString(locale, {
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric'
    })
    let _uptime = process.uptime() * 1000
    let _muptime
    if (process.send) {
      process.send('uptime')
      // under pm2 nobody answers 'uptime', so the listener must be removed on timeout too
      _muptime = await new Promise(resolve => {
        const done = v => (process.off('message', done), clearTimeout(timer), resolve(v))
        const timer = setTimeout(done, 1000)
        process.on('message', done)
      }) * 1000
    }
    let muptime = clockString(_muptime)
    let uptime = clockString(_uptime)
    let totalreg = Object.keys(global.db.data.users).length
    let rtotalreg = Object.values(global.db.data.users).filter(user => user.registered == true).length
    let help = Object.values(global.plugins).filter(plugin => !plugin.disabled).map(plugin => {
      return {
        help: Array.isArray(plugin.tags) ? plugin.help : [plugin.help],
        tags: Array.isArray(plugin.tags) ? plugin.tags : [plugin.tags],
        prefix: 'customPrefix' in plugin,
        limit: plugin.limit,
        premium: plugin.premium,
        enabled: !plugin.disabled,
      }
    })
    if (teks == '404') {
      // List picker (native flow single_select). Tapping a row sends its id back as a command (plugins/_templateResponse.js).
      const rows = [
        ['Semua Perintah', 'all'], ['Game', 'game'], ['XP', 'xp'], ['Stiker', 'stiker'], ['Kerang Ajaib', 'kerangajaib'],
        ['Quotes', 'quotes'], ['Admin', 'admin'], ['Grup', 'grup'], ['Premium', 'premium'], ['Internet', 'internet'],
        ['Nulis & Logo', 'nulis'], ['Downloader', 'downloader'], ['Tools', 'tools'], ['Fun', 'fun'],
        ['Jadian', 'jadian'], ['Database', 'database'], ['Vote & Absen', 'vote'], ['Al-Qur\'an', 'quran'],
        ['Pengubah Suara', 'audio'], ['Info', 'info'], ['Tanpa Kategori', 'tanpakategori'], ['Owner', 'owner']
      ].map(([title, cat]) => ({ title, id: `${_p}? ${cat}` }))
      return await conn.sendNativeFlow(m.chat, {
        title: 'Daftar Perintah PatrickBot',
        text: `Halo ${name}, pilih kategori menu di bawah.\n\n_Tombol tidak muncul? Ketik_ *${_p}menu all*`,
        footer: wm,
        buttons: [{ name: 'single_select', buttonParamsJson: JSON.stringify({ title: 'Click Here', sections: [{ title: 'Kategori', rows }] }) }]
      }, m)
    }
    let groups = {}
    for (let tag in tags) {
      groups[tag] = []
      for (let plugin of help)
        if (plugin.tags && plugin.tags.includes(tag))
          if (plugin.help) groups[tag].push(plugin)
    }
    conn.menu = conn.menu ? conn.menu : {}
    let before = conn.menu.before || defaultMenu.before
    let header = conn.menu.header || defaultMenu.header
    let body = conn.menu.body || defaultMenu.body
    let footer = conn.menu.footer || defaultMenu.footer
    let after = conn.menu.after || (conn.user.jid == global.conn.user.jid ? '' : `Powered by https://wa.me/${global.conn.user.jid.split`@`[0]}`) + defaultMenu.after
    let _text = [
      before,
      ...Object.keys(tags).map(tag => {
        return header.replace(/%category/g, tags[tag]) + '\n' + [
          ...help.filter(menu => menu.tags && menu.tags.includes(tag) && menu.help).map(menu => {
            return menu.help.map(help => {
              return body.replace(/%cmd/g, menu.prefix ? help : '%p' + help)
                .replace(/%islimit/g, menu.limit ? 'Ⓛ' : '')
                .replace(/%isPremium/g, menu.premium ? 'Ⓟ' : '')
                .trim()
            }).join('\n')
          }),
          footer
        ].join('\n')
      }),
      after
    ].join('\n')
    let text = typeof conn.menu == 'string' ? conn.menu : typeof conn.menu == 'object' ? _text : ''
    let replace = {
      '%': '%',
      p: _p, uptime, muptime,
      me: conn.getName(conn.user.jid),
      npmname: _package.name,
      npmdesc: _package.description,
      version: _package.version,
      exp: exp - min,
      maxexp: xp,
      totalexp: exp,
      xp4levelup: max - exp,
      github: _package.homepage ? _package.homepage.url || _package.homepage : '[unknown github url]',
      level, limit, name, weton, week, date, dateIslamic, time, totalreg, rtotalreg, role,
      readmore: readMore
    }
    text = text.replace(new RegExp(`%(${Object.keys(replace).sort((a, b) => b.length - a.length).join`|`})`, 'g'), (_, name) => '' + replace[name])
    // no externalAdReply: WhatsApp accepts it server-side but never delivers it to the recipient (tested on v7)
    await conn.sendButton(m.chat, `${text.trim()}\n\nAktif selama: ${uptime}`, wm, null, [
      ['💸 Donasi', _p + 'donasi'],
      ['👦🏻 Pemilik Bot', _p + 'owner'],
      ['🍆 Group Bot', _p + 'linkgcbot']
    ], m)
  } catch (e) {
    conn.reply(m.chat, 'Maaf, menu sedang error', m)
    throw e
  }
}
handler.help = ['menu', 'help', '?']
handler.tags = ['main']
handler.command = /^(menu|help|\?)$/i

handler.exp = 3

export default handler

const more = String.fromCharCode(8206)
const readMore = more.repeat(4001)

function clockString(ms) {
  let remain = ms

  let d = isNaN(ms) ? '--' : Math.floor(remain / 86400000) + ' Hari'
  remain = remain % (1000 * 60 * 60 * 24)
  let h = isNaN(ms) ? '--' : Math.floor(remain / 3600000) + ' Jam'
  remain = remain % (1000 * 60 * 60)
  let m = isNaN(ms) ? '--' : Math.floor(remain / 60000) % 60 + ' Min'
  remain = remain % (1000 * 60)
  let s = isNaN(ms) ? '--' : Math.floor(remain / 1000) % 60 + ' Dtk'
  remain = remain % (1000)
  return [d, h, m, s].map(v => v.toString().padStart(2, 0)).join(', ')
}
