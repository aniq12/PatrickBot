export async function before(m) {
    let user = global.db.data.users[m.sender]
    if (user.premiumTime != 0 && user.premium) {
        if (new Date() * 1 >= user.premiumTime) {
            await this.reply(m.sender, `Waktu premium kamu sudah habis!`)
            user.premiumTime = 0
            user.premium = false
        }
    }
}