import axios from 'axios'
import cheerio from 'cheerio'
import moment from 'moment-timezone'
moment.tz.setDefault('Asia/Jakarta').locale('id')

function _axios(host) {
    return new Promise(async (resolve, reject) => {
        axios.get(host).then(({ data }) => {
            resolve(data)
        })
    })
}

function sholatAll(kota) {
    return new Promise(async (resolve, reject) => {
        let html = await _axios('https://m.dream.co.id/jadwal-salat/' + kota.replace(/\s/g, '-').toLowerCase())
        let $ = cheerio.load(html)
        let data = []
        // columns are positional now (the site dropped data-title): Tanggal Subuh Duha Zuhur Asar Magrib Isya
        $('table.table-index-jadwal > tbody > tr').each(function (i, e) {
            const [tanggal, subuh, duha, zuhur, ashar, magrib, isya] = $(e).find('td').map((_, td) => $(td).text().trim()).get()
            data.push({ tanggal, subuh, duha, zuhur, ashar, magrib, isya })
        }); resolve({ status: true, data })
    })
}

export default (kota) => {
    return new Promise(async (resolve, reject) => {
        let sholat = await sholatAll(kota)
        if (!sholat.status) return resolve({ status: false })
        let now = moment(new Date * 1).format('DD-MM-YYYY')
        let data = sholat.data.find(v => v.tanggal == now)
        if (typeof data == 'undefined') return resolve({ status: false })
        resolve({ status: true, data })
    })
}