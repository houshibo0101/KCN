import {
  Home,
  Boxes,
  Layers3,
  ScrollText,
  Settings2,
  CloudDownload,
  LoaderCircle,
  Signal,
  Wifi,
  BatteryFull,
  Sparkles,
  Coffee,
  Gamepad2,
  ChevronRight,
  Check,
  X,
  Terminal,
  ArrowRight,
  ShieldCheck,
  Download,
} from 'lucide-react'
import { Avatar, KcnCube } from './Art'
import { GAME_STEPS } from '../data'

const NAV_ITEMS = [
  { id: 'home', label: '首页', icon: Home },
  { id: 'versions', label: '版本', icon: Boxes },
  { id: 'resources', label: '资源', icon: Layers3 },
  { id: 'logs', label: '日志', icon: ScrollText },
  { id: 'settings', label: '设置', icon: Settings2 },
]

export function StatusBar({ time }) {
  return (
    <div className="statusbar" aria-hidden="true">
      <span className="statusbar-time">{time}</span>
      <div className="statusbar-icons">
        <Signal size={12} strokeWidth={2.4} />
        <Wifi size={13} strokeWidth={2.4} />
        <BatteryFull size={15} strokeWidth={2.2} />
      </div>
    </div>
  )
}

export function TopBar({ account, activeCount, onDownloads, onSettings }) {
  return (
    <header className="topbar">
      <div className="brand">
        <KcnCube size={30} />
        <div className="brand-copy">
          <strong>KCN</strong>
          <span>LAUNCHER</span>
        </div>
      </div>
      <div className="top-actions">
        <button
          className="icon-button download-button"
          onClick={onDownloads}
          aria-label="下载任务"
        >
          <CloudDownload size={19} />
          {activeCount > 0 && <i className="count-badge">{activeCount}</i>}
        </button>
        <button
          className="avatar-button"
          onClick={onSettings}
          aria-label="打开账户设置"
        >
          <Avatar name={account} size={34} />
        </button>
      </div>
    </header>
  )
}

export function BottomNav({ tab, onChange }) {
  return (
    <nav className="bottom-nav" aria-label="主导航">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon
        const active = tab === item.id
        return (
          <button
            key={item.id}
            className={`nav-item ${active ? 'is-active' : ''}`}
            onClick={() => onChange(item.id)}
            aria-current={active ? 'page' : undefined}
          >
            <span className="nav-icon-wrap">
              <Icon size={20} strokeWidth={active ? 2.4 : 1.9} />
            </span>
            <span>{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

export function DownloadPill({ task, count, onClick }) {
  if (!task) return null
  return (
    <button className="download-pill" onClick={onClick}>
      <span className="download-pill-icon">
        <LoaderCircle size={18} className="spin" />
      </span>
      <span className="download-pill-copy">
        <span className="download-pill-top">
          <strong>{task.title}</strong>
          <em>{count > 1 ? `${count} 个任务` : `${Math.round(task.progress)}%`}</em>
        </span>
        <span className="download-pill-bar">
          <span style={{ width: `${task.progress}%` }} />
        </span>
      </span>
      <ChevronRight size={16} className="download-pill-arrow" />
    </button>
  )
}

export function Toast({ toast }) {
  if (!toast) return null
  return (
    <div className={`toast toast-${toast.type}`} role="status">
      <span className="toast-icon">
        {toast.type === 'error' ? <X size={14} /> : <Check size={14} />}
      </span>
      <span>{toast.message}</span>
    </div>
  )
}

export function DesktopShowcase() {
  const features = [
    {
      icon: CloudDownload,
      title: '一键安装版本',
      text: '正式版与快照，自动补全依赖',
      tone: 'lime',
    },
    {
      icon: Layers3,
      title: 'Mod 与光影',
      text: '精选资源库，直接装进实例',
      tone: 'amber',
    },
    {
      icon: Coffee,
      title: 'Java 自动配置',
      text: '按设备架构匹配运行时',
      tone: 'coral',
    },
    {
      icon: Terminal,
      title: '实时错误日志',
      text: '问题定位、复制与一键导出',
      tone: 'cyan',
    },
  ]

  return (
    <aside className="showcase">
      <div className="showcase-brand">
        <KcnCube size={38} />
        <span>KCN</span>
        <i>MOBILE</i>
      </div>

      <div className="showcase-main">
        <div className="showcase-kicker">
          <Sparkles size={14} />
          为移动端重新设计的 Java 版体验
        </div>
        <h1>
          把方块世界
          <br />
          <span>装进口袋。</span>
        </h1>
        <p className="showcase-desc">
          版本安装、Mod、光影与 Java 运行时，都在一个轻盈的启动器里完成。
          保留 PC 的完整逻辑，只把复杂的部分藏起来。
        </p>

        <div className="showcase-features">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <div className="showcase-feature" key={feature.title}>
                <span className={`feature-icon tone-${feature.tone}`}>
                  <Icon size={17} />
                </span>
                <div>
                  <strong>{feature.title}</strong>
                  <small>{feature.text}</small>
                </div>
              </div>
            )
          })}
        </div>

        <div className="showcase-stats">
          <div>
            <strong>1.21.8</strong>
            <span>版本清单已同步</span>
          </div>
          <div>
            <strong>4</strong>
            <span>Mod 已启用</span>
          </div>
          <div>
            <strong>Java 21</strong>
            <span>运行时就绪</span>
          </div>
        </div>

        <a
          className="showcase-apk"
          href="/downloads/KCN-core-0.1.7.apk"
          download
        >
          <span>
            <Download size={16} />
          </span>
          <strong>下载 KCN Core 0.1.7</strong>
          <small>自研下载版 · 27 MB</small>
          <ArrowRight size={14} />
        </a>
      </div>

      <div className="showcase-foot">
        <span className="live-dot" />
        KCN CORE ONLINE
        <i />
        移动端预览版 v1.0.0
      </div>

      <div className="showcase-deco" aria-hidden="true">
        <span className="deco-cube cube-a" />
        <span className="deco-cube cube-b" />
        <span className="deco-cube cube-c" />
        <span className="deco-ring" />
        <span className="deco-type">JAVA EDITION</span>
        <span className="deco-pixel-grid" />
      </div>
    </aside>
  )
}

export function LaunchScreen({
  progress,
  done,
  account,
  version,
  loader,
  onCancel,
  onClose,
  onViewLogs,
}) {
  const stepIndex = done ? GAME_STEPS.length : Math.min(GAME_STEPS.length - 1, Math.floor(progress / 20))
  const consoleLines = [
    `[java] Using OpenJDK 21.0.5+11 (Temurin) · aarch64`,
    `[core] Validating 68 libraries for Minecraft ${version}`,
    `[mods] Loading mods with Fabric Loader 0.16.9`,
    `[shader] Compiling Complementary Reimagined`,
    `[launch] Creating process · Crafty 生存`,
  ]

  return (
    <div className={`launch-screen ${done ? 'is-done' : ''}`}>
      <div className="launch-bg" aria-hidden="true">
        <span className="launch-glow" />
        <span className="launch-grid" />
        <span className="float-block fb-1" />
        <span className="float-block fb-2" />
        <span className="float-block fb-3" />
      </div>

      <div className="launch-top">
        <span className="launch-brand">
          <KcnCube size={24} /> KCN RUNTIME
        </span>
        {!done && (
          <button className="launch-close" onClick={onCancel} aria-label="取消启动">
            <X size={18} />
          </button>
        )}
      </div>

      <div className="launch-content">
        {!done ? (
          <>
            <div className="launch-orbit">
              <span className="orbit-ring r1" />
              <span className="orbit-ring r2" />
              <span className="orbit-cube">
                <KcnCube size={76} />
              </span>
            </div>
            <p className="launch-eyebrow">LAUNCHING WORLD</p>
            <h2>正在唤醒方块世界</h2>
            <p className="launch-sub">
              {account} · {version} · {loader}
            </p>

            <div className="launch-progress">
              <div className="launch-progress-top">
                <span>准备运行环境</span>
                <strong>{Math.round(progress)}%</strong>
              </div>
              <div className="launch-progress-track">
                <span style={{ width: `${progress}%` }} />
              </div>
            </div>

            <div className="launch-steps">
              {GAME_STEPS.map((step, index) => {
                const state =
                  index < stepIndex ? 'done' : index === stepIndex ? 'active' : 'pending'
                return (
                  <div className={`launch-step is-${state}`} key={step}>
                    <span className="step-mark">
                      {state === 'done' ? (
                        <Check size={11} strokeWidth={3} />
                      ) : state === 'active' ? (
                        <LoaderCircle size={11} className="spin" />
                      ) : (
                        <i />
                      )}
                    </span>
                    <span>{step}</span>
                    {state === 'done' && <em>完成</em>}
                  </div>
                )
              })}
            </div>

            <div className="launch-console">
              <div className="launch-console-bar">
                <span className="console-dots">
                  <i />
                  <i />
                  <i />
                </span>
                <span>kcn-runtime.log</span>
              </div>
              <div className="launch-console-body">
                {consoleLines.slice(0, Math.max(1, stepIndex + 1)).map((line) => (
                  <p key={line}>{line}</p>
                ))}
                <p className="console-cursor">▍</p>
              </div>
            </div>
          </>
        ) : (
          <div className="launch-done">
            <div className="done-badge">
              <ShieldCheck size={38} />
            </div>
            <p className="launch-eyebrow">ALL SYSTEMS READY</p>
            <h2>世界已准备就绪</h2>
            <p className="launch-sub">
              {account}，你的冒险入口已经打开。所有资源校验通过，Java 运行时运行正常。
            </p>
            <div className="launch-summary">
              <div>
                <span>实例</span>
                <strong>Crafty 生存</strong>
              </div>
              <div>
                <span>版本</span>
                <strong>{version}</strong>
              </div>
              <div>
                <span>加载器</span>
                <strong>{loader}</strong>
              </div>
            </div>
            <div className="launch-done-actions">
              <button className="primary-button" onClick={onClose}>
                <Gamepad2 size={18} />
                返回启动器
              </button>
              <button className="ghost-button" onClick={onViewLogs}>
                <Terminal size={17} />
                查看运行日志
              </button>
            </div>
            <p className="launch-note">
              移动端预览：启动流程为交互演示，不会创建真实 Java 进程。
            </p>
          </div>
        )}
      </div>

      {!done && (
        <div className="launch-foot">
          <span className="live-dot" />
          安全校验已开启
          <i>移动端预览 · 启动流程为交互演示</i>
        </div>
      )}
    </div>
  )
}
