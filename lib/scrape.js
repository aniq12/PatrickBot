import fetch from 'node-fetch'

/**
 * TikTok video/slideshow via tikwm.com.
 * `images` is set for photo slideshows, where `video` is just the soundtrack.
 * @param {string} url
 */
async function tiktok(url) {
    try {
        const { code, msg, data } = await (await fetch('https://www.tikwm.com/api/?hd=1&url=' + encodeURIComponent(url))).json()
        if (code !== 0) return { status: false, message: msg }
        return {
            status: true,
            author: data.author?.nickname || '',
            caption: data.title || '',
            video: data.hdplay || data.play,
            videoWM: data.wmplay,
            audio: data.music || false,
            images: data.images || []
        }
    } catch (e) {
        console.log(e)
        return { status: false, message: e.message }
    }
}

export {
    tiktok
}
