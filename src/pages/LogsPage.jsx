import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Terminal,
  Trash2,
  Copy,
  Download,
  CircleAlert,
  CheckCircle2,
  Info,
  AlertTriangle,
  ArrowDownToLine,
  Bug,
  FileText,
  ChevronDown,
  ChevronUp,
  Radio,
  XCircle,
} from 'lucide-react'
import { SOURCE_NAMES } from '../data'

const FILTERS = [
  { id: 'all', label: '全部' },
  { id: 'info', label: '信息' },
  { id: 'warn', label: '警告' },
  { id: 'error', label: '错误' },
]

export function LogsPage({ logs, onClear, notify }) {
  const [filter, setFilter] = useState('all')
  const [autoScroll, setAutoScroll] = useState(true)
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false)
  const consoleRef = useRef(null)

  const counts = useMemo(() => {
    return {
      all: logs.length,
      info: logs.filter((log) => log.level === 'INFO').length,
      warn: logs.filter((log) => log.level === 'WARN').length,
      error: logs.filter((log) => log.level === 'ERROR').length,
    }
  }, [logs])

  const filtered = useMemo(() => {
    if (filter === 'all') return logs
    return logs.filter((log) => log.level === filter.toUpperCase())
  }, [logs, filter])

  const latestError = [...logs].reverse().find((log) => log.level === 'ERROR')

  useEffect(() => {
    if (!autoScroll || !consoleRef.current) return
    consoleRef.current.scrollTop = consoleRef.current.scrollHeight
  }, [filtered, autoScroll])

  async function copyLogs() {
    const content = filtered
      .map((log) => `${log.time} [${log.level}] [${SOURCE_NAMES[log.source] || log.source}] ${log.message}`)
      .join('\n')
    try {
      await navigator.clipboard.writeText(content)
      notify('日志已复制到剪贴板')
    } catch {
      notify('复制失败，请检查浏览器剪贴板权限', 'error')
    }
  }

  function exportLogs() {
    const content = [
      'KCN Launcher · runtime log',
      `exported: ${new Date().toISOString()}`,
      `device: KCN Mobile Preview 1.0.0`,
      '----------------------------------------',
      ...logs.map(
        (log) =>
          `${log.time} [${log.level}] [${SOURCE_NAMES[log.source] || log.source}] ${log.message}`,
      ),
    ].join('\n')
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `kcn-latest-${new Date().toISOString().slice(0, 10)}.log`
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
    notify('日志文件已导出')
  }

  function copyDiagnostics() {
    const content = [
      'KCN Diagnostic Report',
      `Time: ${new Date().toLocaleString('zh-CN')}`,
      'Device: KCN Mobile Preview · aarch64',
      'Java: OpenJDK 21.0.5+11 (Temurin)',
      'Renderer: GL4ES / Sodium',
      `Errors: ${counts.error}`,
      '----------------------------------------',
      ...logs.map(
        (log) =>
          `${log.time} [${log.level}] [${SOURCE_NAMES[log.source] || log.source}] ${log.message}`,
      ),
    ].join('\n')
    navigator.clipboard
      .writeText(content)
      .then(() => notify('诊断报告已生成并复制'))
      .catch(() => notify('诊断报告生成失败', 'error'))
  }

  return (
    <div className="logs-page">
      <section className="page-heading">
        <div>
          <p className="kicker">RUNTIME &amp; DIAGNOSTICS</p>
          <h1>运行日志</h1>
          <p className="page-sub">实时捕获启动、下载与资源加载事件</p>
        </div>
        <span className="live-badge">
          <i className="live-dot" />
          LIVE
        </span>
      </section>

      <div className="log-stats">
        <div>
          <span>记录</span>
          <strong>{counts.all}</strong>
        </div>
        <div>
          <span>警告</span>
          <strong className="warn">{counts.warn}</strong>
        </div>
        <div>
          <span>错误</span>
          <strong className={counts.error ? 'error' : ''}>{counts.error}</strong>
        </div>
        <div className="stat-live">
          <span>状态</span>
          <strong>
            <i />
            正常
          </strong>
        </div>
      </div>

      <div className="log-toolbar">
        <div className="log-filters">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              className={filter === item.id ? 'is-active' : ''}
              onClick={() => setFilter(item.id)}
            >
              {item.label}
              <span>{counts[item.id]}</span>
            </button>
          ))}
        </div>
        <div className="log-actions">
          <button onClick={copyLogs} aria-label="复制日志">
            <Copy size={14} />
          </button>
          <button onClick={exportLogs} aria-label="导出日志">
            <Download size={14} />
          </button>
          <button
            className="log-clear"
            onClick={() => {
              onClear()
              notify('日志已清空', 'info')
            }}
            aria-label="清空日志"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <section className="log-console">
        <header className="log-console-head">
          <span className="console-window-dots">
            <i />
            <i />
            <i />
          </span>
          <span className="log-path">
            <Terminal size={11} />
            /KCN/logs/latest.log
          </span>
          <button
            className={`autoscroll ${autoScroll ? 'is-on' : ''}`}
            onClick={() => setAutoScroll((value) => !value)}
            aria-pressed={autoScroll}
          >
            <ArrowDownToLine size={11} />
            {autoScroll ? '跟随' : '暂停'}
          </button>
        </header>

        <div className="log-console-body" ref={consoleRef}>
          {filtered.length === 0 ? (
            <div className="log-empty">
              <Terminal size={20} />
              <span>当前筛选条件下没有日志</span>
            </div>
          ) : (
            filtered.map((log) => (
              <div className={`log-line level-${log.level.toLowerCase()}`} key={log.id}>
                <span className="log-time">{log.time}</span>
                <span className={`log-level ${log.level.toLowerCase()}`}>
                  {log.level === 'INFO' && <Info size={9} />}
                  {log.level === 'WARN' && <AlertTriangle size={9} />}
                  {log.level === 'ERROR' && <XCircle size={9} />}
                  {log.level}
                </span>
                <p>
                  <span className="log-source">
                    {SOURCE_NAMES[log.source] || log.source}
                  </span>
                  {log.message}
                </p>
              </div>
            ))
          )}
        </div>
        <footer className="log-console-foot">
          <span>
            <i className="live-dot" />
            {filtered.length} 条记录
          </span>
          <span>UTF-8 · LF</span>
        </footer>
      </section>

      {latestError ? (
        <section className="error-card">
          <div className="error-card-head">
            <span className="error-icon">
              <CircleAlert size={17} />
            </span>
            <div>
              <strong>检测到最近一次异常</strong>
              <p>{latestError.message}</p>
            </div>
            <button
              className="error-expand"
              onClick={() => setDiagnosticsOpen((open) => !open)}
              aria-label="展开解决方案"
            >
              {diagnosticsOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>
          </div>
          {diagnosticsOpen && (
            <div className="error-solution">
              <div>
                <span>01</span>
                <p>KCN 已自动切换至 BMCLAPI 镜像，下载链路恢复正常。</p>
              </div>
              <div>
                <span>02</span>
                <p>如果再次出现超时，请在设置中将下载源固定为「BMCLAPI」。</p>
              </div>
              <button className="ghost-button small" onClick={copyDiagnostics}>
                <Bug size={13} />
                复制诊断报告
              </button>
            </div>
          )}
        </section>
      ) : (
        <section className="error-card is-clear">
          <span className="error-icon clear">
            <CheckCircle2 size={17} />
          </span>
          <div>
            <strong>没有未处理的异常</strong>
            <p>启动器和运行时工作正常。</p>
          </div>
        </section>
      )}

      <section className="diagnostic-card">
        <div className="diagnostic-icon">
          <FileText size={18} />
        </div>
        <div>
          <strong>需要帮助定位问题？</strong>
          <p>生成包含设备、Java 与最近日志的诊断报告。</p>
        </div>
        <button onClick={copyDiagnostics}>
          <Radio size={13} />
          生成
        </button>
      </section>

      <p className="logs-footnote">
        日志只保存在本机，最多保留 250 条。导出时不会包含账户凭据。
      </p>
    </div>
  )
}
