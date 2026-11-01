import { chromium } from 'playwright-core'
import fs from 'node:fs'
import path from 'node:path'

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const URL = 'http://127.0.0.1:5178/'
const OUT = path.resolve('shots')
fs.mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch({
  executablePath: EDGE,
  headless: true,
  args: ['--disable-gpu', '--force-color-profile=srgb'],
})

const errors = []

async function newPage(viewport) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1 })
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console: ${msg.text()}`)
  })
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`))
  await page.goto(URL, { waitUntil: 'networkidle' })
  await page.waitForTimeout(700)
  return page
}

async function captureFull(name, viewport = { width: 1440, height: 900 }) {
  const page = await newPage(viewport)
  await page.screenshot({ path: path.join(OUT, `${name}.png`) })
  await page.close()
}

async function capturePhone(name, viewport = { width: 1440, height: 900 }, action) {
  const page = await newPage(viewport)
  if (action) await action(page)
  await page.waitForTimeout(450)
  await page.locator('.device').screenshot({ path: path.join(OUT, `${name}.png`) })
  await page.close()
}

await captureFull('home-desktop')
await captureFull('home-mobile', { width: 390, height: 844 })
await capturePhone('phone-home')

await capturePhone('phone-versions', undefined, async (page) => {
  await page.getByRole('button', { name: '版本', exact: true }).click()
})

await capturePhone('phone-resources', undefined, async (page) => {
  await page.getByRole('button', { name: '资源', exact: true }).click()
})

await capturePhone('phone-shaders', undefined, async (page) => {
  await page.getByRole('button', { name: '资源', exact: true }).click()
  await page.getByRole('tab', { name: /光影/ }).click()
})

await capturePhone('phone-logs', undefined, async (page) => {
  await page.getByRole('button', { name: '日志', exact: true }).click()
})

await capturePhone('phone-settings', undefined, async (page) => {
  await page.getByRole('button', { name: '设置', exact: true }).click()
})

await capturePhone('phone-version-sheet', undefined, async (page) => {
  await page.getByRole('button', { name: '版本', exact: true }).click()
  await page.getByRole('button', { name: /1\.21\.8/ }).first().click()
})

await capturePhone('phone-resource-sheet', undefined, async (page) => {
  await page.getByRole('button', { name: '资源', exact: true }).click()
  await page.getByRole('button', { name: /Sodium/ }).first().click()
})

await capturePhone('phone-java-sheet', undefined, async (page) => {
  await page.getByRole('button', { name: '设置', exact: true }).click()
  await page.getByRole('button', { name: /管理/ }).click()
})

await capturePhone('phone-downloads', undefined, async (page) => {
  await page.getByRole('button', { name: '版本', exact: true }).click()
  await page.getByRole('button', { name: /1\.21\.8/ }).first().click()
  await page.getByRole('button', { name: '下载并安装' }).click()
  await page.waitForTimeout(1600)
  await page.locator('.download-pill').click()
})

await capturePhone('phone-launch', undefined, async (page) => {
  await page.getByRole('button', { name: '启动游戏' }).click()
  await page.waitForTimeout(1400)
})

await capturePhone('phone-launch-done', undefined, async (page) => {
  await page.getByRole('button', { name: '启动游戏' }).click()
  await page.waitForTimeout(8000)
})

await browser.close()

if (errors.length) {
  console.log('BROWSER ERRORS:')
  errors.forEach((error) => console.log(error))
} else {
  console.log('No browser errors.')
}

console.log('Screenshots:', fs.readdirSync(OUT).filter((name) => name.endsWith('.png')).join(', '))
