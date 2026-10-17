import path from 'path'
import { toAudio } from './converter.js'
import chalk from 'chalk'
import fetch from 'node-fetch'
import PhoneNumber from 'awesome-phonenumber'
import fs from 'fs'
import util from 'util'
import { fileTypeFromBuffer } from 'file-type'
import sharp from 'sharp'
import { format } from 'util'
import { fileURLToPath } from 'url'
import store from './store.js'
import { unwatchFile, watchFile } from 'fs'
import { platform } from 'process';

const __dirname = path.dirname(fileURLToPath(import.meta.url))

import _makeWaSocket, {
    proto,
    downloadContentFromMessage,
    jidDecode,
    areJidsSameUser,
    generateForwardMessageContent,
    generateWAMessageFromContent,
    prepareWAMessageMedia,
    normalizeMessageContent,
    getContentType,
    WAMessageStubType
} from 'baileys'

/** strip device suffix: 628xx:12@s.whatsapp.net -> 628xx@s.whatsapp.net */
const bareJid = (jid) => {
    if (!/:\d+@/gi.test(jid)) return jid.trim()
    const decode = jidDecode(jid) || {}
    return (decode.user && decode.server && decode.user + '@' + decode.server || jid).trim()
}

export function makeWASocket(...args) {
    /**
     * @type {import('baileys').WASocket}
     */
    let conn = _makeWaSocket(...args)

    // IDs of messages this process sent. Baileys v7 IDs look exactly like WhatsApp Web's, so the ID
    // format can't tell the bot's own messages apart from the owner typing on WhatsApp Web.
    // ponytail: in-memory, last 1000 only; games keep their state in memory too, so a restart loses both
    conn.sentIds = new Set()
    const rememberSent = id => {
        if (!id) return
        conn.sentIds.add(id)
        if (conn.sentIds.size > 1000) conn.sentIds.delete(conn.sentIds.values().next().value)
    }
    conn.isSentByBot = id => conn.sentIds.has(id)
    // our helpers send through these two (sendNativeFlow uses relayMessage directly)
    const _sendMessage = conn.sendMessage
    // .id alias: plugins (the quiz games) compare a stored question's .id with m.quoted.id, as the old fork allowed
    conn.sendMessage = async (...a) => { const msg = await _sendMessage(...a); if (msg?.key) { msg.id = msg.key.id; rememberSent(msg.id) } return msg }
    const _relayMessage = conn.relayMessage
    conn.relayMessage = async (...a) => { const id = await _relayMessage(...a); rememberSent(id); return id }

    // LID -> phone number JID, learned from message keys, contacts and group metadata.
    // ponytail: in-memory only, refills from traffic after restart; persist it if lookups miss too often
    conn.lidMap = new Map()
    conn.learnLid = (a, b) => {
        if (!a || !b) return
        const [lid, pn] = a.endsWith('@lid') ? [a, b] : [b, a]
        if (lid.endsWith('@lid') && pn.endsWith('@s.whatsapp.net')) conn.lidMap.set(bareJid(lid), bareJid(pn))
    }
    conn.ev.on('lid-mapping.update', ({ lid, pn }) => conn.learnLid(lid, pn))

    conn.decodeJid = (jid) => {
        if (!jid) return jid
        jid = bareJid(jid)
        if (!jid.endsWith('@lid')) return jid
        if (conn.user?.lid && bareJid(conn.user.lid) === jid) return bareJid(conn.user.id)
        return conn.lidMap.get(jid) || jid
    }

    // Normalize group participants to phone-number JIDs so owner/admin/db checks keep working.
    // The original LID stays on participant.lid.
    const normalizeGroup = (metadata) => {
        for (const p of metadata?.participants || []) {
            const pn = p.phoneNumber || (p.id.endsWith('@lid') ? conn.lidMap.get(bareJid(p.id)) : null)
            if (!pn) continue
            conn.learnLid(p.id, pn)
            if (p.id.endsWith('@lid')) (p.lid = p.id, p.id = pn)
        }
        return metadata
    }
    const _groupMetadata = conn.groupMetadata
    conn.groupMetadata = async (...a) => normalizeGroup(await _groupMetadata(...a))
    const _groupFetchAllParticipating = conn.groupFetchAllParticipating
    conn.groupFetchAllParticipating = async (...a) => {
        const groups = await _groupFetchAllParticipating(...a)
        for (const id in groups) normalizeGroup(groups[id])
        return groups
    }

    if (conn.user && conn.user.id) conn.user.jid = conn.decodeJid(conn.user.id)
    store.bind(conn)

    conn.logger = {
        ...conn.logger,
        info(...args) {
            console.log(
                chalk.bold.bgRgb(51, 204, 51)('INFO '),
                `[${chalk.rgb(255, 255, 255)(new Date().toUTCString())}]:`,
                chalk.cyan(format(...args))
            )
        },
        error(...args) {
            console.log(
                chalk.bold.bgRgb(247, 38, 33)('ERROR '),
                `[${chalk.rgb(255, 255, 255)(new Date().toUTCString())}]:`,
                chalk.rgb(255, 38, 0)(format(...args))
            )
        },
        warn(...args) {
            console.log(
                chalk.bold.bgRgb(255, 153, 0)('WARNING '),
                `[${chalk.rgb(255, 255, 255)(new Date().toUTCString())}]:`,
                chalk.redBright(format(...args))
            )
        }
    }

    /**
     * getBuffer hehe
     * @param {fs.PathLike} path
     * @param {Boolean} returnFilename
     */
    conn.getFile = async (PATH, returnAsFilename) => {
        let res, filename
        const data = Buffer.isBuffer(PATH) ? PATH : PATH instanceof ArrayBuffer ? PATH.toBuffer() : /^data:.*?\/.*?;base64,/i.test(PATH) ? Buffer.from(PATH.split`,`[1], 'base64') : /^https?:\/\//.test(PATH) ? await (res = await fetch(PATH)).buffer() : fs.existsSync(PATH) ? (filename = PATH, fs.readFileSync(PATH)) : typeof PATH === 'string' ? PATH : Buffer.alloc(0)
        if (!Buffer.isBuffer(data)) throw new TypeError('Result is not a buffer')
        const type = await fileTypeFromBuffer(data) || {
            mime: 'application/octet-stream',
            ext: '.bin'
        }
        if (data && returnAsFilename && !filename) (filename = path.join(__dirname, '../tmp/' + new Date * 1 + '.' + type.ext), await fs.promises.writeFile(filename, data))
        return {
            res,
            filename,
            ...type,
            data,
            deleteFile() {
                return filename && fs.promises.unlink(filename)
            }
        }
    }

    /**
    * waitEvent
    * @param {String} eventName 
    * @param {Boolean} is 
    * @param {Number} maxTries 
    * @returns 
    */
    conn.waitEvent = (eventName, is = () => true, maxTries = 25) => {
        return new Promise((resolve, reject) => {
            let tries = 0
            let on = (...args) => {
                if (++tries > maxTries) reject('Max tries reached')
                else if (is()) {
                    conn.ev.off(eventName, on)
                    resolve(...args)
                }
            }
            conn.ev.on(eventName, on)
        })
    }

    /**
    * Send Media/File with Automatic Type Specifier
    * @param {String} jid
    * @param {String|Buffer} path
    * @param {String} filename
    * @param {String} caption
    * @param {import('baileys').proto.WebMessageInfo} quoted
    * @param {Boolean} ptt
    * @param {Object} options
    */
    conn.sendFile = async (jid, path, filename = '', caption = '', quoted, ptt = false, options = {}) => {
        let type = await conn.getFile(path, true)
        let { res, data: file, filename: pathFile } = type
        if (res && res.status !== 200 || file.length <= 65536) {
            try { throw { json: JSON.parse(file.toString()) } }
            catch (e) { if (e.json) throw e.json }
        }
        let opt = { filename }
        if (quoted) opt.quoted = quoted
        if (!type) options.asDocument = true
        let mtype = '', mimetype = options.mimetype || type.mime, convert
        if (/webp/.test(type.mime) || (/image/.test(type.mime) && options.asSticker)) mtype = 'sticker'
        else if (/image/.test(type.mime) || (/webp/.test(type.mime) && options.asImage)) mtype = 'image'
        else if (/video/.test(type.mime)) mtype = 'video'
        else if (/audio/.test(type.mime)) (
            convert = await toAudio(file, type.ext),
            file = convert.data,
            pathFile = convert.filename,
            mtype = 'audio',
            mimetype = options.mimetype || 'audio/ogg; codecs=opus'
        )
        else mtype = 'document'
        if (options.asDocument) mtype = 'document'

        delete options.asSticker
        delete options.asLocation
        delete options.asVideo
        delete options.asDocument
        delete options.asImage

        let message = {
            ...options,
            caption,
            ptt,
            [mtype]: { url: pathFile },
            mimetype
        }
        /**
         * @type {import('baileys').proto.WebMessageInfo}
         */
        let m
        try {
            m = await conn.sendMessage(jid, message, { ...opt, ...options })
        } catch (e) {
            console.error(e)
            m = null
        } finally {
            if (!m) m = await conn.sendMessage(jid, { ...message, [mtype]: file }, { ...opt, ...options })
            return m
        }
    }

    conn.sendStic = async (jid, path, filename, quoted, options = {}) => {
        let type = await conn.getFile(path, true)
        let { res, data: file, filename: pathFile } = type
        if (res && res.status !== 200 || file.length <= 65536) {
            try { throw { json: JSON.parse(file.toString()) } }
            catch (e) { if (e.json) throw e.json }
        }
        let opt = { filename }
        if (quoted) opt.quoted = quoted

        let message = {
            ...options,
            sticker: { url: pathFile, isAvatar: true },
        }
        /**
         * @type {import('baileys').proto.WebMessageInfo}
         */
        let m
        try {
            m = await conn.sendMessage(jid, message, { ...opt, ...options })
        } catch (e) {
            console.error(e)
            m = null
        } finally {
            return m
        }
    }

    /**
     * Send Contact
     * @param {String} jid 
     * @param {String[][]|String[]} data
     * @param {import('baileys').proto.WebMessageInfo} quoted 
     * @param {Object} options 
     */
    conn.sendContact = async (jid, data, quoted, options) => {
        if (!Array.isArray(data[0]) && typeof data[0] === 'string') data = [data]
        let contacts = []
        for (let [number, name] of data) {
            number = number.replace(/[^0-9]/g, '')
            let njid = number + '@s.whatsapp.net'
            let biz = await conn.getBusinessProfile(njid).catch(_ => null) || {}
            let vcard = `BEGIN:VCARD
VERSION:3.0
N:;${name.replace(/\n/g, '\\n')};;;
FN:${name.replace(/\n/g, '\\n')}
TEL;type=CELL;type=VOICE;waid=${number}:${PhoneNumber('+' + number).getNumber('international')}${biz.description ? `
X-WA-BIZ-NAME:${(conn.contacts[njid]?.vname || conn.getName(njid) || name).replace(/\n/, '\\n')}
X-WA-BIZ-DESCRIPTION:${biz.description.replace(/\n/g, '\\n')}
`.trim() : ''}
END:VCARD
`.trim()

            contacts.push({ vcard, displayName: name })
        }
        return await conn.sendMessage(jid, {
            ...options,
            contacts: {
                ...options,
                displayName: (contacts.length >= 2 ? `${contacts.length} kontak` : contacts[0].displayName) || null,
                contacts,
            }
        }, { quoted, ...options })
    }

    /**
     * Reply to a message
     * @param {String} jid
     * @param {String} text
     * @param {proto.WebMessageInfo} quoted
     * @param {Object} options
     */
    conn.reply = (jid, text = '', quoted, options) => {
        return Buffer.isBuffer(text) ? conn.sendFile(jid, text, 'file', '', quoted, false, options) : conn.sendMessage(jid, { ...options, text }, { quoted, mentions: conn.parseMention(text), ...options })
    }

    /**
             * send Button
             * @param {String} jid 
             * @param {String} contentText 
             * @param {String} footer
             * @param {Buffer} buffer
             * @param {String[]|String[][]} buttons
             * @param {import('baileys').proto.WebMessageInfo} quoted
             * @param {Object} options
             */

    /**
     * Send an interactive (native flow) message.
     * Baileys v7 can't send buttons itself: WhatsApp only renders them when the stanza carries a `biz` node
     * (and a `bot` node in private chats). Node layout taken from community helpers; it is unofficial and
     * WhatsApp may change it at any time.
     * @param {String} jid
     * @param {{ text?: String, footer?: String, title?: String, media?: any, buttons: { name: String, buttonParamsJson: String }[] }} content
     * @param {import('baileys').proto.WebMessageInfo} quoted
     * @param {Object} options asLocation, contextInfo
     */
    conn.sendNativeFlow = async (jid, { text = '', footer = '', title, media, buttons = [] }, quoted, options = {}) => {
        let header = title ? { title, hasMediaAttachment: false } : undefined
        let file = media && await conn.getFile(media).catch(() => null)
        if (file?.data?.length) {
            const type = /video/.test(file.mime) ? 'video' : /image/.test(file.mime) ? 'image' : 'document'
            // WhatsApp shows "unsupported version" for webp (and other) image headers; YouTube serves
            // webp even for .jpg thumbnail URLs, so anything that isn't jpeg/png becomes jpeg
            if (type === 'image' && !/jpe?g|png/.test(file.mime)) file = { data: await sharp(file.data).jpeg().toBuffer(), mime: 'image/jpeg' }
            header = options.asLocation && type === 'image'
                ? { title, hasMediaAttachment: true, locationMessage: { jpegThumbnail: file.data } }
                : { title, hasMediaAttachment: true, ...await prepareWAMessageMedia({ [type]: file.data, mimetype: file.mime }, { upload: conn.waUploadToServer }) }
        }
        const msg = generateWAMessageFromContent(jid, {
            interactiveMessage: {
                ...(header ? { header } : {}),
                body: { text },
                footer: { text: footer },
                nativeFlowMessage: { buttons },
                contextInfo: { mentionedJid: conn.parseMention(text), ...options.contextInfo }
            }
        }, { userJid: conn.user.id, quoted: quoted?.message ? quoted : undefined }) // undecryptable/stub messages have no content to quote
        msg.message = { documentWithCaptionMessage: { message: msg.message } }
        const additionalNodes = [{
            tag: 'biz', attrs: {}, content: [{
                tag: 'interactive', attrs: { type: 'native_flow', v: '1' },
                content: [{ tag: 'native_flow', attrs: { v: '9', name: 'mixed' } }]
            }]
        }]
        if (!jid.endsWith('@g.us')) additionalNodes.push({ tag: 'bot', attrs: { biz_bot: '1' } })
        await conn.relayMessage(jid, msg.message, { messageId: msg.key.id, additionalNodes })
        msg.id = msg.key.id // same .id alias as sendMessage
        return msg
    }

    const quickReply = ([text, id]) => ({
        name: 'quick_reply',
        buttonParamsJson: JSON.stringify({ display_text: !nullish(text) && text || id || '', id: !nullish(id) && id || text || '' })
    })

    conn.sendButton = async (jid, text = '', footer = '', buffer, buttons, quoted, options) => {
        if (Array.isArray(buffer)) (options = quoted, quoted = buttons, buttons = buffer, buffer = null)
        if (!Array.isArray(buttons[0]) && typeof buttons[0] === 'string') buttons = [buttons]
        return conn.sendNativeFlow(jid, { text, footer, media: buffer, buttons: buttons.map(quickReply) }, quoted, options || {})
    }

    /**
     * 
     * @param {String} jid 
     * @param {String} text 
     * @param {String} footer 
     * @param {fs.PathLike} buffer
     * @param {String|string[]} url
     * @param {String|string[]} urlText
     * @param {String|string[]} call
     * @param {String|string[]} callText
     * @param {String[][]} buttons
     * @param {import('baileys').proto.WebMessageInfo} quoted
     * @param {Object} options
     */
    conn.sendHydrated = async (jid, text = '', footer = '', buffer, url, urlText, call, callText, buttons, quoted, options) => {
        let type
        if (buffer) try { (type = await conn.getFile(buffer), buffer = type.data) } catch { buffer = buffer }
        if (buffer && !Buffer.isBuffer(buffer) && (typeof buffer === 'string' || Array.isArray(buffer))) (options = quoted, quoted = buttons, buttons = callText, callText = call, call = urlText, urlText = url, url = buffer, buffer = null)
        if (!options) options = {}
        let nativeButtons = []
        if (url || urlText) {
            if (!Array.isArray(url)) url = [url]
            if (!Array.isArray(urlText)) urlText = [urlText]
            nativeButtons.push(...url.map((u, i) => ({
                name: 'cta_url',
                buttonParamsJson: JSON.stringify({ display_text: !nullish(urlText[i]) && urlText[i] || u || '', url: !nullish(u) && u || urlText[i] || '', merchant_url: !nullish(u) && u || urlText[i] || '' })
            })))
        }
        if (call || callText) {
            if (!Array.isArray(call)) call = [call]
            if (!Array.isArray(callText)) callText = [callText]
            nativeButtons.push(...call.map((c, i) => ({
                name: 'cta_call',
                buttonParamsJson: JSON.stringify({ display_text: !nullish(callText[i]) && callText[i] || c || '', phone_number: !nullish(c) && c || callText[i] || '' })
            })))
        }
        if (buttons?.length) {
            if (!Array.isArray(buttons[0])) buttons = [buttons]
            nativeButtons.push(...buttons.map(quickReply))
        }
        return conn.sendNativeFlow(jid, { text, footer, media: buffer, buttons: nativeButtons }, quoted, options)
    }

    /**
             * cMod
             * @param {String} jid 
             * @param {proto.WebMessageInfo} message 
             * @param {String} text 
             * @param {String} sender 
             * @param {*} options 
             * @returns 
             */
    conn.cMod = async (jid, message, text = '', sender = conn.user.jid, options = {}) => {
        if (options.mentions && !Array.isArray(options.mentions)) options.mentions = [options.mentions]
        let copy = message.toJSON()
        delete copy.message.messageContextInfo
        delete copy.message.senderKeyDistributionMessage
        let mtype = Object.keys(copy.message)[0]
        let msg = copy.message
        let content = msg[mtype]
        if (typeof content === 'string') msg[mtype] = text || content
        else if (content.caption) content.caption = text || content.caption
        else if (content.text) content.text = text || content.text
        if (typeof content !== 'string') {
            msg[mtype] = { ...content, ...options }
            msg[mtype].contextInfo = {
                ...(content.contextInfo || {}),
                mentionedJid: options.mentions || content.contextInfo?.mentionedJid || []
            }
        }
        if (copy.participant) sender = copy.participant = sender || copy.participant
        else if (copy.key.participant) sender = copy.key.participant = sender || copy.key.participant
        if (copy.key.remoteJid.includes('@s.whatsapp.net')) sender = sender || copy.key.remoteJid
        else if (copy.key.remoteJid.includes('@broadcast')) sender = sender || copy.key.remoteJid
        copy.key.remoteJid = jid
        copy.key.fromMe = areJidsSameUser(sender, conn.user.id) || false
        return proto.WebMessageInfo.fromObject(copy)
    }

    /**
     * Exact Copy Forward
     * @param {String} jid
     * @param {proto.WebMessageInfo} message
     * @param {Boolean|Number} forwardingScore
     * @param {Object} options
     */
    conn.copyNForward = async (jid, message, forwardingScore = true, options = {}) => {
        let vtype
        if (options.readViewOnce) {
            message.message = message?.message?.ephemeralMessage?.message ? message.message.ephemeralMessage.message : (message.message || undefined)
            vtype = Object.keys(message.message.viewOnceMessage.message)[0]
            delete (message.message?.ignore ? message.message.ignore : (message.message || undefined))
            delete message.message.viewOnceMessage.message[vtype].viewOnce
            message.message = {
                ...message.message.viewOnceMessage.message
            }
        }
        let m = generateForwardMessageContent(message, !!forwardingScore)
        let mtype = Object.keys(m)[0]
        if (forwardingScore && typeof forwardingScore == 'number' && forwardingScore > 1) m[mtype].contextInfo.forwardingScore += forwardingScore
        m = generateWAMessageFromContent(jid, m, { ...options, userJid: conn.user.id })
        await conn.relayMessage(jid, m.message, { messageId: m.key.id, additionalAttributes: { ...options } })
        return m
    }

    /**
     * Download media message
     * @param {Object} m
     * @param {String} type 
     * @param {fs.PathLike|fs.promises.FileHandle} filename
     * @returns {Promise<fs.PathLike|fs.promises.FileHandle|Buffer>}
     */
    conn.downloadM = async (m, type, saveToFile) => {
        if (!m || !(m.url || m.directPath)) return Buffer.alloc(0)
        const stream = await downloadContentFromMessage(m, type)
        let buffer = Buffer.from([])
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk])
        }
        if (saveToFile) var { filename } = await conn.getFile(buffer, true)
        return saveToFile && fs.existsSync(filename) ? filename : buffer
    }

    /**
     * Parses string into mentionedJid(s)
     * @param {String} text
     * @returns {Array<String>}
     */
    conn.parseMention = (text = '') => {
        return [...text.matchAll(/@([0-9]{5,16}|0)/g)].map(v => v[1] + '@s.whatsapp.net')
    }

    /**
     * Get name from jid
     * @param {String} jid
     * @param {Boolean} withoutContact
     */
    conn.getName = (jid = '', withoutContact = false) => {
        jid = conn.decodeJid(jid)
        withoutContact = conn.withoutContact || withoutContact
        let v
        if (jid.endsWith('@g.us')) return new Promise(async (resolve) => {
            v = conn.chats[jid] || {}
            if (!(v.name || v.subject)) v = await conn.groupMetadata(jid) || {}
            resolve(v.name || v.subject || PhoneNumber('+' + jid.replace('@s.whatsapp.net', '')).getNumber('international'))
        })
        else v = jid === '0@s.whatsapp.net' ? {
            jid,
            vname: 'WhatsApp'
        } : areJidsSameUser(jid, conn.user.id) ?
            conn.user :
            (conn.chats[jid] || {})
        return (withoutContact ? '' : v.name) || v.subject || v.vname || v.notify || v.verifiedName || PhoneNumber('+' + jid.replace('@s.whatsapp.net', '')).getNumber('international')
    }

    conn.loadMessage = conn.loadMessage || (async (messageID) => {
        return Object.entries(conn.chats)
            .filter(([_, { messages }]) => typeof messages === 'object')
            .find(([_, { messages }]) => Object.entries(messages)
                .find(([k, v]) => (k === messageID || v.key?.id === messageID)))
            ?.[1].messages?.[messageID]
    })

    /**
     * to process MessageStubType
     * @param {import('baileys').proto.WebMessageInfo} m 
     */
    conn.processMessageStubType = async (m) => {
        if (!m.messageStubType) return
        const chat = conn.decodeJid(m.key.remoteJid || m.message?.senderKeyDistributionMessage?.groupId || '')
        if (!chat || chat === 'status@broadcast') return
        const isGroup = chat.endsWith('@g.us')
        if (!isGroup) return
        let chats = conn.chats[chat]
        if (!chats) chats = conn.chats[chat] = { id: chat }
        chats.isChats = true
        const metadata = await conn.groupMetadata(chat).catch(_ => null)
        if (!metadata) return
        chats.subject = metadata.subject
        chats.metadata = metadata
    }

    /**
     * pushMessage
     * @param {import('baileys').proto.WebMessageInfo[]} m 
     */
    conn.pushMessage = async (m) => {
        if (!m) return
        if (!Array.isArray(m)) m = [m]
        for (const message of m) {
            try {
                if (!message) continue
                if (message.messageStubType && message.messageStubType != WAMessageStubType.CIPHERTEXT) conn.processMessageStubType(message).catch(console.error)
                const _mtype = Object.keys(message.message || {})
                const mtype = (!['senderKeyDistributionMessage', 'messageContextInfo'].includes(_mtype[0]) && _mtype[0]) ||
                    (_mtype.length >= 3 && _mtype[1] !== 'messageContextInfo' && _mtype[1]) ||
                    _mtype[_mtype.length - 1]
                const chat = conn.decodeJid(message.key.remoteJid || message.message?.senderKeyDistributionMessage?.groupId || '')
                if (message[mtype]?.contextInfo?.quotedMessage) console.log(message[mtype].contextInfo)
                if (!chat || chat === 'status@broadcast') continue
                const isGroup = chat.endsWith('@g.us')
                let chats = conn.chats[chat]
                if (!chats) {
                    if (isGroup) {
                        const groups = await conn.groupFetchAllParticipating().catch(_ => ({}))
                        for (const group in groups) conn.chats[group] = { id: group, subject: groups[group].subject, isChats: true, metadata: groups[group] }
                    }
                    chats = conn.chats[chat] = { id: chat, ...(conn.chats[chat] || {}) }
                }
                let metadata, sender
                if (isGroup) {
                    if (!chats.subject || !chats.metadata) {
                        metadata = await conn.groupMetadata(chat).catch(_ => ({})) || {}
                        if (!chats.subject) chats.subject = metadata.subject || ''
                        if (!chats.metadata) chats.metadata = metadata
                    }
                    sender = conn.decodeJid(message.fromMe && conn.user.id || message.participant || message.key.participant || chat || '')
                    if (sender !== chat) {
                        let chats = conn.chats[sender]
                        if (!chats) chats = conn.chats[sender] = { id: sender }
                        if (!chats.name) chats.name = message.pushName || chats.name || ''
                    }
                } else if (!chats.name) chats.name = message.pushName || chats.name || ''
                if (['senderKeyDistributionMessage', 'protocolMessage', 'messageContextInfo'].includes(mtype)) continue
                chats.isChats = true
                const fromMe = message.key.fromMe || areJidsSameUser(chat, conn.user.id)
                if (!chats.messages) chats.messages = {}
                if (!fromMe) chats.messages[message.key.id] = JSON.parse(JSON.stringify(message, null, 2))
                // TODO: push quotedMessage
            } catch (e) {
                console.error(e)
            }
        }
    }

    conn.sendGroupV4Invite = async (jid, to, inviteCode, inviteExpiration, groupName, caption, jpegThumbnail) => {
        return conn.relayMessage(to, {
            groupInviteMessage: {
                inviteCode: inviteCode,
                inviteExpiration: parseInt(inviteExpiration) || +new Date(new Date + (3 * 86400000)),
                groupJid: jid,
                groupName: (groupName ? groupName : await conn.getName(jid)) || null,
                jpegThumbnail: Buffer.isBuffer(jpegThumbnail) ? jpegThumbnail : await (await fetch(await conn.profilePictureUrl(jid))).buffer(),
                caption: caption
            }
        }, { messageId: 'KOMTOL' })
    }

    conn.setStatus = conn.setStatus || (async (status) => {
        return await conn.query({
            tag: 'iq',
            attrs: {
                to: conn.user.jid,
                type: 'set',
                xmlns: 'status',
            },
            content: [
                {
                    tag: 'status',
                    attrs: {},
                    content: Buffer.from(status, 'utf-8')
                }
            ]
        })
    })

    /**
     * Serialize Message, so it easier to manipulate
     * @param {proto.WebMessageInfo} m
     */
    conn.serializeM = (m) => {
        return smsg(conn, m)
    }

    return conn
}
/**
 * Serialize Message
 * @param {ReturnType<typeof makeWASocket>} conn 
 * @param {import('baileys').proto.WebMessageInfo} m 
 * @param {Boolean} hasParent 
 */
export function smsg(conn, m, hasParent) {
    if (!m) return m
    // must run before fromObject: the proto MessageKey has no *Alt fields and would drop them
    if (m.key) {
        conn.learnLid(m.key.participant, m.key.participantAlt)
        conn.learnLid(m.key.remoteJid, m.key.remoteJidAlt)
    }
    /**
     * @type {import('baileys').proto.WebMessageInfo}
     */
    let M = proto.WebMessageInfo
    m = M.fromObject(m)
    if (m.key) {
        m.id = m.key.id
        m.isBaileys = conn.isSentByBot(m.id)
        m.chat = conn.decodeJid(m.key.remoteJid || message.message?.senderKeyDistributionMessage?.groupId || '')
        m.isGroup = m.chat.endsWith('@g.us')
        m.sender = conn.decodeJid(m.key.fromMe && conn.user.id || m.participant || m.key.participant || m.chat || '')
        m.fromMe = m.key.fromMe || areJidsSameUser(m.sender, conn.user.id)
    }
    if (m.message) {
        let mtype = Object.keys(m.message)
        m.mtype = (!['senderKeyDistributionMessage', 'messageContextInfo'].includes(mtype[0]) && mtype[0]) || // Sometimes message in the front
            (mtype.length >= 3 && mtype[1] !== 'messageContextInfo' && mtype[1]) || // Sometimes message in midle if mtype length is greater than or equal to 3!
            mtype[mtype.length - 1] // common case
        m.msg = m.message[m.mtype]
        if (m.chat == 'status@broadcast' && ['protocolMessage', 'senderKeyDistributionMessage'].includes(m.mtype)) m.chat = (m.key.remoteJid !== 'status@broadcast' && m.key.remoteJid) || m.sender
        if (m.mtype == 'protocolMessage' && m.msg.key) {
            if (m.msg.key.remoteJid == 'status@broadcast') m.msg.key.remoteJid = m.chat
            if (!m.msg.key.participant || m.msg.key.participant == 'status_me') m.msg.key.participant = m.sender
            m.msg.key.fromMe = conn.decodeJid(m.msg.key.participant) === conn.decodeJid(conn.user.id)
            if (!m.msg.key.fromMe && m.msg.key.remoteJid === conn.decodeJid(conn.user.id)) m.msg.key.remoteJid = m.sender
        }
        m.text = m.msg.text || m.msg.caption || m.msg.contentText || m.msg || ''
        if (typeof m.text !== 'string') {
            if ([
                'protocolMessage',
                'messageContextInfo',
                'stickerMessage',
                'audioMessage',
                'senderKeyDistributionMessage'
            ].includes(m.mtype)) m.text = ''
            else m.text = m.text.selectedDisplayText || m.text.hydratedTemplate?.hydratedContentText || m.text.body?.text || m.text
        }
        m.mentionedJid = (m.msg?.contextInfo?.mentionedJid || []).map(conn.decodeJid)
        // unwrap documentWithCaptionMessage/viewOnce/ephemeral: sendNativeFlow wraps the bot's buttons that way
        let quoted = m.quoted = m.msg?.contextInfo?.quotedMessage ? normalizeMessageContent(m.msg.contextInfo.quotedMessage) : null
        if (m.quoted) {
            let type = getContentType(m.quoted) || Object.keys(m.quoted)[0]
            m.quoted = m.quoted[type]
            if (typeof m.quoted === 'string') m.quoted = { text: m.quoted }
            m.quoted.mtype = type
            m.quoted.id = m.msg.contextInfo.stanzaId
            m.quoted.chat = conn.decodeJid(m.msg.contextInfo.remoteJid || m.chat || m.sender)
            m.quoted.isBaileys = conn.isSentByBot(m.quoted.id)
            m.quoted.sender = conn.decodeJid(m.msg.contextInfo.participant)
            m.quoted.fromMe = m.quoted.isBaileys || areJidsSameUser(m.quoted.sender, conn.user.jid)
            // interactive (button) messages keep their text in body.text; game plugins read contentText
            m.quoted.text = m.quoted.text || m.quoted.caption || m.quoted.contentText || m.quoted.body?.text || ''
            if (!m.quoted.contentText) m.quoted.contentText = m.quoted.text
            m.quoted.name = conn.getName(m.quoted.sender)
            m.quoted.mentionedJid = (m.quoted.contextInfo?.mentionedJid || []).map(conn.decodeJid)
            let vM = m.quoted.fakeObj = M.fromObject({
                key: {
                    fromMe: m.quoted.fromMe,
                    remoteJid: m.quoted.chat,
                    id: m.quoted.id,
                    ...(m.isGroup ? { participant: m.quoted.sender } : {})
                },
                message: quoted,
                ...(m.isGroup ? { participant: m.quoted.sender } : {})
            })
            m.getQuotedObj = m.getQuotedMessage = async () => {
                if (!m.quoted.id) return null
                let q = M.fromObject(await conn.loadMessage(m.quoted.id) || vM)
                return smsg(conn, q)
            }

            if (m.quoted.url || m.quoted.directPath) m.quoted.download = (saveToFile = false) => conn.downloadM(m.quoted, m.quoted.mtype.replace(/message/i, ''), saveToFile)

            /**
             * Reply to quoted message
             * @param {String|Object} text
             * @param {String|false} chatId
             * @param {Object} options
             */
            m.quoted.reply = (text, chatId, options) => conn.reply(chatId ? chatId : m.chat, text, vM, options)

            /**
             * Copy quoted message
             */
            m.quoted.copy = () => smsg(conn, M.fromObject(M.toObject(vM)))

            /**
             * Forward quoted message
             * @param {String} jid
             *  @param {Boolean} forceForward
            */
            m.quoted.forward = (jid, forceForward = false) => conn.forwardMessage(jid, vM, forceForward)

            /**
             * Exact Forward quoted message
             * @param {String} jid
             * @param {Boolean|Number} forceForward
             * @param {Object} options
            */
            m.quoted.copyNForward = (jid, forceForward = true, options = {}) => conn.copyNForward(jid, vM, forceForward, options)

            /**
             * Modify quoted Message
             * @param {String} jid
             * @param {String} text
             * @param {String} sender
             * @param {Object} options
            */
            m.quoted.cMod = (jid, text = '', sender = m.quoted.sender, options = {}) => conn.cMod(jid, vM, text, sender, options)

            /**
             * Delete quoted message
             */
            m.quoted.delete = () => conn.sendMessage(m.quoted.chat, { delete: vM.key })
        }
    }
    m.name = !nullish(m.pushName) && m.pushName || conn.getName(m.sender)
    if (m.msg && m.msg.url) m.download = (saveToFile = false) => conn.downloadM(m.msg, m.mtype.replace(/message/i, ''), saveToFile)
    /**
     * Reply to this message
     * @param {String|Object} text
     * @param {String|false} chatId
     * @param {Object} options
     */
    m.reply = (text, chatId, options) => {
        return conn.reply(chatId ? chatId : m.chat, text, m, options)
    }

    /**
     * Copy this message
     */
    m.copy = () => smsg(conn, M.fromObject(M.toObject(m)))

    /**
     * Forward this message
     * @param {String} jid
     * @param {Boolean} forceForward
     */
    m.forward = (jid = m.chat, forceForward = false) => conn.copyNForward(jid, m, forceForward)

    /**
     * Exact Forward this message
     * @param {String} jid
     * @param {Boolean} forceForward
     * @param {Object} options
     */
    m.copyNForward = (jid = m.chat, forceForward = true, options = {}) => conn.copyNForward(jid, m, forceForward, options)

    /**
     * Modify this Message
     * @param {String} jid 
     * @param {String} text 
     * @param {String} sender 
     * @param {Object} options 
     */
    m.cMod = (jid, text = '', sender = m.sender, options = {}) => conn.cMod(jid, m, text, sender, options)

    /**
     * Delete this message
     */
    m.delete = () => conn.sendMessage(m.chat, { delete: m.key })

    try {
        if (m.msg && m.mtype == 'protocolMessage' && m.msg.key) conn.ev.emit('message.delete', m.msg.key)
    } catch (e) {
        console.error(e)
    }
    return m
}

export function logic(check, inp, out) {
    if (inp.length !== out.length) throw new Error('Input and Output must have same length')
    for (let i in inp) if (util.isDeepStrictEqual(check, inp[i])) return out[i]
    return null
}

export function protoType() {
    Buffer.prototype.toArrayBuffer = function toArrayBufferV2() {
        const ab = new ArrayBuffer(this.length);
        const view = new Uint8Array(ab);
        for (let i = 0; i < this.length; ++i) {
            view[i] = this[i];
        }
        return ab;
    }
    /**
     * @returns {ArrayBuffer}
     */
    Buffer.prototype.toArrayBufferV2 = function toArrayBuffer() {
        return this.buffer.slice(this.byteOffset, this.byteOffset + this.byteLength)
    }
    /**
     * @returns {Buffer}
     */
    ArrayBuffer.prototype.toBuffer = function toBuffer() {
        return Buffer.from(new Uint8Array(this))
    }
    // /**
    Uint8Array.prototype.getFileType = ArrayBuffer.prototype.getFileType = Buffer.prototype.getFileType = async function getFileType() {
        return await fileTypeFromBuffer(this)
    }
    /**
     * @returns {Boolean}
     */
    String.prototype.isNumber = Number.prototype.isNumber = isNumber
    /**
     * 
     * @returns {String}
     */
    String.prototype.capitalize = function capitalize() {
        return this.charAt(0).toUpperCase() + this.slice(1, this.length)
    }
    /**
     * @returns {String}
     */
    String.prototype.capitalizeV2 = function capitalizeV2() {
        const str = this.split(' ')
        return str.map(v => v.capitalize()).join(' ')
    }
    /**
     * number must be milliseconds
     * @returns {string}
     */
    Number.prototype.toTimeString = function toTimeString() {
        const seconds = Math.floor((this / 1000) % 60)
        const minutes = Math.floor((this / (60 * 1000)) % 60)
        const hours = Math.floor((this / (60 * 60 * 1000)) % 24)
        const days = Math.floor((this / (24 * 60 * 60 * 1000)))
        return (
            (days ? `${days} day(s) ` : '') +
            (hours ? `${hours} hour(s) ` : '') +
            (minutes ? `${minutes} minute(s) ` : '') +
            (seconds ? `${seconds} second(s)` : '')
        ).trim()
    }
    Number.prototype.getRandom = String.prototype.getRandom = Array.prototype.getRandom = getRandom
}

function isNumber() {
    const int = parseInt(this)
    return typeof int === 'number' && !isNaN(int)
}

function getRandom() {
    // ES modules are strict mode: for (10).getRandom() `this` is the primitive 10, not a Number object,
    // so instanceof alone never matched numbers or strings
    if (Array.isArray(this) || typeof this === 'string' || this instanceof String) return this[Math.floor(Math.random() * this.length)]
    if (typeof this === 'number' || this instanceof Number) return Math.floor(Math.random() * this)
}

/**
 * ??
 * @link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Nullish_coalescing_operator
 * @returns {boolean}
 */
function nullish(args) {
    return !(args !== null && args !== undefined)
}

function filename(pathURL = import.meta.url, rmPrefix = platform !== 'win32') {
    return rmPrefix ? /file:\/\/\//.test(pathURL) ? fileURLToPath(pathURL) : pathURL : pathToFileURL(pathURL).toString()
}

