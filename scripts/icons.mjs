import { chromium } from 'playwright-core'
import fs from 'node:fs'

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const browser = await chromium.launch({ executablePath: EDGE, headless: true })
const page = await browser.newPage({ viewport: { width: 512, height: 512 }, deviceScaleFactor: 1 })

const svg = `
<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="bg" cx="72%" cy="18%" r="85%">
      <stop offset="0" stop-color="#1c2a17"/>
      <stop offset=".55" stop-color="#0b100b"/>
      <stop offset="1" stop-color="#060906"/>
    </radialGradient>
    <linearGradient id="top" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ecffc0"/>
      <stop offset="1" stop-color="#b8f26a"/>
    </linearGradient>
    <linearGradient id="left" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#78b53e"/>
      <stop offset="1" stop-color="#4e7d2c"/>
    </linearGradient>
    <linearGradient id="right" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#a8e15f"/>
      <stop offset="1" stop-color="#77b743"/>
    </linearGradient>
    <filter id="glow" x="-100%" y="-100%" width="300%" height="300%">
      <feGaussianBlur stdDeviation="30"/>
    </filter>
    <filter id="shadow" x="-60%" y="-60%" width="220%" height="220%">
      <feDropShadow dx="0" dy="28" stdDeviation="26" flood-color="#000000" flood-opacity=".45"/>
    </filter>
  </defs>
  <rect width="512" height="512" rx="112" fill="url(#bg)"/>
  <circle cx="374" cy="98" r="120" fill="#9cdc50" opacity=".16" filter="url(#glow)"/>
  <path d="M0 395h512v117H0z" fill="#070a07" opacity=".28"/>
  <g filter="url(#shadow)">
    <path d="M256 103 427 198v120L256 413 85 318V198Z" fill="#8ed14b"/>
    <path d="M256 103 427 198 256 293 85 198Z" fill="url(#top)"/>
    <path d="M256 293v120L85 318V198Z" fill="url(#left)"/>
    <path d="M256 293v120l171-95V198Z" fill="url(#right)"/>
    <path d="m181 164 62 35v39l-62-35Zm113 35 47-26v38l-47 26Z" fill="#f4ffda" opacity=".55"/>
    <path d="m120 227 56 31v32l-56-32Zm82 45 27 15v34l-27-15Z" fill="#31521f" opacity=".34"/>
  </g>
  <circle cx="416" cy="401" r="7" fill="#b8f26a" opacity=".65"/>
  <circle cx="104" cy="391" r="4" fill="#b8f26a" opacity=".35"/>
</svg>`

await page.setContent(`
  <style>
    * { margin: 0; }
    html, body { width: 512px; height: 512px; background: #080b08; }
    svg { display: block; width: 512px; height: 512px; }
  </style>
  ${svg}
`)

fs.mkdirSync('public', { recursive: true })
for (const size of [512, 192, 180]) {
  await page.setViewportSize({ width: size, height: size })
  await page.evaluate((nextSize) => {
    const element = document.querySelector('svg')
    element.style.width = `${nextSize}px`
    element.style.height = `${nextSize}px`
    document.documentElement.style.width = `${nextSize}px`
    document.documentElement.style.height = `${nextSize}px`
    document.body.style.width = `${nextSize}px`
    document.body.style.height = `${nextSize}px`
  }, size)
  await page.screenshot({
    path: `public/kcn-${size}.png`,
    clip: { x: 0, y: 0, width: size, height: size },
    omitBackground: false,
  })
}

await browser.close()
console.log('Generated app icons.')
