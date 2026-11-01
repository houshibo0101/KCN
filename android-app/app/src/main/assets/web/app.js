(function () {
  'use strict'

  const native = typeof window.KCNNative !== 'undefined' ? window.KCNNative : null
  const state = {
    manifest: null,
    installed: new Set(),
    tasks: {},
    logs: [],
    filter: 'release',
    vFilter: 'all',
    query: '',
    vQuery: '',
    logFilter: 'all',
    device: null,
    storage: null,
    activeTask: null,
    resourceType: 'mod',
    resources: [],
    resourceQuery: '',
    resourcesLoaded: false,
    java: null,
    loader: 'vanilla',
    instances: [],
  }

  const $ = (id) => document.getElementById(id)
  const el = (tag, className, html) => {
    const node = document.createElement(tag)
    if (className) node.className = className
    if (html != null) node.innerHTML = html
    return node
  }

  function parse(value, fallback) {
    try { return JSON.parse(value) } catch (error) { return fallback }
  }

  function formatDate(value) {
    if (!value) return '未知日期'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value.slice(0, 10)
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
  }

  function formatBytes(bytes) {
    if (!bytes) return '—'
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(0)} MB`
    return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`
  }

  function greet() {
    const hour = new Date().getHours()
    if (hour < 6) return '夜深了，方块还在等你'
    if (hour < 11) return '早上好，冒险家'
    if (hour < 14) return '中午好，冒险家'
    if (hour < 18) return '下午好，冒险家'
    return '晚上好，冒险家'
  }

  function toast(message) {
    const node = $('toast')
    node.textContent = message
    node.classList.add('is-show')
    clearTimeout(toast.timer)
    toast.timer = setTimeout(() => node.classList.remove('is-show'), 2600)
  }

  function showPage(tab) {
    document.querySelectorAll('.page').forEach((page) => page.classList.toggle('is-active', page.id === `page-${tab}`))
    document.querySelectorAll('.nav').forEach((button) => button.classList.toggle('is-active', button.dataset.tab === tab))
    $('screen').scrollTo({ top: 0, behavior: 'smooth' })
    if (tab === 'logs') renderLogs()
    if (tab === 'resources' && !state.resourcesLoaded) searchResources()
  }

  function updateStats() {
    const versions = state.manifest ? state.manifest.versions : []
    $('version-count').textContent = versions.length ? versions.length : '—'
    $('installed-count').textContent = state.installed.size
    $('device-chip').textContent = state.device ? `${state.device.brand} ${state.device.model}` : 'Android'
    $('latest-version').textContent = state.manifest?.latest?.release || '—'
    if (state.storage) {
      $('storage-free').textContent = formatBytes(state.storage.free)
    }
  }

  function versionRow(version, latestRelease) {
    const installed = state.installed.has(version.id)
    const task = state.activeTask && state.activeTask.id.startsWith('install-') && state.activeTask.id.includes(`-${version.id}-`)
      ? state.activeTask : null
    const row = el('button', `version-row${installed ? ' is-installed' : ''}`)
    row.type = 'button'
    row.dataset.id = version.id

    const tile = el('span', 'v-tile', `<small>${version.type === 'snapshot' ? 'SNAP' : 'MC'}</small><b>${version.id}</b>`)
    const copy = el('span', 'v-copy')
    const name = el('span', 'v-name', `${version.id}${version.id === latestRelease ? '<em>最新</em>' : version.type === 'snapshot' ? '<em class="snapshot">快照</em>' : ''}`)
    copy.appendChild(name)
    copy.appendChild(el('span', 'v-date', formatDate(version.releaseTime)))
    const action = el('span', `v-action${installed ? ' done' : task ? ' busy' : ''}`,
      installed ? '✓' : task ? `${Math.round(task.progress)}%` : '↓')
    if (installed) action.title = '已安装'
    row.appendChild(tile)
    row.appendChild(copy)
    row.appendChild(action)

    row.addEventListener('click', () => {
      const fabricInstalled = Array.from(state.installed).some((id) =>
        id.startsWith('fabric-loader-') && id.endsWith(`-${version.id}`))
      if (installed && (state.loader === 'vanilla' || fabricInstalled)) {
        toast(`${version.id}${fabricInstalled ? ' Fabric' : ''} 已安装`)
        return
      }
      if (task) {
        toast(`${version.id} 正在安装 ${Math.round(task.progress)}%`)
        return
      }
      startInstall(version.id)
    })
    return row
  }

  function filteredVersions(all) {
    const query = state.query.trim().toLowerCase()
    return all.filter((version) => {
      if (state.filter !== 'all' && version.type !== state.filter) return false
      return !query || version.id.toLowerCase().includes(query)
    })
  }

  function renderHomeVersions() {
    const host = $('version-list')
    host.innerHTML = ''
    if (!state.manifest) {
      host.innerHTML = '<div class="skeleton-row"></div><div class="skeleton-row"></div><div class="skeleton-row"></div>'
      return
    }
    const list = filteredVersions(state.manifest.versions).slice(0, 24)
    if (!list.length) {
      host.innerHTML = '<p class="list-note">没有匹配的版本</p>'
      $('list-note').textContent = ''
      return
    }
    const latest = state.manifest.latest?.release
    list.forEach((version) => host.appendChild(versionRow(version, latest)))
    $('list-note').textContent = `显示 ${list.length} 个版本 · 共 ${state.manifest.versions.length} 个`
  }

  function renderAllVersions() {
    const host = $('all-version-list')
    host.innerHTML = ''
    if (!state.manifest) {
      $('all-list-note').textContent = '正在加载版本清单…'
      return
    }
    const query = state.vQuery.trim().toLowerCase()
    let list = state.manifest.versions.filter((version) => {
      if (state.vFilter === 'installed' && !state.installed.has(version.id)) return false
      if (state.vFilter !== 'all' && state.vFilter !== 'installed' && version.type !== state.vFilter) return false
      return !query || version.id.toLowerCase().includes(query)
    })
    if (state.vFilter === 'all') list = list.slice(0, 120)
    list.forEach((version) => host.appendChild(versionRow(version, state.manifest.latest?.release)))
    $('all-list-note').textContent = list.length ? `共 ${list.length} 个版本` : '没有匹配的版本'
  }

  function startInstall(versionId) {
    const loaderName = state.loader === 'fabric' ? ' Fabric' : ''
    if (!native) {
      simulateInstall(versionId)
      return
    }
    toast(`开始安装 ${versionId}${loaderName}`)
    native.installVersionWithLoader(versionId, state.loader)
  }

  function updateTask(task) {
    state.tasks[task.id] = task
    if (task.status === 'running') {
      state.activeTask = task
      $('task-pill').hidden = false
      $('task-title').textContent = task.title || '下载'
      $('task-percent').textContent = `${Math.round(task.progress)}%`
      $('task-bar-fill').style.width = `${task.progress}%`
      $('task-sub').textContent = task.subtitle || ''
    } else {
      if (state.activeTask && state.activeTask.id === task.id) {
        if (task.status === 'done') {
          $('task-bar-fill').style.width = '100%'
          $('task-percent').textContent = '完成'
          $('task-sub').textContent = '基础文件安装完成'
          setTimeout(() => { if (state.activeTask?.id === task.id) $('task-pill').hidden = true }, 2200)
        } else {
          $('task-sub').textContent = task.subtitle || '安装失败'
          setTimeout(() => { if (state.activeTask?.id === task.id) $('task-pill').hidden = true }, 3500)
        }
      }
    }
    renderHomeVersions()
    renderAllVersions()
  }

  function renderLogs() {
    const host = $('terminal-body')
    const filtered = state.logs.filter((log) => state.logFilter === 'all' || log.level === state.logFilter)
    host.innerHTML = ''
    if (!filtered.length) {
      host.innerHTML = '<div class="empty-log">当前筛选下没有日志</div>'
    } else {
      filtered.slice(-180).forEach((log) => {
        const line = el('div', `log-line ${log.level}`)
        line.appendChild(el('span', 'log-time', log.time || '--:--:--'))
        line.appendChild(el('span', `log-level ${log.level}`, log.level))
        const msg = el('div', 'log-msg', `<span class="src">${log.source || 'CORE'}</span>${escapeHtml(log.message || '')}`)
        line.appendChild(msg)
        host.appendChild(line)
      })
    }
    $('log-count').textContent = state.logs.length
    $('log-warn').textContent = state.logs.filter((log) => log.level === 'WARN').length
    $('log-error').textContent = state.logs.filter((log) => log.level === 'ERROR').length
    host.scrollTop = host.scrollHeight
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]))
  }

  function addLog(log) {
    state.logs.push(log)
    if (state.logs.length > 300) state.logs.shift()
    if ($('page-logs').classList.contains('is-active')) renderLogs()
    else {
      $('log-count').textContent = state.logs.length
      $('log-warn').textContent = state.logs.filter((item) => item.level === 'WARN').length
      $('log-error').textContent = state.logs.filter((item) => item.level === 'ERROR').length
    }
  }

  function renderInstances() {
    const block = $('instances-block')
    const host = $('instance-list')
    block.hidden = state.instances.length === 0
    $('instance-count').textContent = `${state.instances.length} 个`
    host.innerHTML = ''
    state.instances.forEach((instance) => {
      const card = el('div', `instance-card${instance.active ? ' is-active' : ''}`)
      const top = el('div', 'instance-top')
      top.appendChild(el('span', `instance-badge ${instance.loader}`, instance.loader === 'fabric' ? 'FABRIC' : 'VANILLA'))
      if (instance.active) top.appendChild(el('span', 'instance-active', '当前'))
      card.appendChild(top)
      card.appendChild(el('b', '', escapeHtml(instance.id)))
      card.appendChild(el('small', '', `${escapeHtml(instance.base || instance.id)} · ${instance.loader === 'fabric' ? 'Fabric Loader' : '原版'}`))
      const actions = el('div', 'instance-actions')
      const activate = el('button', '', instance.active ? '已选' : '设为当前')
      activate.type = 'button'
      activate.addEventListener('click', () => {
        if (instance.active) return
        if (native) native.setActiveInstance(instance.id)
        else {
          state.instances = state.instances.map((item) => ({ ...item, active: item.id === instance.id }))
          renderInstances()
        }
      })
      const play = el('button', 'play', '启动')
      play.type = 'button'
      play.addEventListener('click', () => {
        if (native) native.prepareLaunch(instance.id)
        else toast('启动计划仅支持 Android 原生环境')
      })
      actions.appendChild(activate)
      actions.appendChild(play)
      card.appendChild(actions)
      host.appendChild(card)
    })
  }

  function refreshInstances() {
    if (!native) {
      state.instances = Array.from(state.installed).map((id) => ({ id, base: id, loader: id.startsWith('fabric-loader-') ? 'fabric' : 'vanilla', active: id === state.instances[0]?.id }))
      renderInstances()
      return
    }
    const list = parse(native.getInstances(), [])
    state.instances = Array.isArray(list) ? list : []
    if (state.instances.length && !state.instances.some((item) => item.active)) {
      state.instances[0].active = true
      native.setActiveInstance(state.instances[0].id)
    }
    renderInstances()
  }

  function renderJava() {
    const java = state.java
    if (!java) {
      $('java-status').textContent = '检查中…'
      return
    }
    $('java-status').textContent = java.installed ? '运行时已解压' : '尚未安装'
    $('java-path').textContent = java.installed ? java.path : '点击下方按钮解压内置 OpenJDK 21'
    $('java-state').textContent = java.installed ? 'READY' : 'MISSING'
    $('java-state').classList.toggle('ready', Boolean(java.installed))
    const button = $('install-java')
    button.disabled = Boolean(java.installed)
    button.textContent = java.installed ? 'Java 21 已安装' : '安装内置 Java 21'
  }

  function renderResources() {
    const host = $('resource-grid')
    host.innerHTML = ''
    if (!state.resources.length) {
      host.innerHTML = '<div class="resource-empty">没有找到资源<br>试试其他关键词，或切换 Mod / 光影</div>'
      $('resource-note').textContent = ''
      return
    }
    state.resources.forEach((resource) => {
      const card = el('div', 'resource-card')
      const top = el('div', 'resource-card-top')
      const icon = el('span', 'resource-icon')
      if (resource.icon) icon.innerHTML = `<img src="${escapeHtml(resource.icon)}" alt="" loading="lazy">`
      else icon.textContent = (resource.title || '?').slice(0, 1).toUpperCase()
      const copy = el('span', 'resource-copy', `<b>${escapeHtml(resource.title)}</b><small>${escapeHtml(resource.author || 'Modrinth')}</small>`)
      top.appendChild(icon)
      top.appendChild(copy)
      card.appendChild(top)
      card.appendChild(el('p', 'resource-desc', escapeHtml(resource.description || '')))
      const foot = el('div', 'resource-foot')
      const downloads = Number(resource.downloads || 0)
      foot.appendChild(el('span', '', downloads > 1000000 ? `${(downloads / 1000000).toFixed(1)}M` : downloads > 1000 ? `${(downloads / 1000).toFixed(0)}K` : String(downloads)))
      const install = el('button', 'resource-install', '↓')
      install.type = 'button'
      install.title = '安装'
      install.addEventListener('click', () => {
        if (!native) {
          toast(`${resource.title} 已加入浏览器预览队列`)
          return
        }
        const gameVersion = state.manifest?.latest?.release || '1.21.8'
        native.installResource(state.resourceType, resource.id, resource.title, gameVersion)
        toast(`开始下载 ${resource.title}`)
      })
      foot.appendChild(install)
      card.appendChild(foot)
      host.appendChild(card)
    })
    $('resource-note').textContent = `显示 ${state.resources.length} 个结果 · 数据来自 Modrinth`
  }

  function searchResources() {
    const query = $('resource-search').value.trim()
    state.resourceQuery = query
    state.resourcesLoaded = true
    $('resource-note').textContent = '正在搜索 Modrinth…'
    $('resource-grid').innerHTML = '<div class="resource-empty">正在连接 Modrinth API…</div>'
    if (native) native.searchResources(state.resourceType, query)
    else loadMockResources(query)
  }

  window.KCN = {
    onReady(json) {
      state.device = parse(json, null)
      updateStats()
    },
    onManifest(json) {
      state.manifest = parse(json, null)
      if (!state.manifest) return
      state.installed = new Set(state.manifest.installed || [])
      $('net-dot').classList.add('is-online')
      updateStats()
      renderHomeVersions()
      renderAllVersions()
    },
    onInstalled(json) {
      const values = parse(json, [])
      values.forEach((value) => state.installed.add(value))
      updateStats()
      renderHomeVersions()
      renderAllVersions()
      refreshInstances()
    },
    onJvmTest(json) {
      const result = parse(json, null)
      if (!result) return
      if (result.ok) toast('JVM 启动器测试通过，查看日志')
      else toast(`JVM 测试失败：${result.error || '未知错误'}`)
    },
    onLaunchPlan(json) {
      const plan = parse(json, null)
      if (!plan) return
      toast(`启动计划已生成：${plan.mainClass} · ${plan.classpathCount} 项`)
    },
    onInstances(json) {
      const list = parse(json, [])
      state.instances = Array.isArray(list) ? list : []
      renderInstances()
    },
    onJavaStatus(json) {
      state.java = parse(json, null)
      renderJava()
    },
    onResources(json) {
      const resources = parse(json, [])
      state.resources = Array.isArray(resources) ? resources : []
      renderResources()
    },
    onResourceInstalled(json) {
      const result = parse(json, null)
      if (result) toast(`${result.file || result.id} 已下载`)
    },
    onTask(json) {
      const task = parse(json, null)
      if (task) updateTask(task)
    },
    onLog(json) {
      const log = parse(json, null)
      if (log) addLog(log)
    },
    onError(message) {
      toast(String(message || '操作失败'))
      $('net-dot').classList.remove('is-online')
    },
  }

  function bind() {
    $('greeting').textContent = greet()
    document.querySelectorAll('.nav').forEach((button) => {
      button.addEventListener('click', () => showPage(button.dataset.tab))
    })
    document.querySelectorAll('[data-tab]').forEach((button) => {
      if (button.classList.contains('nav')) return
      button.addEventListener('click', () => showPage(button.dataset.tab))
    })
    document.querySelectorAll('[data-placeholder]').forEach((button) => {
      button.addEventListener('click', () => toast(`${button.dataset.placeholder}将在下一阶段接入`))
    })
    document.querySelectorAll('[data-filter]').forEach((button) => {
      button.addEventListener('click', () => {
        state.filter = button.dataset.filter
        document.querySelectorAll('[data-filter]').forEach((item) => item.classList.toggle('is-active', item === button))
        renderHomeVersions()
      })
    })
    document.querySelectorAll('[data-vfilter]').forEach((button) => {
      button.addEventListener('click', () => {
        state.vFilter = button.dataset.vfilter
        document.querySelectorAll('[data-vfilter]').forEach((item) => item.classList.toggle('is-active', item === button))
        renderAllVersions()
      })
    })
    document.querySelectorAll('[data-logfilter]').forEach((button) => {
      button.addEventListener('click', () => {
        state.logFilter = button.dataset.logfilter
        document.querySelectorAll('[data-logfilter]').forEach((item) => item.classList.toggle('is-active', item === button))
        renderLogs()
      })
    })
    $('version-search').addEventListener('input', (event) => { state.query = event.target.value; renderHomeVersions() })
    $('versions-search').addEventListener('input', (event) => { state.vQuery = event.target.value; renderAllVersions() })
    $('refresh-versions').addEventListener('click', () => {
      toast('正在刷新版本清单')
      if (native) native.repairManifest()
      else loadMock()
    })
    $('refresh-mini').addEventListener('click', () => {
      toast('正在刷新版本清单')
      if (native) native.repairManifest()
      else loadMock()
    })
    document.querySelectorAll('[data-loader]').forEach((button) => {
      button.addEventListener('click', () => {
        state.loader = button.dataset.loader
        document.querySelectorAll('[data-loader]').forEach((item) => item.classList.toggle('is-active', item === button))
        const hint = state.loader === 'fabric' ? 'Fabric Loader · 支持 Mod' : '纯净体验'
        if ($('loader-hint')) $('loader-hint').textContent = hint
        if ($('loader-hint-all')) $('loader-hint-all').textContent = hint
      })
    })
    document.querySelectorAll('[data-rtype]').forEach((button) => {
      button.addEventListener('click', () => {
        state.resourceType = button.dataset.rtype
        document.querySelectorAll('[data-rtype]').forEach((item) => item.classList.toggle('is-active', item === button))
        state.resources = []
        searchResources()
      })
    })
    $('resource-go').addEventListener('click', searchResources)
    $('resource-search').addEventListener('keydown', (event) => { if (event.key === 'Enter') searchResources() })
    $('test-jvm').addEventListener('click', () => {
      if (native) {
        toast('正在测试 JVM 启动器，查看日志')
        native.testJvm()
      } else {
        toast('JVM 测试仅支持 Android 原生环境')
      }
    })
    $('install-java').addEventListener('click', () => {
      if (native) native.installJava('21')
      else {
        toast('正在解压内置 Java 21')
        setTimeout(() => {
          window.KCN.onJavaStatus(JSON.stringify({ installed: true, version: '21', path: '/data/user/0/com.kcn.launcher/files/runtime/jre21' }))
        }, 1100)
      }
    })
    $('task-hide').addEventListener('click', () => { $('task-pill').hidden = true })
    $('clear-logs').addEventListener('click', () => {
      state.logs = []
      if (native) native.clearLogs()
      renderLogs()
      toast('日志已清空')
    })
  }

  function boot() {
    bind()
    if (native) {
      native.ping()
      native.loadVersions()
      const storage = parse(native.getStorage(), null)
      if (storage) state.storage = storage
      const logs = parse(native.getLogs(), [])
      if (Array.isArray(logs)) state.logs = logs
      state.java = parse(native.getJavaStatus(), null)
      renderJava()
      refreshInstances()
      updateStats()
      renderLogs()
    } else {
      loadMock()
      renderLogs()
    }
    setInterval(() => { $('greeting').textContent = greet() }, 60000)
  }

  // Browser preview fallback. The Android build always uses KCNNative.
  const MOCK = {
    latest: { release: '1.21.8', snapshot: '25w45a' },
    installed: ['1.21.4'],
    versions: [
      ['1.21.8', 'release', '2025-07-17T00:00:00+00:00'],
      ['1.21.4', 'release', '2024-12-03T00:00:00+00:00'],
      ['1.21.1', 'release', '2024-08-08T00:00:00+00:00'],
      ['1.20.6', 'release', '2024-04-29T00:00:00+00:00'],
      ['1.20.1', 'release', '2023-06-12T00:00:00+00:00'],
      ['1.19.2', 'release', '2022-08-05T00:00:00+00:00'],
      ['1.18.2', 'release', '2022-02-28T00:00:00+00:00'],
      ['1.21.9-pre2', 'snapshot', '2025-09-09T00:00:00+00:00'],
    ].map(([id, type, releaseTime]) => ({ id, type, releaseTime })),
  }

  function loadMock() {
    setTimeout(() => {
      window.KCN.onManifest(JSON.stringify(MOCK))
      state.storage = { free: 63.4 * 1024 * 1024 * 1024 }
      state.device = { brand: 'KCN', model: 'Browser Preview' }
      state.java = { installed: false, version: '21', path: '内置 OpenJDK 21' }
      renderJava()
      updateStats()
    }, 350)
    if (!state.logs.length) {
      const now = new Date()
      ;[
        ['INFO', 'CORE', 'KCN Core 0.1 浏览器预览'],
        ['INFO', 'CORE', '数据目录 /KCN/minecraft'],
        ['INFO', 'NETWORK', '版本清单同步完成，共 8 个版本'],
        ['WARN', 'JAVA', '启动层将在下一阶段接入 OpenJDK / LWJGL'],
      ].forEach(([level, source, message], index) => {
        const time = new Date(now.getTime() - (4 - index) * 1000).toTimeString().slice(0, 8)
        state.logs.push({ time, level, source, message })
      })
    }
  }

  const MOCK_RESOURCES = {
    mod: [
      { id: 'sodium', title: 'Sodium', author: 'CaffeineMC', description: '极限帧率优化，重写 Minecraft 渲染管线。', downloads: 258000000 },
      { id: 'iris', title: 'Iris Shaders', author: 'Iris Team', description: '高性能光影加载器，兼容 OptiFine 光影包。', downloads: 120000000 },
      { id: 'fabric-api', title: 'Fabric API', author: 'FabricMC', description: 'Fabric Mod 的必备基础依赖库。', downloads: 390000000 },
      { id: 'jei', title: 'Just Enough Items', author: 'mezz', description: '查询物品配方与用途的实用模组。', downloads: 280000000 },
    ],
    shader: [
      { id: 'complementary', title: 'Complementary Reimagined', author: 'EminGT', description: '柔光与体积云的平衡，适合移动端。', downloads: 1800000 },
      { id: 'bsl', title: 'BSL Shaders', author: 'CaptTatsu', description: '经典电影感光影，色彩浓郁。', downloads: 2600000 },
      { id: 'makeup', title: 'MakeUp Ultra Fast', author: 'XT_Xi', description: '为低配设备准备的轻量光影。', downloads: 940000 },
    ],
  }

  function loadMockResources(query) {
    setTimeout(() => {
      const list = MOCK_RESOURCES[state.resourceType].filter((item) =>
        !query || `${item.title} ${item.description}`.toLowerCase().includes(query.toLowerCase()))
      state.resources = list
      renderResources()
    }, 300)
  }

  function simulateInstall(versionId) {
    const id = `mock-${versionId}`
    let progress = 0
    toast(`开始安装 ${versionId}`)
    const timer = setInterval(() => {
      progress = Math.min(100, progress + 12)
      const task = {
        id: `${id}-${versionId}`,
        title: `Minecraft ${versionId}`,
        subtitle: progress < 50 ? '下载 client.jar' : progress < 90 ? '下载运行库' : '写入版本配置',
        progress,
        status: progress >= 100 ? 'done' : 'running',
      }
      updateTask(task)
      if (progress >= 100) {
        clearInterval(timer)
        state.installed.add(versionId)
        window.KCN.onInstalled(JSON.stringify([versionId]))
        addLog({ time: new Date().toTimeString().slice(0, 8), level: 'INFO', source: 'INSTALL', message: `${versionId} 基础文件安装完成` })
      }
    }, 260)
  }

  boot()
})()
