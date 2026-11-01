import { chromium } from 'playwright-core'

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const browser = await chromium.launch({ executablePath: EDGE, headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const errors = []
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(`console: ${msg.text()}`)
})
page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`))

async function step(name, fn) {
  try {
    await fn()
    console.log(`PASS ${name}`)
  } catch (error) {
    console.log(`FAIL ${name}: ${error.message}`)
    throw error
  }
}

await page.goto('http://127.0.0.1:5178/', { waitUntil: 'networkidle' })
await page.waitForTimeout(500)

await step('home renders launcher', async () => {
  await page.getByRole('heading', { name: '今天，去哪个世界？' }).waitFor()
  await page.getByRole('button', { name: '启动游戏' }).waitFor()
})

await step('game version install starts', async () => {
  await page.getByRole('button', { name: '版本', exact: true }).click()
  await page.getByRole('button', { name: /1\.21\.8/ }).first().click()
  await page.getByRole('button', { name: '下载并安装' }).click()
  await page.waitForTimeout(500)
  await page.locator('.download-pill').waitFor()
})

await step('game install completes', async () => {
  await page.waitForTimeout(12000)
  await page.getByRole('button', { name: /1\.21\.8/ }).first().click()
  await page.getByRole('button', { name: '启动此版本' }).waitFor({ timeout: 3000 })
})

await step('launch reaches ready state', async () => {
  await page.getByRole('button', { name: '启动此版本' }).click()
  await page.getByText('世界已准备就绪').waitFor({ timeout: 9000 })
  await page.getByRole('button', { name: '返回启动器' }).click()
})

await step('mod installs', async () => {
  await page.getByRole('button', { name: '资源', exact: true }).click()
  await page.getByRole('button', { name: /Create/ }).first().click()
  await page.getByRole('button', { name: '安装 Mod' }).click()
  await page.waitForTimeout(3000)
  await page.getByRole('button', { name: /Create/ }).first().click()
  await page.getByRole('button', { name: '已安装到当前实例' }).waitFor()
  await page.getByRole('button', { name: '关闭' }).click()
})

await step('java auto-download starts', async () => {
  await page.getByRole('button', { name: '设置', exact: true }).click()
  await page.getByRole('button', { name: /管理/ }).click()
  await page.getByRole('button', { name: /自动下载 Java 21/ }).click()
  await page.waitForTimeout(400)
  await page.locator('.download-pill').waitFor()
})

await step('java download completes and runtime is ready', async () => {
  await page.waitForTimeout(9000)
  await page.getByText('OpenJDK 21 · Temurin · aarch64').waitFor({ timeout: 3000 })
})

await step('remove java and launch shows runtime error', async () => {
  await page.getByRole('button', { name: /管理/ }).click()
  const remove = page.getByRole('button', { name: '移除当前运行时' })
  await remove.click()
  await page.getByRole('button', { name: '再次点击确认移除运行时' }).click()
  await page.waitForTimeout(300)
  await page.getByRole('button', { name: '首页', exact: true }).click()
  await page.getByRole('button', { name: '启动游戏' }).click()
  await page.getByText('未找到可用的 Java 运行时').waitFor()
  await page.getByRole('button', { name: '关闭' }).click()
})

await step('error is written to logs', async () => {
  await page.getByRole('button', { name: '日志', exact: true }).click()
  await page.getByRole('button', { name: /错误/ }).first().click()
  await page.getByText(/未找到可用的 Java 运行时/).first().waitFor()
})

await step('log export triggers download', async () => {
  const downloadPromise = page.waitForEvent('download', { timeout: 5000 })
  await page.getByRole('button', { name: '导出日志' }).click()
  const download = await downloadPromise
  console.log('DOWNLOAD:', download.suggestedFilename())
})

await browser.close()

if (errors.length) {
  console.log('BROWSER ERRORS:')
  errors.forEach((error) => console.log(error))
  process.exitCode = 1
} else {
  console.log('No browser errors. All flows passed.')
}
