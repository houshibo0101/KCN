import { useCallback, useEffect, useRef, useState } from 'react'
import {
  StatusBar,
  TopBar,
  BottomNav,
  DownloadPill,
  Toast,
  DesktopShowcase,
  LaunchScreen,
} from './components/Chrome'
import {
  VersionSheet,
  ResourceSheet,
  JavaSheet,
  DownloadsSheet,
} from './components/Sheets'
import { HomePage } from './pages/HomePage'
import { VersionsPage } from './pages/VersionsPage'
import { ResourcesPage } from './pages/ResourcesPage'
import { LogsPage } from './pages/LogsPage'
import { SettingsPage } from './pages/SettingsPage'
import {
  VERSIONS,
  MODS,
  SHADERS,
  createInitialLogs,
  makeLog,
  clockText,
} from './data'

function taskEta(progress) {
  const seconds = Math.max(1, Math.round((100 - progress) / 8))
  return `约 ${seconds} 秒`
}

function parseSize(label) {
  const text = String(label)
  const size = Number.parseFloat(text.replace(/[^\d.]/g, ''))
  if (!Number.isFinite(size)) return 1
  if (/kb/i.test(text)) return size / 1024
  if (/gb/i.test(text)) return size * 1024
  return size
}

export default function App() {
  const [tab, setTab] = useState('home')
  const [resourceTab, setResourceTab] = useState('mods')
  const [account, setAccount] = useState('Alex')
  const [now, setNow] = useState(new Date())

  const [versions, setVersions] = useState(() =>
    VERSIONS.map((version) => ({
      ...version,
      installed: version.id === '1.21.4',
      installedLoader: version.id === '1.21.4' ? 'Fabric' : null,
    })),
  )
  const [activeVersion, setActiveVersion] = useState('1.21.4')
  const [activeLoader, setActiveLoader] = useState('Fabric')
  const [installedMods, setInstalledMods] = useState([
    'sodium',
    'iris',
    'fabric-api',
    'jei',
  ])
  const [installedShaders, setInstalledShaders] = useState(['complementary'])

  const [java, setJava] = useState({
    installed: true,
    version: '21.0.5',
    distro: 'Temurin',
    arch: 'aarch64',
    path: '/storage/emulated/0/KCN/java/jre-21',
  })
  const [memory, setMemory] = useState(4)
  const [downloadSource, setDownloadSource] = useState('自动')

  const [tasks, setTasks] = useState([])
  const [logs, setLogs] = useState(createInitialLogs)
  const [toast, setToast] = useState(null)
  const [sheet, setSheet] = useState(null)
  const [launch, setLaunch] = useState(null)

  const screenRef = useRef(null)
  const toastTimer = useRef(null)
  const completeRef = useRef(null)
  const launchLoggedRef = useRef(false)
  const taskMilestonesRef = useRef({})

  const notify = useCallback((message, type = 'success') => {
    setToast({ id: Date.now(), message, type })
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 3300)
  }, [])

  const addLog = useCallback((level, source, message) => {
    setLogs((previous) => [
      ...previous.slice(-248),
      makeLog(level, source, message),
    ])
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    return () => window.clearTimeout(toastTimer.current)
  }, [])

  useEffect(() => {
    screenRef.current?.scrollTo({ top: 0 })
  }, [tab])

  useEffect(() => {
    function onError(event) {
      addLog('ERROR', 'system', `未捕获异常：${event.message || 'Unknown error'}`)
    }
    function onRejection(event) {
      addLog('ERROR', 'system', `Promise 异常：${String(event.reason)}`)
    }
    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onRejection)
    return () => {
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onRejection)
    }
  }, [addLog])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTasks((previous) => {
        if (!previous.some((task) => task.status === 'running')) return previous
        return previous.map((task) => {
          if (task.status !== 'running') return task
          const base =
            task.kind === 'game' ? 4.2 : task.kind === 'java' ? 5.4 : 13.2
          const next = Math.min(100, task.progress + base + Math.random() * 2.8)
          const duration =
            task.kind === 'game' ? 10 : task.kind === 'java' ? 8 : 3.2
          return {
            ...task,
            progress: next,
            speed: (task.totalMb / duration) * (0.82 + Math.random() * 0.32),
            eta: taskEta(next),
          }
        })
      })
    }, 420)
    return () => window.clearInterval(timer)
  }, [])

  completeRef.current = (task) => {
    if (task.kind === 'game') {
      setVersions((previous) =>
        previous.map((version) =>
          version.id === task.meta.version
            ? {
                ...version,
                installed: true,
                installedLoader: task.meta.loader,
              }
            : version,
        ),
      )
      addLog(
        'INFO',
        'install',
        `Minecraft ${task.meta.version} (${task.meta.loader}) 安装完成 · 68 个库文件校验通过`,
      )
      notify(`Minecraft ${task.meta.version} 已安装`)
    }

    if (task.kind === 'mod') {
      setInstalledMods((previous) =>
        previous.includes(task.meta.resourceId)
          ? previous
          : [...previous, task.meta.resourceId],
      )
      addLog('INFO', 'mods', `${task.meta.resourceName} 已安装到 Crafty 生存`)
      notify(`${task.meta.resourceName} 安装成功`)
    }

    if (task.kind === 'shader') {
      setInstalledShaders((previous) =>
        previous.includes(task.meta.resourceId)
          ? previous
          : [...previous, task.meta.resourceId],
      )
      addLog('INFO', 'renderer', `${task.meta.resourceName} 已安装 · 等待 Iris 加载`)
      notify(`${task.meta.resourceName} 光影已安装`)
    }

    if (task.kind === 'java') {
      setJava({
        installed: true,
        version: task.meta.javaVersion,
        distro: task.meta.distro,
        arch: 'aarch64',
        path: `/storage/emulated/0/KCN/java/jre-${task.meta.javaVersion}`,
      })
      addLog(
        'INFO',
        'java',
        `Java ${task.meta.javaVersion} (${task.meta.distro}) 下载完成 · 运行时校验通过`,
      )
      notify(`Java ${task.meta.javaVersion} 已配置完成`)
    }
  }

  useEffect(() => {
    const milestonesByKind = {
      game: [
        [26, 'INFO', 'network', '正在下载 client.jar · 已连接资源节点'],
        [52, 'INFO', 'install', '版本清单校验通过 · 开始下载 68 个运行库'],
        [78, 'INFO', 'install', '资源索引补齐 1,842 个文件 · 校验 SHA-1'],
        [94, 'INFO', 'install', '正在写入版本 JSON 与启动配置'],
      ],
      java: [
        [32, 'INFO', 'java', '下载 OpenJDK 归档 · 传输已加密'],
        [64, 'INFO', 'java', 'SHA-256 校验通过 · 正在解压运行时'],
        [88, 'INFO', 'java', '写入 JAVA_HOME 与实例运行时配置'],
      ],
      mod: [
        [45, 'INFO', 'mods', '获取 Mod 元数据 · 检查依赖关系'],
        [82, 'INFO', 'mods', 'Fabric API 依赖已满足 · 写入 mods 目录'],
      ],
      shader: [
        [45, 'INFO', 'renderer', '解析光影包结构 · 检查 Iris 兼容性'],
        [82, 'INFO', 'renderer', '着色器缓存已更新 · 等待游戏加载'],
      ],
    }

    tasks.forEach((task) => {
      if (task.status !== 'running') return
      const seen = taskMilestonesRef.current[task.id] || new Set()
      const milestones = milestonesByKind[task.kind] || []
      milestones.forEach(([threshold, level, source, message]) => {
        if (task.progress >= threshold && !seen.has(threshold)) {
          seen.add(threshold)
          addLog(level, source, message)
        }
      })
      taskMilestonesRef.current[task.id] = seen
    })
  }, [tasks, addLog])

  useEffect(() => {
    const finished = tasks.filter(
      (task) => task.status === 'running' && task.progress >= 100,
    )
    if (finished.length === 0) return
    setTasks((previous) =>
      previous.map((task) =>
        finished.some((item) => item.id === task.id)
          ? { ...task, status: 'done', speed: 0, eta: '已完成' }
          : task,
      ),
    )
    finished.forEach((task) => completeRef.current(task))
  }, [tasks])

  const launchRunning = Boolean(launch && !launch.done)

  useEffect(() => {
    if (!launchRunning) return
    const timer = window.setInterval(() => {
      setLaunch((previous) => {
        if (!previous || previous.done) return previous
        const next = Math.min(100, previous.progress + 5.2 + Math.random() * 2.8)
        return { ...previous, progress: next, done: next >= 100 }
      })
    }, 390)
    return () => window.clearInterval(timer)
  }, [launchRunning])

  useEffect(() => {
    if (launch?.done && !launchLoggedRef.current) {
      launchLoggedRef.current = true
      addLog(
        'INFO',
        'launch',
        `启动流程完成 · ${launch.version} · ${launch.loader} · 所有检查通过`,
      )
      notify('启动准备完成')
    }
    if (!launch) launchLoggedRef.current = false
  }, [launch, addLog, notify])

  function navigate(next, sub) {
    if (next === 'resources' && sub) setResourceTab(sub)
    setTab(next)
  }

  function startTask(task) {
    setTasks((previous) => [...previous.slice(-14), task])
  }

  function startGameInstall(version, loader) {
    const running = tasks.find(
      (task) =>
        task.kind === 'game' &&
        task.meta?.version === version.id &&
        task.status === 'running',
    )
    if (running) {
      notify('这个版本已经在下载队列中', 'info')
      setSheet({ type: 'downloads' })
      return
    }
    const id = `game-${version.id}-${Date.now()}`
    startTask({
      id,
      kind: 'game',
      title: `Minecraft ${version.id}`,
      subtitle: `${loader} · 获取版本清单`,
      sizeLabel: `${version.size} · ${loader}`,
      totalMb: parseSize(version.size),
      speed: parseSize(version.size) / 10,
      eta: '约 10 秒',
      progress: 0,
      status: 'running',
      meta: { version: version.id, loader },
    })
    addLog('INFO', 'install', `开始安装 Minecraft ${version.id} (${loader}) · ${version.size}`)
    setSheet(null)
    notify('已加入下载队列')
  }

  function startResourceInstall(type, resource) {
    const kind = type === 'shader' ? 'shader' : 'mod'
    const running = tasks.find(
      (task) =>
        task.kind === kind &&
        task.meta?.resourceId === resource.id &&
        task.status === 'running',
    )
    if (running) {
      notify('这个资源正在下载中', 'info')
      return
    }
    startTask({
      id: `${kind}-${resource.id}-${Date.now()}`,
      kind,
      title: resource.name,
      subtitle: `${resource.version} · 下载并校验`,
      sizeLabel: resource.size,
      totalMb: parseSize(resource.size),
      speed: parseSize(resource.size) / 3.2,
      eta: '约 3 秒',
      progress: 0,
      status: 'running',
      meta: {
        resourceId: resource.id,
        resourceName: resource.name,
      },
    })
    addLog(
      'INFO',
      kind === 'shader' ? 'renderer' : 'mods',
      `开始下载${kind === 'shader' ? '光影' : ' Mod'} ${resource.name} · ${resource.size}`,
    )
    setSheet(null)
    notify('已加入下载队列')
  }

  function startJavaDownload({ version, distro }) {
    const running = tasks.find(
      (task) => task.kind === 'java' && task.status === 'running',
    )
    if (running) {
      notify('Java 运行时正在下载中', 'info')
      setSheet({ type: 'downloads' })
      return
    }
    startTask({
      id: `java-${version.id}-${Date.now()}`,
      kind: 'java',
      title: `Java ${version.id}`,
      subtitle: `${distro.name} · 自动解压配置`,
      sizeLabel: version.size,
      totalMb: parseSize(version.size),
      speed: parseSize(version.size) / 8,
      eta: '约 8 秒',
      progress: 0,
      status: 'running',
      meta: { javaVersion: version.id, distro: distro.name },
    })
    addLog(
      'INFO',
      'java',
      `开始下载 Java ${version.id} (${distro.name}) · ${version.size} · aarch64`,
    )
    setSheet(null)
    setTab('settings')
    notify(`Java ${version.id} 开始下载`)
  }

  function launchGame(versionId = activeVersion) {
    const version = versions.find((item) => item.id === versionId)
    if (!version) return
    if (!version.installed) {
      addLog('ERROR', 'launch', `启动 ${version.id} 失败：游戏文件尚未安装`)
      notify('请先下载这个版本', 'error')
      setSheet({ type: 'version', id: version.id })
      return
    }
    if (!java.installed) {
      addLog(
        'ERROR',
        'java',
        `启动 Minecraft ${version.id} 失败：未找到可用的 Java 运行时`,
      )
      notify('未检测到 Java 运行时', 'error')
      setSheet({ type: 'java', error: true })
      return
    }
    const loader = version.installedLoader || activeLoader
    setActiveVersion(version.id)
    setActiveLoader(loader)
    addLog(
      'INFO',
      'launch',
      `启动实例 Crafty 生存 · Minecraft ${version.id} · ${loader} · Java ${java.version}`,
    )
    addLog('INFO', 'launch', '开始校验 68 个运行库与资源索引…')
    setLaunch({
      progress: 0,
      done: false,
      version: version.id,
      loader,
      account,
    })
  }

  function launchVersion(versionId) {
    setSheet(null)
    window.setTimeout(() => launchGame(versionId), 0)
  }

  function cancelTask(id) {
    const task = tasks.find((item) => item.id === id)
    if (!task) return
    setTasks((previous) =>
      previous.map((item) =>
        item.id === id ? { ...item, status: 'cancelled', speed: 0, eta: '已取消' } : item,
      ),
    )
    addLog('WARN', 'install', `用户取消了下载任务：${task.title}`)
    notify('下载任务已取消', 'info')
  }

  function removeJava() {
    setJava((previous) => ({ ...previous, installed: false }))
    addLog('WARN', 'java', 'Java 运行时已被移除，启动游戏前需要重新配置')
    setSheet(null)
    notify('Java 运行时已移除', 'info')
  }

  async function installApp() {
    const href = '/downloads/KCN-core-0.1.3.apk'
    addLog('INFO', 'launcher', '开始下载 KCN Core 0.1.3 Android APK')
    notify('正在下载 KCN Core 0.1.3', 'info')
    const anchor = document.createElement('a')
    anchor.href = href
    anchor.download = 'KCN-core-0.1.3.apk'
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
  }

  const activeTasks = tasks.filter((task) => task.status === 'running')
  const activeTask = activeTasks[0]

  const openVersion = (id) => setSheet({ type: 'version', id })
  const openResource = (type, id) =>
    setSheet({ type: 'resource', resourceType: type, id })
  const openJava = () => setSheet({ type: 'java' })
  const openDownloads = () => setSheet({ type: 'downloads' })

  const sheetVersion =
    sheet?.type === 'version'
      ? versions.find((version) => version.id === sheet.id)
      : null
  const sheetResource =
    sheet?.type === 'resource'
      ? sheet.resourceType === 'shader'
        ? SHADERS.find((item) => item.id === sheet.id)
        : MODS.find((item) => item.id === sheet.id)
      : null

  let page = null
  if (tab === 'home') {
    page = (
      <HomePage
        account={account || 'Alex'}
        versions={versions}
        activeVersion={activeVersion}
        activeLoader={activeLoader}
        installedMods={installedMods}
        installedShaders={installedShaders}
        java={java}
        onLaunch={launchGame}
        onNavigate={navigate}
        onOpenVersion={openVersion}
        onOpenResource={openResource}
        onOpenJava={openJava}
        onOpenDownloads={openDownloads}
      />
    )
  } else if (tab === 'versions') {
    page = (
      <VersionsPage
        versions={versions}
        activeVersion={activeVersion}
        tasks={tasks}
        onOpenVersion={openVersion}
        onOpenDownloads={openDownloads}
      />
    )
  } else if (tab === 'resources') {
    page = (
      <ResourcesPage
        initialTab={resourceTab}
        installedMods={installedMods}
        installedShaders={installedShaders}
        tasks={tasks}
        onOpenResource={openResource}
        onOpenDownloads={openDownloads}
      />
    )
  } else if (tab === 'logs') {
    page = (
      <LogsPage
        logs={logs}
        onClear={() => setLogs([])}
        notify={notify}
      />
    )
  } else {
    page = (
      <SettingsPage
        account={account}
        onAccountChange={setAccount}
        java={java}
        memory={memory}
        onMemoryChange={setMemory}
        downloadSource={downloadSource}
        onDownloadSourceChange={setDownloadSource}
        versions={versions}
        installedMods={installedMods.length}
        installedShaders={installedShaders.length}
        tasks={tasks}
        onOpenJava={openJava}
        onOpenDownloads={openDownloads}
        onInstallApp={installApp}
        notify={notify}
      />
    )
  }

  return (
    <div className="stage">
      <div className="stage-grid" aria-hidden="true" />
      <div className="stage-glow glow-a" aria-hidden="true" />
      <div className="stage-glow glow-b" aria-hidden="true" />
      <DesktopShowcase />

      <div className="device-wrap">
        <div className="device-glow" aria-hidden="true" />
        <div className="device">
          <span className="device-island" aria-hidden="true" />
          <div className="device-screen">
            <StatusBar time={clockText(now)} />
            <div className="app">
              <TopBar
                account={account || 'Alex'}
                activeCount={activeTasks.length}
                onDownloads={openDownloads}
                onSettings={() => navigate('settings')}
              />

              <main className="screen" ref={screenRef}>
                <div className="page-wrap" key={tab}>
                  {page}
                </div>
              </main>

              <DownloadPill
                task={activeTask}
                count={activeTasks.length}
                onClick={openDownloads}
              />
              <BottomNav tab={tab} onChange={(next) => navigate(next)} />

              {toast && <Toast toast={toast} />}

              {sheet?.type === 'version' && sheetVersion && (
                <VersionSheet
                  version={sheetVersion}
                  tasks={tasks}
                  activeVersion={activeVersion}
                  activeLoader={activeLoader}
                  onClose={() => setSheet(null)}
                  onInstall={startGameInstall}
                  onLaunch={launchVersion}
                />
              )}

              {sheet?.type === 'resource' && sheetResource && (
                <ResourceSheet
                  type={sheet.resourceType}
                  resource={sheetResource}
                  installed={
                    sheet.resourceType === 'shader'
                      ? installedShaders.includes(sheetResource.id)
                      : installedMods.includes(sheetResource.id)
                  }
                  task={tasks.find(
                    (task) =>
                      (task.kind === 'mod' || task.kind === 'shader') &&
                      task.meta?.resourceId === sheetResource.id &&
                      task.status === 'running',
                  )}
                  installedMods={installedMods}
                  onClose={() => setSheet(null)}
                  onInstall={startResourceInstall}
                />
              )}

              {sheet?.type === 'java' && (
                <JavaSheet
                  java={java}
                  error={Boolean(sheet.error)}
                  onClose={() => setSheet(null)}
                  onDownload={startJavaDownload}
                  onRemove={removeJava}
                  notify={notify}
                />
              )}

              {sheet?.type === 'downloads' && (
                <DownloadsSheet
                  tasks={tasks}
                  onClose={() => setSheet(null)}
                  onCancel={cancelTask}
                  onClearDone={() => {
                    setTasks((previous) =>
                      previous.filter((task) => task.status === 'running'),
                    )
                    notify('已清除完成记录', 'info')
                  }}
                  onOpenLogs={() => {
                    setSheet(null)
                    setTab('logs')
                  }}
                />
              )}

              {launch && (
                <LaunchScreen
                  progress={launch.progress}
                  done={launch.done}
                  account={launch.account}
                  version={launch.version}
                  loader={launch.loader}
                  onCancel={() => {
                    setLaunch(null)
                    addLog('WARN', 'launch', '用户取消了启动流程')
                    notify('已取消启动', 'info')
                  }}
                  onClose={() => setLaunch(null)}
                  onViewLogs={() => {
                    setLaunch(null)
                    setTab('logs')
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
