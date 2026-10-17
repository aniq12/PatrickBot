async function handler(m) {
  if (!global.owner.length) throw 'Owner belum diatur (OWNER_NUMBERS di .env)'
  const [number, name] = global.owner[0]
  let msg = await this.sendContact(m.chat, [number, name], m)
  this.reply(m.chat, 'Tuh Ownerku, *Bukan Bot!*', msg)
}
handler.help = ['owner', 'creator']
handler.tags = ['info']

handler.command = /^(owner|creator)$/i

export default handler
