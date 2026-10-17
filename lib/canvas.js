import { spawn } from 'child_process'
import { join } from 'path'

/** Run ImageMagick and return stdout. gm is skipped: it has no `caption:` */
const im = (args, input) => new Promise((resolve, reject) => {
    const [cmd, ...pre] = global.support.magick ? ['magick'] : ['convert']
    const out = [], err = []
    const p = spawn(cmd, [...pre, ...args])
    p.on('error', reject)
    p.stdin.on('error', () => {}) // magick may exit before reading all of stdin; the close code reports it
    p.stdin.end(input)
    p.stdout.on('data', c => out.push(c))
    p.stderr.on('data', c => err.push(c))
    p.on('close', code => code === 0 ? resolve(Buffer.concat(out)) : reject(Buffer.concat(err).toString() || 'ImageMagick exit ' + code))
})

// user text goes into caption:, where a leading @ reads a file and % / \ are escapes
const imText = text => text.replace(/\\/g, '\\\\').replace(/%/g, '%%').replace(/^@/, '\\@')
const textFrame = (text, fill, stroke, size = '512x512') => ['(', '-size', size, '-background', 'none', '-font', './src/font/Roboto-Black.ttf',
    '-fill', fill, '-stroke', stroke, '-strokewidth', '4', '-gravity', 'center', 'caption:' + imText(text), ')']

/**
 * Meme: top/bottom text over an image (memegen.link refuses most image hosts)
 * @param {Buffer} img
 * @returns {Promise<Buffer>} png, 512px wide
 */
export const smeme = (img, top = '', bottom = '') => im(['-', '-resize', '512x',
    ...(top ? [...textFrame(top, 'white', 'black', '500x120'), '-gravity', 'north', '-geometry', '+0+6', '-composite'] : []),
    ...(bottom ? [...textFrame(bottom, 'white', 'black', '500x120'), '-gravity', 'south', '-geometry', '+0+6', '-composite'] : []),
    'png:-'], img)

/**
 * Text to transparent 512x512 png, auto-sized to fit
 * @returns {Promise<Buffer>}
 */
export const ttp = (text, fill = 'white', stroke = 'black') => im([...textFrame(text, fill, stroke), 'png:-'])

/**
 * Text to animated gif, one frame per color
 * @returns {Promise<Buffer>}
 */
export const attp = (text, colors = ['red', 'orange', 'yellow', 'lime', 'cyan', 'blue', 'magenta'], stroke = 'black') =>
    im(['-delay', '15', '-loop', '0', '-dispose', 'previous', ...colors.flatMap(c => textFrame(text, c, stroke)), 'gif:-'])
/**
 * Levelup image
 * @param {String} teks 
 * @param {Number} level 
 * @returns {Promise<Buffer>}
 */
export function levelup(teks, level) {
    return new Promise(async (resolve, reject) => {
        if (!(global.support.convert || global.support.magick || global.support.gm)) return reject('Not Support!')
        const font = './src/font'
        let fontLevel = join(font, './level_c.otf')
        let fontTexts = join(font, './texts.otf')
        let xtsx = './src/lvlup_template.jpg'
        let anotations = '+1385+260' // gapake else if kadang error
        if (level > 2) anotations = '+1370+260'
        if (level > 10) anotations = '+1330+260'
        if (level > 50) anotations = '+1310+260'
        if (level > 100) anotations = '+1260+260'

        const [_spawnprocess, ..._spawnargs] = [...(global.support.gm ? ['gm'] : global.support.magick ? ['magick'] : []),
            'convert',
            xtsx,
            '-font',
            fontTexts,
            '-fill',
            '#0F3E6A',
            '-size',
            '1024x784',
            '-pointsize',
            '68',
            '-interline-spacing',
            '-7.5',
            '-annotate',
            '+153+200',
            teks,
            //original together
            '-font',
            fontLevel,
            '-fill',
            '#0A2A48',
            '-size',
            '1024x784',
            '-pointsize',
            '140',
            '-interline-spacing',
            '-1.2',
            '-annotate',
            anotations,
            String(level), // spawn args must be strings
            '-append',
            'jpg:-'
        ]
        let bufs = []
        spawn(_spawnprocess, _spawnargs)
            .on('error', reject)
            .on('close', () => {
                return resolve(Buffer.concat(bufs))
            })
            .stdout.on('data', chunk => bufs.push(chunk))
    })
}