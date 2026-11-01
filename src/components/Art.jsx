import { useId } from 'react'
import {
  Zap,
  Eye,
  Blocks,
  Grid2X2,
  Cog,
  Gem,
  Mic,
  Mountain,
} from 'lucide-react'

const MOD_GLYPHS = {
  Zap,
  Eye,
  Blocks,
  Grid2X2,
  Cog,
  Gem,
  Mic,
  Mountain,
}

export function KcnCube({ size = 34, className = '' }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 48 48"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="kcn-top" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#E5FFB0" />
          <stop offset="1" stopColor="#B8F26A" />
        </linearGradient>
        <linearGradient id="kcn-left" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7AB840" />
          <stop offset="1" stopColor="#527F2E" />
        </linearGradient>
        <linearGradient id="kcn-right" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#A4DE5D" />
          <stop offset="1" stopColor="#79B843" />
        </linearGradient>
      </defs>
      <path d="M24 4 43 14.5v19L24 44 5 33.5v-19Z" fill="#8ED14B" />
      <path d="M24 4 43 14.5 24 25 5 14.5Z" fill="url(#kcn-top)" />
      <path d="M24 25v19L5 33.5v-19Z" fill="url(#kcn-left)" />
      <path d="M24 25v19l19-10.5v-19Z" fill="url(#kcn-right)" />
      <path d="m15 11 7 4v4l-7-4Zm13 4 5-2.8v4L28 19Z" fill="#F4FFDA" opacity=".66" />
      <path d="M8 17.5 15 21.5v2.8L8 20.2Zm8 4.5 4 2.3v3L16 25Z" fill="#31521F" opacity=".36" />
    </svg>
  )
}

export function Avatar({ name = 'Alex', size = 42, online = true }) {
  const seed = [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0)
  const skins = [
    { hair: '#C46C3A', skin: '#E8B48E', shirt: '#5AA5A0', bg: '#375342' },
    { hair: '#51382A', skin: '#D7A276', shirt: '#6E9AC9', bg: '#2E4050' },
    { hair: '#2F2A29', skin: '#C68C68', shirt: '#9C7AC7', bg: '#40354E' },
    { hair: '#D1A94F', skin: '#F0C6A0', shirt: '#C96D5A', bg: '#4C3D2F' },
  ]
  const skin = skins[seed % skins.length]

  return (
    <span
      className="avatar"
      style={{ width: size, height: size, '--avatar-bg': skin.bg }}
      aria-label={`${name} 的头像`}
    >
      <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
        <rect width="64" height="64" fill={skin.bg} />
        <rect x="0" y="46" width="64" height="18" fill="rgba(0,0,0,.16)" />
        <rect x="10" y="14" width="44" height="43" fill={skin.skin} />
        <rect x="10" y="10" width="44" height="16" fill={skin.hair} />
        <rect x="6" y="17" width="8" height="20" fill={skin.hair} />
        <rect x="50" y="17" width="8" height="20" fill={skin.hair} />
        <rect x="16" y="26" width="10" height="7" fill="#F7F2E8" />
        <rect x="38" y="26" width="10" height="7" fill="#F7F2E8" />
        <rect x="22" y="28" width="4" height="5" fill="#31413E" />
        <rect x="38" y="28" width="4" height="5" fill="#31413E" />
        <rect x="29" y="38" width="8" height="3" fill="#A66C55" opacity=".6" />
        <rect x="18" y="48" width="28" height="12" fill={skin.shirt} />
        <rect x="26" y="52" width="12" height="8" fill="rgba(255,255,255,.1)" />
        <rect x="10" y="45" width="5" height="15" fill={skin.skin} opacity=".8" />
        <rect x="49" y="45" width="5" height="15" fill={skin.skin} opacity=".8" />
      </svg>
      {online && <i className="avatar-online" />}
    </span>
  )
}

export function HeroScene() {
  return (
    <svg
      className="hero-scene"
      viewBox="0 0 440 280"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="hero-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#456E69" />
          <stop offset="0.42" stopColor="#87A182" />
          <stop offset="0.72" stopColor="#D5BE8B" />
          <stop offset="1" stopColor="#E5A36F" />
        </linearGradient>
        <linearGradient id="hero-lake" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#A6AD84" />
          <stop offset="0.45" stopColor="#68796D" />
          <stop offset="1" stopColor="#2B3C36" />
        </linearGradient>
        <linearGradient id="hero-shade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.18" stopColor="#07100A" stopOpacity="0" />
          <stop offset="0.62" stopColor="#07100A" stopOpacity=".34" />
          <stop offset="1" stopColor="#07100A" stopOpacity=".92" />
        </linearGradient>
        <radialGradient id="hero-glow">
          <stop offset="0" stopColor="#FFE9A8" stopOpacity=".85" />
          <stop offset="1" stopColor="#FFE9A8" stopOpacity="0" />
        </radialGradient>
        <filter id="hero-blur" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
        <filter id="hero-blur-sm" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="2.5" />
        </filter>
      </defs>

      <rect width="440" height="280" fill="url(#hero-sky)" />
      <circle cx="338" cy="86" r="62" fill="url(#hero-glow)" />
      <circle cx="338" cy="86" r="25" fill="#FFE9AE" />
      <circle cx="338" cy="86" r="19" fill="#FFF4CC" opacity=".9" />

      <g fill="#F5EBCF" opacity=".3">
        <rect x="52" y="54" width="68" height="5" />
        <rect x="65" y="45" width="42" height="5" />
        <rect x="91" y="63" width="42" height="4" />
        <rect x="266" y="53" width="56" height="4" />
        <rect x="281" y="45" width="27" height="4" />
      </g>

      <g opacity=".68">
        <path d="M0 183h43v-9h35v-8h31v-8h30v7h29v10h35v8H0Z" fill="#5B7266" />
        <path d="M249 183h41v-12h35v-11h31v6h38v10h46v7H249Z" fill="#62786B" />
      </g>

      <path
        d="M0 198h28v-14h37v-10h22v-20h26v9h22v13h28v8h33v14h31v-9h27v-21h30v11h22v12h33v12h33v-8h38v22H0Z"
        fill="#455B4D"
        opacity=".82"
      />
      <path
        d="M0 212h44v-13h39v-6h39v11h31v-16h28v7h24v15h44v-7h43v13h42v-17h31v8h21v22H0Z"
        fill="#34493C"
      />

      <rect x="0" y="198" width="440" height="82" fill="url(#hero-lake)" />
      <g opacity=".45" fill="#EBC58E">
        <rect x="302" y="204" width="72" height="2" />
        <rect x="318" y="212" width="51" height="2" />
        <rect x="330" y="220" width="34" height="1.5" />
        <rect x="311" y="228" width="44" height="1.5" />
        <rect x="342" y="237" width="22" height="1.5" />
      </g>
      <g opacity=".22" fill="#E7EBDB">
        <rect x="45" y="218" width="70" height="1.5" />
        <rect x="103" y="231" width="40" height="1.5" />
        <rect x="200" y="223" width="58" height="1.5" />
        <rect x="218" y="236" width="30" height="1.5" />
      </g>

      <g>
        <rect x="318" y="157" width="56" height="38" fill="#2B3229" />
        <rect x="312" y="151" width="68" height="8" fill="#48513C" />
        <rect x="304" y="144" width="84" height="8" fill="#3B4433" />
        <rect x="326" y="168" width="13" height="13" fill="#F4C36D" />
        <rect x="329" y="171" width="7" height="7" fill="#FFE2A0" />
        <rect x="353" y="169" width="9" height="9" fill="#1B231D" />
        <rect x="331" y="186" width="30" height="9" fill="#1E2820" />
        <rect x="352" y="132" width="8" height="14" fill="#3C4338" />
        <rect x="348" y="132" width="16" height="5" fill="#4B5442" />
        <g fill="#D9D7BC" opacity=".32">
          <rect x="356" y="112" width="16" height="10" />
          <rect x="362" y="100" width="10" height="8" />
        </g>
      </g>

      <g>
        <rect x="34" y="140" width="7" height="45" fill="#3C3024" />
        <rect x="24" y="123" width="27" height="12" fill="#314D34" />
        <rect x="18" y="135" width="40" height="11" fill="#38573B" />
        <rect x="24" y="146" width="28" height="10" fill="#2B462F" />
        <rect x="28" y="156" width="20" height="8" fill="#243B28" />
        <rect x="72" y="151" width="6" height="36" fill="#3B2E23" />
        <rect x="64" y="137" width="22" height="10" fill="#2E4932" />
        <rect x="59" y="147" width="32" height="8" fill="#355338" />
        <rect x="66" y="155" width="19" height="8" fill="#28412C" />
      </g>

      <path d="M0 226h30v-11h27v7h26v13h21v10h31v-9h24v-13h20v12h30v13h27v-8h26v-11h29v8h27v15h29v11h44v-8h39v18H0Z" fill="#1A2B20" />
      <path
        d="M0 231h30v-6h26v8h25v11h20v9h29v-11h26v-14h20v9h30v11h28v-7h31v-4h31v13h30v8h27v10h37v-6h40v14H0Z"
        fill="#122117"
        opacity=".9"
      />
      <path d="M0 230h31v-5h36v4h22v8H0Z" fill="#56713B" opacity=".55" />
      <path d="M173 240h29v-7h20v8h-29v8h-20Z" fill="#4D6738" opacity=".38" />

      <g>
        <rect x="214" y="213" width="12" height="20" fill="#27312A" />
        <rect x="210" y="231" width="11" height="15" fill="#1B251F" />
        <rect x="222" y="230" width="10" height="16" fill="#1C261F" />
        <rect x="212" y="216" width="17" height="15" fill="#D48A48" />
        <rect x="215" y="231" width="15" height="10" fill="#354E59" />
        <rect x="207" y="216" width="5" height="10" fill="#C77E43" />
        <rect x="227" y="215" width="5" height="15" fill="#C77E43" />
        <rect x="215" y="210" width="10" height="7" fill="#A96536" />
        <rect x="228" y="231" width="18" height="2.5" fill="#6E543C" />
        <path d="M244 224h4v19h-4Z" fill="#9BA5A2" />
        <path d="M240 221h14v5h-14Z" fill="#C4CDC5" />
        <rect x="212" y="210" width="4" height="5" fill="#F0D9B3" opacity=".7" />
      </g>

      <g fill="#D8FF8F">
        <circle cx="286" cy="180" r="1.4" opacity=".8" />
        <circle cx="299" cy="197" r="1" opacity=".6" />
        <circle cx="254" cy="170" r="1" opacity=".5" />
        <circle cx="120" cy="194" r="1.2" opacity=".54" />
      </g>

      <rect width="440" height="280" fill="url(#hero-shade)" />
    </svg>
  )
}

const SHADER_PALETTES = {
  sunset: {
    sky: ['#F7C38F', '#D98F7A', '#655475'],
    sun: '#FFE7AF',
    sunX: 252,
    sunY: 49,
    far: '#8B6B78',
    mid: '#4F495B',
    near: '#263D31',
    water: ['#A67C7B', '#5F5267', '#25352F'],
    tree: '#1B3127',
    cloud: '#FFE9CD',
    glow: '#FFBD7E',
    stars: false,
  },
  forest: {
    sky: ['#B6D6AD', '#78A98A', '#3F6E5C'],
    sun: '#F4FFD2',
    sunX: 116,
    sunY: 42,
    far: '#6E9279',
    mid: '#3B644B',
    near: '#173B2A',
    water: ['#89B59A', '#4E816A', '#203F31'],
    tree: '#123423',
    cloud: '#E9F5D8',
    glow: '#DFFFAE',
    stars: false,
  },
  ocean: {
    sky: ['#A9E7EC', '#6CC1D4', '#2D7F9C'],
    sun: '#F6FFE1',
    sunX: 278,
    sunY: 38,
    far: '#6BA6AF',
    mid: '#327C8A',
    near: '#174A55',
    water: ['#67C4CE', '#2F8D9F', '#133F4C'],
    tree: '#113D42',
    cloud: '#ECFFFA',
    glow: '#B7FFF2',
    stars: false,
  },
  violet: {
    sky: ['#34284F', '#6F528D', '#C69CC4'],
    sun: '#FFF0D1',
    sunX: 317,
    sunY: 42,
    far: '#6B5580',
    mid: '#403653',
    near: '#1D2430',
    water: ['#8C6E9A', '#514465', '#202532'],
    tree: '#171D28',
    cloud: '#D7C4E8',
    glow: '#C7A6FF',
    stars: true,
  },
}

export function ShaderScene({ variant = 'sunset', className = '' }) {
  const uid = useId().replace(/:/g, '')
  const palette = SHADER_PALETTES[variant] || SHADER_PALETTES.sunset
  const [skyTop, skyMid, skyBottom] = palette.sky
  const [waterTop, waterMid, waterBottom] = palette.water

  return (
    <svg
      className={`shader-scene ${className}`}
      viewBox="0 0 320 180"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`sh-sky-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={skyTop} />
          <stop offset=".5" stopColor={skyMid} />
          <stop offset="1" stopColor={skyBottom} />
        </linearGradient>
        <linearGradient id={`sh-water-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={waterTop} />
          <stop offset=".44" stopColor={waterMid} />
          <stop offset="1" stopColor={waterBottom} />
        </linearGradient>
        <radialGradient id={`sh-glow-${uid}`}>
          <stop offset="0" stopColor={palette.glow} stopOpacity=".8" />
          <stop offset="1" stopColor={palette.glow} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`sh-shade-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset=".35" stopColor="#08100B" stopOpacity="0" />
          <stop offset="1" stopColor="#08100B" stopOpacity=".7" />
        </linearGradient>
      </defs>

      <rect width="320" height="180" fill={`url(#sh-sky-${uid})`} />
      {palette.stars && (
        <g fill="#FFF6D7" opacity=".7">
          <circle cx="35" cy="25" r="1" />
          <circle cx="84" cy="48" r="1.2" />
          <circle cx="142" cy="20" r=".9" />
          <circle cx="207" cy="38" r="1" />
          <circle cx="258" cy="18" r="1.2" />
          <circle cx="296" cy="55" r=".8" />
        </g>
      )}
      <circle cx={palette.sunX} cy={palette.sunY} r="45" fill={`url(#sh-glow-${uid})`} />
      <circle cx={palette.sunX} cy={palette.sunY} r="14" fill={palette.sun} opacity=".97" />
      <circle cx={palette.sunX} cy={palette.sunY} r="22" fill={palette.sun} opacity=".12" />

      <g fill={palette.cloud} opacity=".27">
        <rect x="20" y="44" width="60" height="4" rx="2" />
        <rect x="34" y="38" width="32" height="4" rx="2" />
        <rect x="204" y="66" width="63" height="3.5" rx="2" />
        <rect x="222" y="60" width="32" height="3.5" rx="2" />
      </g>

      <path d="M0 118h27v-8h25v-7h22v-9h25v6h24v9h28v9h24v-7h26v-12h27v7h25v-4h29v14h28v7H0Z" fill={palette.far} opacity=".65" />
      <path d="M0 132h34v-11h31v-8h26v10h28v-6h21v8h30v9h23v-8h32v-10h27v7h25v11h33v8H0Z" fill={palette.mid} opacity=".88" />
      <rect x="0" y="128" width="320" height="52" fill={`url(#sh-water-${uid})`} />

      <g opacity=".55" fill={palette.sun}>
        <rect x={palette.sunX - 23} y="134" width="48" height="1.7" />
        <rect x={palette.sunX - 14} y="141" width="32" height="1.5" />
        <rect x={palette.sunX - 6} y="148" width="18" height="1.3" />
        <rect x={palette.sunX - 18} y="156" width="26" height="1.2" />
      </g>

      <path
        d="M0 145h16v-16h10v9h8v11h11v13h15v-10h9v15h18v-8h14v-13h9v8h12v17h17v-11h12v9h10v13h13v-8h15v12h16v-7h14v11h18v-9h15v12h20v-6h18v9h16v7H0Z"
        fill={palette.tree}
      />
      <path d="M0 155h22v-7h16v5h14v8h16v-5h12v9h20v-4h14v7h18v-5h17v8h20v-4h15v9h19v-6h20v10H0Z" fill="#0C1B13" opacity=".8" />
      <path d="M0 147h13v-5h13v3h11v8H0Z" fill={palette.mid} opacity=".8" />

      <g fill="#D6FF9A" opacity=".55">
        <circle cx="283" cy="139" r="1" />
        <circle cx="63" cy="152" r=".8" />
        <circle cx="238" cy="126" r=".7" />
      </g>
      <rect width="320" height="180" fill={`url(#sh-shade-${uid})`} />
    </svg>
  )
}

export function ModIcon({ icon = 'Zap', accent = '#A8E063', accent2 = '#4E8A35', size = 46 }) {
  const Glyph = MOD_GLYPHS[icon] || Blocks
  return (
    <span
      className="mod-icon"
      style={{
        width: size,
        height: size,
        '--mod-accent': accent,
        '--mod-accent-2': accent2,
      }}
    >
      <span className="mod-icon-grid" />
      <Glyph size={size * 0.44} strokeWidth={1.9} />
    </span>
  )
}

export function VersionArt({ version, accent = '#A9D96C' }) {
  return (
    <div className="version-art" style={{ '--version-accent': accent }}>
      <span className="version-art-block b1" />
      <span className="version-art-block b2" />
      <span className="version-art-block b3" />
      <span className="version-art-grid" />
      <span className="version-art-label">{version}</span>
    </div>
  )
}
