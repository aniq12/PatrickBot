import { WAMessageStubType } from 'baileys'
import chalk from 'chalk'

const { black, gray } = chalk
const urlRegex = (await import('url-regex-safe')).default({ strict: false })
const mdRegex = /(?<=(?:^|[\s\n])\S?)(?:([*_~])(.+?)\1|```((?:.||[\n\r])+?)```)(?=\S?(?:[\s\n]|$))/g
const mdTypes = { _: 'italic', '*': 'bold', '~': 'strikethrough' }
const mdFormat = (depth = 4) => (_, type, text, monospace) => {
  text = text || monospace
  return !mdTypes[type] || depth < 1 ? text : chalk[mdTypes[type]](text.replace(mdRegex, mdFormat(depth - 1)))
}

const formatSize = bytes => {
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), 3)
  return (bytes / 1024 ** i).toFixed(i ? 1 : 0) + ['B', 'KB', 'MB', 'GB'][i]
}

export default async function (m, conn = { user: {} }, start) {
  const time = new Date(Number(m.messageTimestamp?.low ?? m.messageTimestamp) * 1000 || Date.now()).toLocaleTimeString('en-GB')
  const type = m.messageStubType ? WAMessageStubType[m.messageStubType]
    : (m.mtype || 'unknown').replace(/message$/i, '').replace('audio', m.msg?.ptt ? 'PTT' : 'audio').replace(/^./, v => v.toUpperCase())
  const name = await conn.getName(m.sender)
  // private chat with someone else: chat == sender, so "to" is only shown for groups and the bot's own outgoing messages
  const to = m.chat !== m.sender ? ` to ${black.bgMagenta(` ~${await conn.getName(m.chat)} `)} ${black.bgBlue(` ${m.chat} `)}` : ''
  const size = Number(m.msg?.fileLength?.low ?? m.msg?.fileLength) // media only
  const took = m.isCommand && start ? ` ${gray(`${Date.now() - start}ms`)}` : ''
  console.log(`\n${gray(time)} ${black.bgGreen(` ${type}${size > 0 ? ' ' + formatSize(size) : ''} `)} from ${black.bgMagenta(` ~${name} `)} ${black.bgCyan(` ${m.sender} `)}${to}${took}`)

  if (typeof m.text === 'string' && m.text) {
    let log = m.text.replace(/‎+/g, '')
    if (log.length < 4096) log = log.replace(urlRegex, url => chalk.blueBright(url))
    log = log.replace(mdRegex, mdFormat(4))
    for (const jid of m.mentionedJid || []) log = log.replace('@' + jid.split('@')[0], chalk.blueBright('@' + await conn.getName(jid)))
    console.log(m.error != null ? chalk.red(log) : m.isCommand ? chalk.yellow(log) : log)
  }
  if (m.messageStubParameters?.length) console.log(gray(m.messageStubParameters.join(', ')))
  if (/document/i.test(m.mtype)) console.log(gray(m.msg.fileName || m.msg.displayName || 'Document'))
  else if (/audio/i.test(m.mtype) && m.msg.seconds) console.log(gray(`${Math.floor(m.msg.seconds / 60)}:${String(m.msg.seconds % 60).padStart(2, 0)}`))
}
