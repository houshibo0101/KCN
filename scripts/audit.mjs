import { chromium } from 'playwright-core'

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const browser = await chromium.launch({ executablePath: EDGE, headless: true })
const viewports = [
  { width: 390, height: 844 },
  { width: 360, height: 740 },
  { width: 430, height: 932 },
]
const tabs = ['首页', '版本', '资源', '日志', '设置']
let failed = false

for (const viewport of viewports) {
  const page = await browser.newPage({ viewport })
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('http://127.0.0.1:5178/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(300)
  for (const tab of tabs) {
    await page.getByRole('button', { name: tab, exact: true }).click()
    await page.waitForTimeout(250)
    const metrics = await page.evaluate(() => {
      const doc = document.documentElement
      const screen = document.querySelector('.screen')
      return {
        docWidth: doc.scrollWidth,
        innerWidth: window.innerWidth,
        screenWidth: screen?.scrollWidth,
        screenClient: screen?.clientWidth,
        overflow: screen ? screen.scrollWidth > screen.clientWidth + 1 : false,
      }
    })
    const bad = metrics.overflow || metrics.docWidth > metrics.innerWidth + 1
    if (bad) failed = true
    console.log(
      `${bad ? 'OVERFLOW' : 'OK'} ${viewport.width}x${viewport.height} ${tab}`,
      JSON.stringify(metrics),
    )
  }
  if (errors.length) {
    failed = true
    console.log('ERRORS', errors)
  }
  await page.close()
}

await browser.close()
if (failed) process.exitCode = 1
