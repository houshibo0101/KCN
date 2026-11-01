import { useMemo, useState } from 'react'
import {
  Search,
  Download,
  Check,
  Layers3,
  Sparkles,
  ChevronRight,
  SlidersHorizontal,
  LoaderCircle,
  Boxes,
  ArrowUpRight,
  X,
} from 'lucide-react'
import { ModIcon, ShaderScene } from '../components/Art'
import { MODS, SHADERS } from '../data'

const MOD_CATEGORIES = ['全部', '优化', '光影', '基础', '实用', '科技', '社交', '视觉']

export function ResourcesPage({
  initialTab = 'mods',
  installedMods,
  installedShaders,
  tasks,
  onOpenResource,
  onOpenDownloads,
}) {
  const [segment, setSegment] = useState(initialTab)
  const [category, setCategory] = useState('全部')
  const [query, setQuery] = useState('')

  const modList = useMemo(() => {
    return MODS.filter((mod) => {
      const categoryMatch = category === '全部' || mod.category === category
      const queryMatch =
        !query.trim() ||
        mod.name.toLowerCase().includes(query.toLowerCase()) ||
        mod.subtitle.toLowerCase().includes(query.toLowerCase()) ||
        mod.author.toLowerCase().includes(query.toLowerCase())
      return categoryMatch && queryMatch
    })
  }, [category, query])

  const shaderList = useMemo(() => {
    return SHADERS.filter(
      (shader) =>
        !query.trim() ||
        shader.name.toLowerCase().includes(query.toLowerCase()) ||
        shader.desc.toLowerCase().includes(query.toLowerCase()) ||
        shader.author.toLowerCase().includes(query.toLowerCase()),
    )
  }, [query])

  const count = segment === 'mods' ? MODS.length : SHADERS.length
  const installedCount =
    segment === 'mods' ? installedMods.length : installedShaders.length

  return (
    <div className="resources-page">
      <section className="page-heading">
        <div>
          <p className="kicker">EXPLORE &amp; CREATE</p>
          <h1>资源工坊</h1>
          <p className="page-sub">
            {count} 个精选资源 · 已安装 {installedCount} 个
          </p>
        </div>
        <button className="icon-button" onClick={onOpenDownloads} aria-label="下载任务">
          <Download size={18} />
        </button>
      </section>

      <div className="resource-tabs" role="tablist">
        <button
          className={segment === 'mods' ? 'is-active' : ''}
          onClick={() => setSegment('mods')}
          role="tab"
          aria-selected={segment === 'mods'}
        >
          <Boxes size={16} />
          Mod
          <span>{MODS.length}</span>
        </button>
        <button
          className={segment === 'shaders' ? 'is-active' : ''}
          onClick={() => setSegment('shaders')}
          role="tab"
          aria-selected={segment === 'shaders'}
        >
          <Sparkles size={16} />
          光影
          <span>{SHADERS.length}</span>
        </button>
      </div>

      <label className="search-field">
        <Search size={15} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={segment === 'mods' ? '搜索 Mod、作者或功能' : '搜索光影包或作者'}
        />
        {query && (
          <button
            type="button"
            className="search-clear"
            onClick={() => setQuery('')}
            aria-label="清空搜索"
          >
            <X size={13} />
          </button>
        )}
      </label>

      {segment === 'mods' ? (
        <>
          <div className="filter-scroll categories">
            {MOD_CATEGORIES.map((item) => (
              <button
                key={item}
                className={`filter-chip compact ${category === item ? 'is-active' : ''}`}
                onClick={() => setCategory(item)}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="list-head">
            <span>
              {query ? `“${query}” 的结果` : '热门 Mod'}
              <b>{modList.length}</b>
            </span>
            <SlidersHorizontal size={14} />
          </div>

          <div className="mod-grid">
            {modList.map((mod) => {
              const installed = installedMods.includes(mod.id)
              const task = tasks.find(
                (item) =>
                  item.kind === 'mod' &&
                  item.meta?.resourceId === mod.id &&
                  item.status === 'running',
              )
              return (
                <button
                  className={`mod-card ${installed ? 'is-installed' : ''}`}
                  key={mod.id}
                  onClick={() => onOpenResource('mod', mod.id)}
                >
                  <span className="mod-card-top">
                    <ModIcon
                      icon={mod.icon}
                      accent={mod.accent}
                      accent2={mod.accent2}
                      size={44}
                    />
                    <span className="mod-state">
                      {task ? (
                        <span className="mod-progress">
                          <LoaderCircle size={12} className="spin" />
                          {Math.round(task.progress)}%
                        </span>
                      ) : installed ? (
                        <span className="installed-check">
                          <Check size={11} strokeWidth={3} />
                        </span>
                      ) : (
                        <span className="mod-add">+</span>
                      )}
                    </span>
                  </span>
                  <span className="mod-name">{mod.name}</span>
                  <span className="mod-desc">{mod.subtitle}</span>
                  <span className="mod-tagline">{mod.tags[0]}</span>
                  <span className="mod-card-foot">
                    <span>{mod.version.split('+')[0]}</span>
                    <span>
                      <Download size={10} /> {mod.downloads}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        </>
      ) : (
        <>
          <div className="shader-stats">
            <span>
              <Layers3 size={13} /> 兼容 Iris / OptiFine
            </span>
            <span>按设备性能分级</span>
          </div>

          <div className="shader-list">
            {shaderList.map((shader) => {
              const installed = installedShaders.includes(shader.id)
              const task = tasks.find(
                (item) =>
                  item.kind === 'shader' &&
                  item.meta?.resourceId === shader.id &&
                  item.status === 'running',
              )
              return (
                <button
                  className="shader-card"
                  key={shader.id}
                  onClick={() => onOpenResource('shader', shader.id)}
                >
                  <span className="shader-preview">
                    <ShaderScene variant={shader.visual} />
                    <span className="shader-preview-shade" />
                    <span className="shader-tag">{shader.tag}</span>
                    <span className="shader-open">
                      <ArrowUpRight size={14} />
                    </span>
                  </span>
                  <span className="shader-copy">
                    <span className="shader-title-row">
                      <strong>{shader.name}</strong>
                      {installed && (
                        <em className="installed-pill">
                          <Check size={10} strokeWidth={3} /> 已安装
                        </em>
                      )}
                    </span>
                    <span className="shader-sub">{shader.subtitle}</span>
                    <span className="shader-meta">
                      <span>by {shader.author}</span>
                      <i />
                      <span>{shader.size}</span>
                      <i />
                      <span>
                        <Download size={10} /> {shader.downloads}
                      </span>
                    </span>
                    {task && (
                      <span className="inline-progress">
                        <span style={{ width: `${task.progress}%` }} />
                      </span>
                    )}
                  </span>
                  <span className="shader-action">
                    {task ? (
                      <LoaderCircle size={15} className="spin" />
                    ) : installed ? (
                      <Check size={15} />
                    ) : (
                      <Download size={15} />
                    )}
                  </span>
                </button>
              )
            })}
          </div>
        </>
      )}

      {((segment === 'mods' && modList.length === 0) ||
        (segment === 'shaders' && shaderList.length === 0)) && (
        <div className="empty-state">
          <span className="empty-icon">
            <Search size={22} />
          </span>
          <strong>这里暂时没有结果</strong>
          <p>换一个关键词，或切换分类继续探索。</p>
          <button
            className="ghost-button small"
            onClick={() => {
              setQuery('')
              setCategory('全部')
            }}
          >
            重置搜索
          </button>
        </div>
      )}

      <div className="resource-source">
        <span className="source-dot" />
        资源索引已同步 · Modrinth &amp; CurseForge
        <button onClick={onOpenDownloads}>
          下载队列 <ChevronRight size={12} />
        </button>
      </div>
    </div>
  )
}
