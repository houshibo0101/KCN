import { useMemo, useState } from 'react'
import {
  Search,
  Download,
  Check,
  ChevronRight,
  Sparkles,
  Boxes,
  LoaderCircle,
  CalendarDays,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import { VersionArt } from '../components/Art'

const FILTERS = [
  { id: 'all', label: '全部' },
  { id: 'release', label: '正式版' },
  { id: 'snapshot', label: '快照' },
  { id: 'installed', label: '已安装' },
]

export function VersionsPage({
  versions,
  activeVersion,
  tasks,
  onOpenVersion,
  onOpenDownloads,
}) {
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)

  const installedCount = versions.filter((v) => v.installed).length

  const list = useMemo(() => {
    return versions.filter((version) => {
      const matchesFilter =
        filter === 'all' ||
        (filter === 'installed' ? version.installed : version.type === filter)
      const matchesQuery =
        !query.trim() ||
        version.id.toLowerCase().includes(query.toLowerCase()) ||
        version.title.toLowerCase().includes(query.toLowerCase())
      return matchesFilter && matchesQuery
    })
  }, [versions, filter, query])

  const featured = versions[0]
  const featuredTask = tasks.find(
    (task) =>
      task.kind === 'game' &&
      task.meta?.version === featured.id &&
      task.status === 'running',
  )

  return (
    <div className="versions-page">
      <section className="page-heading">
        <div>
          <p className="kicker">GAME LIBRARY</p>
          <h1>游戏版本</h1>
          <p className="page-sub">
            {versions.length} 个版本已同步 · 已安装 {installedCount} 个
          </p>
        </div>
        <div className="heading-actions">
          <button
            className={`icon-button ${searchOpen ? 'is-active' : ''}`}
            onClick={() => {
              setSearchOpen((open) => !open)
              if (searchOpen) setQuery('')
            }}
            aria-label="搜索版本"
          >
            {searchOpen ? <X size={18} /> : <Search size={18} />}
          </button>
          <button className="icon-button" onClick={onOpenDownloads} aria-label="下载任务">
            <Download size={18} />
          </button>
        </div>
      </section>

      {searchOpen && (
        <label className="search-field">
          <Search size={15} />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索版本号或更新名称"
          />
        </label>
      )}

      <section className="featured-version" aria-label="最新正式版">
        <div className="featured-version-glow" />
        <div className="featured-version-copy">
          <span className="featured-version-tag">
            <Sparkles size={11} />
            {featured.tag || '最新版本'}
          </span>
          <h2>Minecraft {featured.id}</h2>
          <p>{featured.title}</p>
          <div className="featured-version-meta">
            <span>{featured.date}</span>
            <i />
            <span>{featured.size}</span>
            <i />
            <span>{featured.java}</span>
          </div>
        </div>
        <VersionArt version={featured.id} accent={featured.accent} />
        <button
          className="featured-version-action"
          onClick={() => onOpenVersion(featured.id)}
        >
          {featuredTask ? (
            <>
              <LoaderCircle size={14} className="spin" />
              {Math.round(featuredTask.progress)}%
            </>
          ) : featured.installed ? (
            <>
              <Check size={14} />
              已安装
            </>
          ) : (
            <>
              <Download size={14} />
              获取
            </>
          )}
        </button>
      </section>

      <div className="filter-scroll" role="tablist" aria-label="版本类型">
        {FILTERS.map((item) => {
          const count =
            item.id === 'all'
              ? versions.length
              : item.id === 'installed'
                ? installedCount
                : versions.filter((v) => v.type === item.id).length
          return (
            <button
              key={item.id}
              className={`filter-chip ${filter === item.id ? 'is-active' : ''}`}
              onClick={() => setFilter(item.id)}
              role="tab"
              aria-selected={filter === item.id}
            >
              {item.label}
              <span>{count}</span>
            </button>
          )
        })}
      </div>

      <div className="list-head">
        <span>
          {query ? `“${query}” 的结果` : '版本列表'}
          <b>{list.length}</b>
        </span>
        <SlidersHorizontal size={14} />
      </div>

      <div className="version-list">
        {list.map((version) => {
          const task = tasks.find(
            (item) =>
              item.kind === 'game' &&
              item.meta?.version === version.id &&
              item.status === 'running',
          )
          return (
            <button
              className={`version-row ${activeVersion === version.id ? 'is-current' : ''}`}
              key={version.id}
              onClick={() => onOpenVersion(version.id)}
            >
              <span
                className="version-tile"
                style={{
                  '--tile-accent': version.accent,
                }}
              >
                <span>{version.type === 'snapshot' ? 'SNAP' : 'MC'}</span>
                <strong>{version.id.split('.').slice(0, 2).join('.')}</strong>
              </span>
              <span className="version-copy">
                <span className="version-title-line">
                  <strong>{version.id}</strong>
                  {version.type === 'snapshot' ? (
                    <em className="version-badge snap">快照</em>
                  ) : (
                    <em className="version-badge">正式版</em>
                  )}
                  {activeVersion === version.id && <em className="version-badge current">当前</em>}
                </span>
                <span className="version-name">{version.title}</span>
                <span className="version-meta">
                  <CalendarDays size={11} /> {version.date}
                  <i />
                  {version.java}
                  <i />
                  {version.size}
                </span>
              </span>
              <span className="version-state">
                {task ? (
                  <span className="version-progress">
                    <LoaderCircle size={14} className="spin" />
                    {Math.round(task.progress)}%
                  </span>
                ) : version.installed ? (
                  <span className="version-installed">
                    <Check size={13} />
                  </span>
                ) : (
                  <span className="version-download">
                    <Download size={14} />
                  </span>
                )}
                <ChevronRight size={14} className="version-chevron" />
              </span>
            </button>
          )
        })}
      </div>

      {list.length === 0 && (
        <div className="empty-state">
          <span className="empty-icon">
            <Search size={22} />
          </span>
          <strong>没有找到这个版本</strong>
          <p>换一个版本号，或者清除筛选条件再试一次。</p>
          <button
            className="ghost-button small"
            onClick={() => {
              setQuery('')
              setFilter('all')
            }}
          >
            清除筛选
          </button>
        </div>
      )}

      <div className="versions-note">
        <Boxes size={15} />
        <p>
          版本清单来自 Mojang 官方元数据。下载时会自动校验 SHA-1 并补齐运行库。
        </p>
      </div>
    </div>
  )
}
