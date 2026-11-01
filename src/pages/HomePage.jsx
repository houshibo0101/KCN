import {
  Play,
  ChevronRight,
  MoreHorizontal,
  Boxes,
  Layers3,
  Coffee,
  Download,
  Clock3,
  Sparkles,
  ArrowUpRight,
  Flame,
  Check,
  CircleAlert,
} from 'lucide-react'
import { HeroScene, ShaderScene, ModIcon } from '../components/Art'
import { WORLDS, SHADERS, MODS } from '../data'

function greeting() {
  const hour = new Date().getHours()
  if (hour < 6) return '夜深了'
  if (hour < 11) return '早上好'
  if (hour < 14) return '中午好'
  if (hour < 18) return '下午好'
  return '晚上好'
}

export function HomePage({
  account,
  versions,
  activeVersion,
  activeLoader,
  installedMods,
  installedShaders,
  java,
  onLaunch,
  onNavigate,
  onOpenVersion,
  onOpenResource,
  onOpenJava,
  onOpenDownloads,
}) {
  const version = versions.find((v) => v.id === activeVersion) || versions[1]
  const shader = SHADERS[0]
  const mod = MODS[7]
  const javaReady = java.installed

  return (
    <div className="home-page">
      <section className="welcome">
        <div>
          <p className="kicker">
            {greeting()}，{account}
          </p>
          <h1>今天，去哪个世界？</h1>
        </div>
        <div className="streak-chip">
          <Flame size={14} />
          <span>连续 7 天</span>
        </div>
      </section>

      <section className="hero-card">
        <HeroScene />
        <div className="hero-tint" />
        <div className="hero-top">
          <span className="hero-status">
            <i className="live-dot" />
            当前实例
          </span>
          <button
            className="hero-more"
            aria-label="查看实例信息"
            onClick={() => onOpenVersion(version.id)}
          >
            <MoreHorizontal size={18} />
          </button>
        </div>

        <div className="hero-content">
          <p className="hero-overline">
            {version.id} · {activeLoader}
          </p>
          <h2>Crafty 生存</h2>
          <div className="hero-chips">
            <span className={javaReady ? '' : 'warn'}>
              {javaReady ? `Java ${java.version}` : 'Java 未配置'}
            </span>
            <span>{installedMods.length} Mods</span>
            <span>{installedShaders.length} 光影</span>
          </div>
        </div>

        <button className="launch-fab" onClick={() => onLaunch(activeVersion)} aria-label="启动游戏">
          <Play size={24} fill="currentColor" strokeWidth={0} />
          <span>启动</span>
        </button>
      </section>

      <section className="quick-actions" aria-label="快捷入口">
        <button onClick={() => onNavigate('versions')}>
          <span className="quick-icon quick-violet">
            <Boxes size={18} />
          </span>
          <span>版本库</span>
        </button>
        <button onClick={() => onNavigate('resources', 'mods')}>
          <span className="quick-icon quick-amber">
            <Layers3 size={18} />
          </span>
          <span>Mod</span>
        </button>
        <button onClick={() => onNavigate('resources', 'shaders')}>
          <span className="quick-icon quick-cyan">
            <Sparkles size={18} />
          </span>
          <span>光影</span>
        </button>
        <button onClick={onOpenJava}>
          <span className={`quick-icon quick-coral ${javaReady ? '' : 'has-alert'}`}>
            <Coffee size={18} />
            {!javaReady && <i />}
          </span>
          <span>Java</span>
        </button>
      </section>

      <section className="section-block">
        <div className="section-head">
          <h3>最近游玩</h3>
          <button className="text-action" onClick={() => onLaunch(activeVersion)}>
            全部世界 <ChevronRight size={13} />
          </button>
        </div>
        <div className="world-list">
          {WORLDS.map((world, index) => (
            <button
              className="world-card"
              key={world.id}
              onClick={() => onLaunch(activeVersion)}
            >
              <span className="world-art">
                <ShaderScene variant={world.variant} />
                <span className="world-art-overlay" />
                {index === 0 && <span className="world-live">最近</span>}
              </span>
              <span className="world-copy">
                <span className="world-name">{world.name}</span>
                <span className="world-meta">{world.mode}</span>
                <span className="world-foot">
                  <Clock3 size={11} />
                  {world.playtime}
                  <i />
                  {world.lastPlayed}
                </span>
              </span>
              <span className="world-play">
                <Play size={14} fill="currentColor" strokeWidth={0} />
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="section-block">
        <div className="section-head">
          <h3>本周精选</h3>
          <button className="text-action" onClick={() => onNavigate('resources', 'shaders')}>
            逛逛资源库 <ChevronRight size={13} />
          </button>
        </div>
        <div className="featured-scroll">
          <button
            className="featured-card featured-shader"
            onClick={() => onOpenResource('shader', shader.id)}
          >
            <ShaderScene variant={shader.visual} />
            <span className="featured-shade" />
            <span className="featured-tag">
              <Sparkles size={11} /> 编辑推荐
            </span>
            <span className="featured-copy">
              <strong>{shader.name}</strong>
              <small>{shader.subtitle}</small>
            </span>
            <span className="featured-arrow">
              <ArrowUpRight size={16} />
            </span>
          </button>

          <button
            className="featured-card featured-mod"
            onClick={() => onOpenResource('mod', mod.id)}
          >
            <span className="featured-noise" />
            <span className="featured-mod-top">
              <ModIcon
                icon={mod.icon}
                accent={mod.accent}
                accent2={mod.accent2}
                size={52}
              />
              <span className="featured-tag soft">新上架</span>
            </span>
            <span className="featured-copy">
              <strong>{mod.name}</strong>
              <small>{mod.subtitle}</small>
            </span>
            <span className="featured-mod-foot">
              <span>
                <Download size={11} /> {mod.downloads}
              </span>
              <span className="mini-installed">
                {installedMods.includes(mod.id) ? <Check size={11} /> : '+'}
              </span>
            </span>
          </button>
        </div>
      </section>

      <button className="java-banner" onClick={onOpenJava}>
        <span className={`java-banner-icon ${javaReady ? '' : 'is-warning'}`}>
          {javaReady ? <Coffee size={19} /> : <CircleAlert size={19} />}
        </span>
        <span className="java-banner-copy">
          <strong>{javaReady ? 'Java 运行时已就绪' : '还差一个 Java 运行时'}</strong>
          <small>
            {javaReady
              ? `OpenJDK ${java.version} · ${java.arch} · 自动校验`
              : 'KCN 可以自动下载并匹配你的设备'}
          </small>
        </span>
        <span className="java-banner-action">
          {javaReady ? '管理' : '去下载'}
          <ChevronRight size={14} />
        </span>
      </button>

      <button className="download-history-link" onClick={onOpenDownloads}>
        <Download size={13} />
        查看下载任务
        <ChevronRight size={12} />
      </button>
    </div>
  )
}
