let handler = async (m) => {
    let who
    if (m.isGroup) who = m.mentionedJid[0] ? m.mentionedJid[0] : m.sender
    else who = m.sender
    let user = global.db.data.users[who]
    if (!user) user = {
        healt: 100,
        exp: 0,
        limit: 10,
        lastclaim: 0,
        registered: false,
        name: this.getName(m.sender),
        age: -1,
        regTime: -1,
        afk: -1,
        afkReason: '',
        banned: false,
        level: 0,
        call: 0,
        role: 'Bronze',
        autolevelup: false,
        pc: 0,
        warning: 0,
        pasangan: '',

        money: 0,
        diamond: 0,
        iron: 0,
        common: 0,
        uncommon: 0,
        mythic: 0,
        legendary: 0,
        pet: 0,
        potion: 0,
        sampah: 0,
        armor: 0,

        kucing: 0,
        kucinglastclaim: 0,
        kuda: 0,
        kudalastclaim: 0,
        rubah: 0,
        rubahlastclaim: 0,
        anjing: 0,
        anjinglastclaim: 0,

        anakkucing: 0,
        anakkuda: 0,
        anakrubah: 0,
        anakanjing: 0,
        makananpet: 0,
        antispam: 0,
        antispamlastclaim: 0,
        kayu: 0,
        batu: 0,
        string: 0,
        sword: 0,
        sworddurability: 0,
        pickaxe: 0,
        pickaxedurability: 0,
        fishingrod: 0,
        fishingroddurability: 0,

        lastadventure: 0,
        lastfishing: 0,
        lastdungeon: 0,
        lastduel: 0,
        lastmining: 0,
        lasthunt: 0,
        lastweekly: 0,
        lastmonthly: 0,
        registered: false,
    }
    await m.reply(`*${user.limit}* Limit\n*${user.exp}* XP\nLevel *${user.level}*\nRole *${user.role}*`)
}
handler.help = ['my [@user]']
handler.tags = ['xp']
handler.command = /^(m(y|e)|limit)$/i
export default handler