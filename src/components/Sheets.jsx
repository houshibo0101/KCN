import { useEffect, useState } from 'react'
import {
  X,
  Check,
  Download,
  LoaderCircle,
  Coffee,
  ShieldCheck,
  ChevronRight,
  Boxes,
  Layers3,
  Sparkles,
  HardDrive,
  Cpu,
  CalendarDays,
  Info,
  AlertTriangle,
  Trash2,
  ArrowDownToLine,
  CircleCheck,
  XCircle,
  FileText,
  ExternalLink,
  Play,
  Clock3,
  CircleAlert,
} from 'lucide-react'
import { ModIcon, ShaderScene, VersionArt } from './Art'
import {
  JAVA_DISTROS,
  JAVA_VERSIONS,
  LOADERS,
  SOURCE_NAMES,
} from '../data'

export function Sheet({ children, onClose, className = '' }) {
  useEffect(() => {
    function onKey(event) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="sheet-layer"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className={`sheet-panel ${className}`} role="dialog" aria-modal="true">
        <span className="sheet-grab" />
        {children}
      </div>
    </div>
  )
}

function SheetClose({ onClose }) {
  return (
    <button className="sheet-close" onClick={onClose} aria-label="关闭">
      <X size={17} />
    </button>
  )
}

export function VersionSheet({
  version,
  tasks,
  activeVersion,
  activeLoader,
  onClose,
  onInstall,
  onLaunch,
}) {
  const [loader, setLoader] = useState(
    activeVersion === version.id ? activeLoader : version.type === 'snapshot' ? '原版' : 'Fabric',
  )
  const task = tasks.find(
    (item) =>
      item.kind === 'game' &&
      item.meta?.version === version.id &&
      item.status === 'running',
  )
  const installed = version.installed

  return (
    <Sheet onClose={onClose} className="version-sheet">
      <SheetClose onClose={onClose} />
      <div className="sheet-version-head" style={{ '--sheet-accent': version.accent }}>
        <VersionArt version={version.id} accent={version.accent} />
        <div className="sheet-version-copy">
          <span className="sheet-kicker">
            {version.type === 'snapshot' ? 'SNAPSHOT' : 'RELEASE'} · MINECRAFT
          </span>
          <h2>{version.id}</h2>
          <p>{version.title}</p>
        </div>
      </div>

      <div className="sheet-body">
        <div className="sheet-meta-row">
          <span>
            <CalendarDays size={12} /> {version.date}
          </span>
          <span>
            <HardDrive size={12} /> {version.size}
          </span>
          <span>
            <Cpu size={12} /> {version.java}
          </span>
        </div>

        <p className="sheet-description">{version.summary}</p>

        <div className="sheet-subhead">
          <span>更新内容</span>
          <em>{version.type === 'snapshot' ? '实验性' : '正式版'}</em>
        </div>
        <ul className="changelog-list">
          {version.changelog.map((item) => (
            <li key={item}>
              <span>
                <Check size={9} strokeWidth={3} />
              </span>
              {item}
            </li>
          ))}
        </ul>

        <div className="sheet-subhead">
          <span>模组加载器</span>
          <em>{loader === '原版' ? '纯净体验' : '推荐'}</em>
        </div>
        <div className="loader-grid">
          {LOADERS.map((item) => (
            <button
              key={item}
              className={loader === item ? 'is-active' : ''}
              onClick={() => setLoader(item)}
            >
              {item}
              {loader === item && <Check size={11} />}
            </button>
          ))}
        </div>

        <div className="install-info-grid">
          <div>
            <span>安装位置</span>
            <strong>/KCN/versions/{version.id}</strong>
          </div>
          <div>
            <span>完整性校验</span>
            <strong>SHA-1 · 自动重试</strong>
          </div>
        </div>

        {task && (
          <div className="sheet-task">
            <span className="sheet-task-top">
              <span>
                <LoaderCircle size={14} className="spin" />
                {task.title}
              </span>
              <strong>{Math.round(task.progress)}%</strong>
            </span>
            <span className="sheet-task-bar">
              <span style={{ width: `${task.progress}%` }} />
            </span>
            <span className="sheet-task-sub">{task.subtitle}</span>
          </div>
        )}

        <div className="sheet-cta">
          {installed ? (
            <>
              <button className="primary-button" onClick={() => onLaunch(version.id)}>
                <Play size={17} fill="currentColor" strokeWidth={0} />
                启动此版本
              </button>
              <button
                className="ghost-button"
                onClick={() => onInstall(version, loader)}
                disabled={Boolean(task)}
              >
                <Download size={16} />
                重新安装
              </button>
            </>
          ) : (
            <button
              className="primary-button"
              onClick={() => onInstall(version, loader)}
              disabled={Boolean(task)}
            >
              {task ? (
                <>
                  <LoaderCircle size={17} className="spin" />
                  正在下载
                </>
              ) : (
                <>
                  <Download size={17} />
                  下载并安装
                </>
              )}
            </button>
          )}
        </div>
        <p className="sheet-footnote">
          {activeVersion === version.id && installed
            ? '这是当前实例使用的版本。'
            : '安装完成后可随时切换为该版本的独立实例。'}
        </p>
      </div>
    </Sheet>
  )
}

export function ResourceSheet({
  type,
  resource,
  installed,
  task,
  installedMods,
  onClose,
  onInstall,
}) {
  const isShader = type === 'shader'
  const hasIris = installedMods.includes('iris')

  return (
    <Sheet onClose={onClose} className="resource-sheet">
      <SheetClose onClose={onClose} />
      <div
        className={`resource-hero ${isShader ? 'is-shader' : ''}`}
        style={
          !isShader
            ? {
                '--hero-accent': resource.accent,
                '--hero-accent-2': resource.accent2,
              }
            : undefined
        }
      >
        {isShader ? (
          <ShaderScene variant={resource.visual} />
        ) : (
          <>
            <span className="resource-hero-grid" />
            <span className="resource-hero-orb" />
          </>
        )}
        <span className="resource-hero-shade" />
        <div className="resource-hero-copy">
          {!isShader && (
            <ModIcon
              icon={resource.icon}
              accent={resource.accent}
              accent2={resource.accent2}
              size={58}
            />
          )}
          <span className="sheet-kicker">
            {isShader ? 'SHADER PACK' : `MOD · ${resource.category}`}
          </span>
          <h2>{resource.name}</h2>
          <p>{resource.subtitle}</p>
        </div>
        {isShader && <span className="resource-hero-tag">{resource.tag}</span>}
      </div>

      <div className="sheet-body">
        <div className="resource-stats">
          <div>
            <span>作者</span>
            <strong>{resource.author}</strong>
          </div>
          <div>
            <span>下载量</span>
            <strong>{resource.downloads}</strong>
          </div>
          <div>
            <span>大小</span>
            <strong>{resource.size}</strong>
          </div>
        </div>

        <p className="sheet-description">{resource.desc}</p>

        <div className="resource-tag-list">
          {(resource.tags || [resource.tag, 'Iris', '移动端']).map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>

        <div className="install-info-grid">
          <div>
            <span>兼容版本</span>
            <strong>{isShader ? 'Iris 1.7+' : resource.version}</strong>
          </div>
          <div>
            <span>安装目标</span>
            <strong>Crafty 生存 · 1.21.4</strong>
          </div>
        </div>

        {!isShader && resource.id !== 'fabric-api' && (
          <div className={`dependency-note ${hasIris ? '' : ''}`}>
            <Layers3 size={14} />
            <span>
              依赖 <strong>Fabric API</strong>
              {installedMods.includes('fabric-api') ? ' · 已安装' : ' · 安装时自动补齐'}
            </span>
          </div>
        )}
        {isShader && (
          <div className="dependency-note">
            <Sparkles size={14} />
            <span>
              需要 <strong>Iris Shaders</strong>
              {hasIris ? ' · 已安装，可直接启用' : ' · 建议先安装光影加载器'}
            </span>
          </div>
        )}

        {task && (
          <div className="sheet-task">
            <span className="sheet-task-top">
              <span>
                <LoaderCircle size={14} className="spin" />
                {task.title}
              </span>
              <strong>{Math.round(task.progress)}%</strong>
            </span>
            <span className="sheet-task-bar">
              <span style={{ width: `${task.progress}%` }} />
            </span>
            <span className="sheet-task-sub">{task.subtitle}</span>
          </div>
        )}

        <div className="sheet-cta">
          {installed ? (
            <button className="primary-button is-installed" disabled>
              <CircleCheck size={17} />
              已安装到当前实例
            </button>
          ) : (
            <button
              className="primary-button"
              onClick={() => onInstall(type, resource)}
              disabled={Boolean(task)}
            >
              {task ? (
                <>
                  <LoaderCircle size={17} className="spin" />
                  正在下载
                </>
              ) : (
                <>
                  <Download size={17} />
                  {isShader ? '安装光影' : '安装 Mod'}
                </>
              )}
            </button>
          )}
        </div>
        <p className="sheet-footnote">
          下载完成后将自动放入当前实例的 {isShader ? 'shaderpacks' : 'mods'} 目录。
        </p>
      </div>
    </Sheet>
  )
}

export function JavaSheet({
  java,
  error,
  onClose,
  onDownload,
  onRemove,
  notify,
}) {
  const [javaVersion, setJavaVersion] = useState('21')
  const [distro, setDistro] = useState('temurin')
  const [confirming, setConfirming] = useState(false)

  const selected = JAVA_VERSIONS.find((item) => item.id === javaVersion)
  const selectedDistro = JAVA_DISTROS.find((item) => item.id === distro)

  return (
    <Sheet onClose={onClose} className="java-sheet">
      <SheetClose onClose={onClose} />
      <div className="sheet-simple-head">
        <span className="sheet-head-icon java">
          <Coffee size={22} />
        </span>
        <div>
          <span className="sheet-kicker">AUTO RUNTIME</span>
          <h2>Java 自动下载</h2>
          <p>选择适合当前设备的运行时，KCN 会完成余下步骤。</p>
        </div>
      </div>

      <div className="sheet-body">
        {error && (
          <div className="sheet-alert error">
            <CircleAlert size={16} />
            <div>
              <strong>未找到可用的 Java 运行时</strong>
              <p>当前实例无法启动。下载一个运行时后即可继续。</p>
            </div>
          </div>
        )}

        <div className="runtime-status-card">
          <span className={`runtime-status-icon ${java.installed ? '' : 'warn'}`}>
            {java.installed ? <ShieldCheck size={20} /> : <AlertTriangle size={20} />}
          </span>
          <div>
            <strong>
              {java.installed ? `Java ${java.version} 已就绪` : '当前没有可用运行时'}
            </strong>
            <p>
              {java.installed
                ? `${java.distro} · ${java.arch} · 已通过完整性校验`
                : '自动下载将匹配 aarch64 架构'}
            </p>
          </div>
          <span className={`runtime-badge ${java.installed ? '' : 'warn'}`}>
            {java.installed ? 'READY' : 'MISSING'}
          </span>
        </div>

        <div className="sheet-subhead">
          <span>运行时版本</span>
          <em>推荐 Java 21</em>
        </div>
        <div className="java-option-list">
          {JAVA_VERSIONS.map((item) => (
            <button
              key={item.id}
              className={`java-option ${javaVersion === item.id ? 'is-active' : ''}`}
              onClick={() => setJavaVersion(item.id)}
            >
              <span className="radio-dot">{javaVersion === item.id && <i />}</span>
              <span className="java-option-copy">
                <span>
                  <strong>{item.name}</strong>
                  {item.lts && <em>LTS</em>}
                </span>
                <small>{item.note}</small>
              </span>
              <span className="java-option-size">{item.size}</span>
            </button>
          ))}
        </div>

        <div className="sheet-subhead">
          <span>发行版</span>
          <em>已签名构建</em>
        </div>
        <div className="distro-grid">
          {JAVA_DISTROS.map((item) => (
            <button
              key={item.id}
              className={distro === item.id ? 'is-active' : ''}
              onClick={() => setDistro(item.id)}
            >
              <strong>{item.name}</strong>
              <small>{item.note}</small>
              {distro === item.id && <Check size={12} />}
            </button>
          ))}
        </div>

        <div className="auto-config-list">
          <span>
            <Check size={11} /> 自动识别 aarch64 架构
          </span>
          <span>
            <Check size={11} /> SHA-256 完整性校验
          </span>
          <span>
            <Check size={11} /> 解压并写入实例配置
          </span>
        </div>

        <button
          className="primary-button java-download-button"
          onClick={() =>
            onDownload({
              version: selected,
              distro: selectedDistro,
            })
          }
        >
          <ArrowDownToLine size={17} />
          自动下载 {selected.name}
          <span>{selected.size}</span>
        </button>

        {java.installed && (
          <button
            className={`danger-link ${confirming ? 'confirming' : ''}`}
            onClick={() => {
              if (!confirming) {
                setConfirming(true)
                return
              }
              onRemove()
            }}
            onBlur={() => setConfirming(false)}
          >
            <Trash2 size={12} />
            {confirming ? '再次点击确认移除运行时' : '移除当前运行时'}
          </button>
        )}

        <p className="sheet-footnote">
          下载源 {selectedDistro?.name} · 约 {selected?.size}。如网络受限，KCN 会自动回退到镜像节点。
        </p>
      </div>
    </Sheet>
  )
}

const KIND_META = {
  game: { icon: Boxes, tone: 'violet' },
  mod: { icon: Layers3, tone: 'amber' },
  shader: { icon: Sparkles, tone: 'cyan' },
  java: { icon: Coffee, tone: 'coral' },
}

export function DownloadsSheet({
  tasks,
  onClose,
  onCancel,
  onClearDone,
  onOpenLogs,
}) {
  const sorted = [...tasks].sort((a, b) => {
    const rank = { running: 0, done: 1, cancelled: 2 }
    return (rank[a.status] ?? 3) - (rank[b.status] ?? 3)
  })
  const doneCount = tasks.filter((task) => task.status === 'done').length

  return (
    <Sheet onClose={onClose} className="downloads-sheet">
      <SheetClose onClose={onClose} />
      <div className="sheet-simple-head">
        <span className="sheet-head-icon download">
          <Download size={21} />
        </span>
        <div>
          <span className="sheet-kicker">QUEUE</span>
          <h2>下载任务</h2>
          <p>
            {tasks.filter((task) => task.status === 'running').length} 个进行中 ·{' '}
            {doneCount} 个已完成
          </p>
        </div>
      </div>

      <div className="sheet-body">
        {sorted.length === 0 ? (
          <div className="download-empty">
            <span>
              <Download size={24} />
            </span>
            <strong>队列是空的</strong>
            <p>去版本库或资源工坊挑选点什么吧。</p>
            <button className="ghost-button small" onClick={onClose}>
              继续逛逛
            </button>
          </div>
        ) : (
          <div className="task-list">
            {sorted.map((task) => {
              const meta = KIND_META[task.kind] || KIND_META.mod
              const Icon = meta.icon
              return (
                <div className={`task-item is-${task.status}`} key={task.id}>
                  <span className={`task-icon ${meta.tone}`}>
                    <Icon size={18} />
                  </span>
                  <div className="task-copy">
                    <div className="task-title-row">
                      <strong>{task.title}</strong>
                      {task.status === 'running' ? (
                        <span>{Math.round(task.progress)}%</span>
                      ) : task.status === 'done' ? (
                        <span className="task-done">
                          <Check size={11} />
                        </span>
                      ) : (
                        <span className="task-cancelled">
                          <X size={11} />
                        </span>
                      )}
                    </div>
                    <span className="task-sub">{task.subtitle}</span>
                    <div className={`task-progress is-${task.status}`}>
                      <span
                        style={{
                          width:
                            task.status === 'done'
                              ? '100%'
                              : task.status === 'cancelled'
                                ? '0%'
                                : `${task.progress}%`,
                        }}
                      />
                    </div>
                    <div className="task-meta">
                      <span>{task.sizeLabel}</span>
                      {task.status === 'running' && (
                        <>
                          <i />
                          <span>{task.speed.toFixed(1)} MB/s</span>
                          <i />
                          <span>{task.eta}</span>
                        </>
                      )}
                      {task.status === 'done' && <span>已完成 · 已校验</span>}
                      {task.status === 'cancelled' && <span>已取消</span>}
                    </div>
                  </div>
                  {task.status === 'running' ? (
                    <button
                      className="task-cancel"
                      onClick={() => onCancel(task.id)}
                      aria-label="取消任务"
                    >
                      <X size={14} />
                    </button>
                  ) : (
                    <span className="task-state-icon">
                      {task.status === 'done' ? (
                        <CircleCheck size={18} />
                      ) : (
                        <XCircle size={18} />
                      )}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <div className="download-sheet-actions">
          {doneCount > 0 && (
            <button className="ghost-button small" onClick={onClearDone}>
              <Trash2 size={13} />
              清除已完成
            </button>
          )}
          <button className="ghost-button small" onClick={onOpenLogs}>
            <FileText size={13} />
            查看日志
          </button>
        </div>
        <p className="sheet-footnote">
          下载中断后会自动重试 3 次，并记录到运行日志。
        </p>
      </div>
    </Sheet>
  )
}
