import { fileTypeFromBuffer } from 'file-type'

const asForm = async (buffer, field, extra = {}) => {
  const { ext = 'bin', mime = 'application/octet-stream' } = await fileTypeFromBuffer(buffer) || {}
  const form = new FormData()
  for (const [k, v] of Object.entries(extra)) form.append(k, v)
  form.append(field, new Blob([buffer], { type: mime }), 'file.' + ext)
  return form
}

/**
 * catbox.moe: permanent, 200MB max
 * @param {Buffer} buffer
 */
const catbox = async buffer => {
  const res = await fetch('https://catbox.moe/user/api.php', { method: 'POST', body: await asForm(buffer, 'fileToUpload', { reqtype: 'fileupload' }) })
  const text = (await res.text()).trim()
  if (!res.ok || !/^https?:\/\//.test(text)) throw text
  return text
}

/**
 * uguu.se: expires after 3 hours, 128MB max
 * @param {Buffer} buffer
 */
const uguu = async buffer => {
  const res = await fetch('https://uguu.se/upload', { method: 'POST', body: await asForm(buffer, 'files[]') })
  const json = await res.json()
  if (!json.success) throw json
  return json.files[0].url
}

/**
 * Upload a file and get a public URL (telegra.ph, file.io and restfulapi stopped working)
 * @param {Buffer} inp
 * @returns {Promise<string>}
 */
export default async function (inp) {
  let err
  for (const upload of [catbox, uguu]) {
    try {
      return await upload(inp)
    } catch (e) {
      err = e
    }
  }
  throw err
}
