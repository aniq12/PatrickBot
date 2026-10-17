let handler = m => m
handler.before = async function (m) {
    const data = global.owner.filter(([id, isCreator]) => id && isCreator)
    if (m.isGroup && db.data.chats[m.chat].expired != 0) {
        if (new Date() * 1 >= db.data.chats[m.chat].expired) {
            this.reply(m.chat, `Waktunya *${this.user.name}* untuk meninggalkan grup`, null).then(() => {
                this.sendContact(m.chat, data.map(([id, name]) => [id, name]), false).then(() => {
                    this.groupLeave(m.chat).then(() => {
                        db.data.chats[m.chat].expired = 0
                    })
                })
            })
        }
    }
}
export default handler