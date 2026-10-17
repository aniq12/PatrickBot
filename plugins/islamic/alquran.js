let handler = async (m, { conn, args, usedPrefix, command }) => {
    const usage = `contoh:\n${usedPrefix + command} 1 2\n\nmaka hasilnya adalah surah Al-Fatihah ayat 2 beserta audionya, dan ayatnya 1 aja`
    const [surah, ayat] = args.map(Number)
    if (!(surah >= 1 && surah <= 114) || !(ayat >= 1)) throw usage

    // equran.id (islamic-api-indonesia on heroku is gone)
    let res = await fetch('https://equran.id/api/v2/surat/' + surah)
    if (!res.ok) throw eror
    let { data } = await res.json()
    let a = data.ayat[ayat - 1]
    if (!a) throw `Surah ${data.namaLatin} hanya ${data.jumlahAyat} ayat`
    await m.reply(`
${a.teksArab}

${a.teksIndonesia}
( Q.S ${data.namaLatin} : ${a.nomorAyat} )
`.trim())
    await conn.sendFile(m.chat, a.audio['05'], 'audio.mp3', '', m) // 05 = Misyari Rasyid Al-Afasi
}
handler.help = ['alquran <114> <1>']
handler.tags = ['quran']
handler.command = /^(al)?quran$/i

export default handler
