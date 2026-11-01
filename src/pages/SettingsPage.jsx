import { useState } from 'react'
import {
  UserRound,
  ShieldCheck,
  Coffee,
  MemoryStick,
  Globe2,
  HardDrive,
  RefreshCw,
  ChevronRight,
  Check,
  Info,
  Smartphone,
  Trash2,
  Sparkles,
  Bell,
  CloudDownload,
} from 'lucide-react'
import { Avatar, KcnCube } from '../components/Art'

function Toggle({ checked, onChange, label }) {
  return (
    <button
      className={`switch ${checked ? 'is-on' : ''}`}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
    >
      <span />
    </button>
  )
}

export function SettingsPage({
  account,
  onAccountChange,
  java,
  memory,
  onMemoryChange,
  downloadSource,
  onDownloadSourceChange,
  versions,
  installedMods,
  installedShaders,
  tasks,
  onOpenJava,
  onOpenDownloads,
  onInstallApp,
  notify,
}) {
  const [autoRepair, setAutoRepair] = useState(true)
  const [launchSound, setLaunchSound] = useState(false)
  const [backgroundDownloads, setBackgroundDownloads] = useState(true)
  const installedVersions = versions.filter((version) => version.installed).length
  const running = tasks.filter((task) => task.status === 'running').length

  return (
    <div className="settings-page">
      <section className="page-heading">
        <div>
          <p className="kicker">PREFERENCES</p>
          <h1>设置</h1>
          <p className="page-sub">账户、运行时与设备偏好</p>
        </div>
        <span className="settings-version">v1.0.0</span>
      </section>

      <section className="profile-panel">
        <Avatar name={account || 'Alex'} size={58} />
        <div className="profile-copy">
          <span className="profile-label">离线账户</span>
          <label className="profile-name-field">
            <UserRound size={14} />
            <input
              value={account}
              maxLength={16}
              onChange={(event) => onAccountChange(event.target.value)}
              aria-label="游戏用户名"
            />
          </label>
          <span className="profile-hint">
            <ShieldCheck size={11} />
            仅保存在本机 · 无需登录
          </span>
        </div>
        <button className="profile-edit" onClick={() => notify('用户名会保存到本地', 'info')}>
          编辑
        </button>
      </section>

      <div className="settings-section-title">
        <span>运行时</span>
        <em>RUNTIME</em>
      </div>

      <section className="settings-card java-card">
        <div className="settings-row">
          <span className={`settings-icon java ${java.installed ? '' : 'warn'}`}>
            <Coffee size={19} />
          </span>
          <div className="settings-row-copy">
            <strong>Java 运行时</strong>
            <p>
              {java.installed
                ? `OpenJDK ${java.version} · ${java.distro} · ${java.arch}`
                : '未检测到可用的 Java 运行时'}
            </p>
          </div>
          <button className="row-action" onClick={onOpenJava}>
            管理 <ChevronRight size={13} />
          </button>
        </div>
        <div className="java-detail">
          <span className="runtime-dot" />
          <code>{java.installed ? java.path : '尚未配置运行时'}</code>
          <span className={`runtime-state ${java.installed ? '' : 'warn'}`}>
            {java.installed ? '已就绪' : '需要配置'}
          </span>
        </div>
        <div className="settings-inline-note">
          <Sparkles size={13} />
          KCN 会根据设备架构自动选择 Java 版本，并完成校验与解压。
        </div>
      </section>

      <div className="settings-section-title">
        <span>游戏</span>
        <em>GAMEPLAY</em>
      </div>

      <section className="settings-card">
        <div className="settings-row">
          <span className="settings-icon memory">
            <MemoryStick size={19} />
          </span>
          <div className="settings-row-copy">
            <strong>内存分配</strong>
            <p>为游戏进程预留的运行内存</p>
          </div>
          <span className="memory-value">{memory} GB</span>
        </div>
        <div className="range-wrap">
          <input
            type="range"
            min="1"
            max="8"
            step="0.5"
            value={memory}
            onChange={(event) => onMemoryChange(Number(event.target.value))}
            style={{ '--range-progress': `${((memory - 1) / 7) * 100}%` }}
            aria-label="内存分配"
          />
          <div className="range-labels">
            <span>1 GB</span>
            <span>推荐 4 GB</span>
            <span>8 GB</span>
          </div>
        </div>
      </section>

      <section className="settings-card">
        <div className="settings-row no-border">
          <span className="settings-icon source">
            <Globe2 size={19} />
          </span>
          <div className="settings-row-copy">
            <strong>下载源</strong>
            <p>镜像可提升国内网络下载速度</p>
          </div>
        </div>
        <div className="source-segment">
          {['自动', '官方', 'BMCLAPI'].map((source) => (
            <button
              key={source}
              className={downloadSource === source ? 'is-active' : ''}
              onClick={() => onDownloadSourceChange(source)}
            >
              {downloadSource === source && <Check size={11} />}
              {source}
            </button>
          ))}
        </div>
        <div className="settings-inline-note">
          <CloudDownload size={13} />
          当前节点：{downloadSource === '自动' ? '智能选择 · BMCLAPI' : downloadSource}
        </div>
      </section>

      <div className="settings-section-title">
        <span>存储与行为</span>
        <em>DEVICE</em>
      </div>

      <section className="settings-card storage-card">
        <div className="settings-row no-border">
          <span className="settings-icon storage">
            <HardDrive size={19} />
          </span>
          <div className="settings-row-copy">
            <strong>本地存储</strong>
            <p>
              {installedVersions} 个版本 · {installedMods} 个 Mod · {installedShaders} 个光影
            </p>
          </div>
          <span className="storage-amount">4.8 / 64 GB</span>
        </div>
        <div className="storage-bar">
          <span style={{ width: '37%' }} />
          <i style={{ width: '9%' }} />
          <b style={{ width: '4%' }} />
        </div>
        <div className="storage-legend">
          <span>
            <i className="legend-game" /> 游戏
          </span>
          <span>
            <i className="legend-mod" /> 资源
          </span>
          <span>
            <i className="legend-java" /> Java
          </span>
        </div>
      </section>

      <section className="settings-card toggles-card">
        <div className="toggle-row">
          <div>
            <strong>自动修复资源</strong>
            <p>启动前补齐缺失的库文件</p>
          </div>
          <Toggle checked={autoRepair} onChange={setAutoRepair} label="自动修复资源" />
        </div>
        <div className="toggle-row">
          <div>
            <strong>启动音效</strong>
            <p>进入世界时播放轻提示音</p>
          </div>
          <Toggle checked={launchSound} onChange={setLaunchSound} label="启动音效" />
        </div>
        <div className="toggle-row">
          <div>
            <strong>后台下载</strong>
            <p>切到其他页面后继续任务</p>
          </div>
          <Toggle
            checked={backgroundDownloads}
            onChange={setBackgroundDownloads}
            label="后台下载"
          />
        </div>
      </section>

      <button className="queue-shortcut" onClick={onOpenDownloads}>
        <span>
          <CloudDownload size={18} />
        </span>
        <div>
          <strong>下载队列</strong>
          <p>{running > 0 ? `${running} 个任务正在进行` : '当前没有进行中的任务'}</p>
        </div>
        <ChevronRight size={15} />
      </button>

      <section className="about-card">
        <div className="about-head">
          <span className="about-logo">
            <KcnCube size={34} />
          </span>
          <div>
            <strong>KCN 启动器</strong>
            <p>Mobile Java Edition Launcher</p>
          </div>
          <span className="about-version">1.0.0</span>
        </div>
        <div className="about-grid">
          <div>
            <span>内核</span>
            <strong>KCN Core 1.0</strong>
          </div>
          <div>
            <span>渠道</span>
            <strong>移动端预览</strong>
          </div>
          <div>
            <span>架构</span>
            <strong>aarch64</strong>
          </div>
        </div>
        <p className="about-note">
          <Info size={12} />
          网页为交互预览；Android APK 为自研 0.1 核心版，真实下载，启动层接入中。
        </p>
        <div className="about-actions">
          <button onClick={onInstallApp}>
            <Smartphone size={13} />
            下载 APK
          </button>
          <button onClick={() => notify('当前已是最新版本 v1.0.0')}>
            <RefreshCw size={13} />
            检查更新
          </button>
          <button onClick={() => notify('演示数据不会被上传', 'info')}>
            <Trash2 size={13} />
            清除缓存
          </button>
        </div>
      </section>

      <p className="settings-footer">
        <Smartphone size={12} />
        KCN MOBILE · MADE FOR BLOCKS
      </p>
    </div>
  )
}
