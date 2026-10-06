import { useEffect, useMemo, useState } from 'react'
import { ArrowDownAZ, ArrowLeft, ArrowRight, ArrowUpAZ, BookOpen, LayoutGrid, List, Search, Sparkles } from 'lucide-react'
import { Link, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import { getPokemon } from './api'
import type { Pokemon, SortDirection, SortKey } from './types'

const titleCase = (value: string) => value.charAt(0).toUpperCase() + value.slice(1)
const formatNumber = (value: number) => String(value).padStart(3, '0')
const statLevel = (value: number) => `stat-level-${Math.min(10, Math.max(1, Math.ceil(value / 15)))}`

function App() {
  const [items, setItems] = useState<Pokemon[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => { getPokemon().then(setItems).finally(() => setLoading(false)) }, [])

  return (
    <div className="app-shell">
      <Header />
      {loading ? <main className="status-page"><Sparkles size={28} /><h2>Mapping the Pokédex...</h2><p>Gathering field notes from PokéAPI.</p></main> : (
        <Routes>
          <Route path="/" element={<Home items={items} />} />
          <Route path="/gallery" element={<Gallery items={items} />} />
          <Route path="/pokemon/:id" element={<Details items={items} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      )}
    </div>
  )
}

function Header() {
  const location = useLocation()
  return <header className="site-header">
    <Link to="/" className="brand"><span className="brand-mark">◌</span><span><strong>Pokédex</strong><small>ATLAS / FIELD GUIDE</small></span></Link>
    <nav className="main-nav">
      <Link className={location.pathname === '/' ? 'active' : ''} to="/"><List size={16} /> Index</Link>
      <Link className={location.pathname === '/gallery' ? 'active' : ''} to="/gallery"><LayoutGrid size={16} /> Gallery</Link>
    </nav>
    <span className="header-note">KANTO / 001—060</span>
  </header>
}

function Home({ items }: { items: Pokemon[] }) {
  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('id')
  const [direction, setDirection] = useState<SortDirection>('asc')
  const visible = useMemo(() => items.filter((item) => item.name.includes(query.toLowerCase()) || item.types.some((type) => type.includes(query.toLowerCase()))).sort((a, b) => {
    const left = sortKey === 'name' ? a.name : a[sortKey]
    const right = sortKey === 'name' ? b.name : b[sortKey]
    const comparison = typeof left === 'string' ? left.localeCompare(right as string) : left - (right as number)
    return direction === 'asc' ? comparison : -comparison
  }), [items, query, sortKey, direction])

  return <main className="content">
    <section className="page-intro"><div><p className="eyebrow">SPECIES INDEX / LIVE SEARCH</p><h1>Know your<br /><em>neighbors.</em></h1></div><p className="intro-copy">A living field guide to the first 60 species in the Pokédex. Search by name or type, then sort the index to find your next companion.</p></section>
    <section className="toolbar">
      <label className="search-box"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value.toLowerCase())} placeholder="Search name or type..." aria-label="Search by name or type" /></label>
      <div className="sort-controls"><span>Sort by</span><select value={sortKey} onChange={(event) => setSortKey(event.target.value as SortKey)} aria-label="Sort property"><option value="id">Dex number</option><option value="name">Name</option><option value="experience">Base experience</option></select><button className="icon-button" onClick={() => setDirection(direction === 'asc' ? 'desc' : 'asc')} aria-label={`Sort ${direction === 'asc' ? 'descending' : 'ascending'}`} title="Toggle sort direction">{direction === 'asc' ? <ArrowUpAZ size={18} /> : <ArrowDownAZ size={18} />}</button></div>
    </section>
    <div className="results-meta"><span>{visible.length} species found</span><span>Updated from PokéAPI</span></div>
    {visible.length ? <div className="index-list">{visible.map((item) => <PokemonRow key={item.id} item={item} />)}</div> : <EmptyState />}
  </main>
}

function PokemonRow({ item }: { item: Pokemon }) {
  return <Link to={`/pokemon/${item.id}`} className="pokemon-row"><span className="dex-number">#{formatNumber(item.id)}</span><img src={item.image} alt="" /><span className="row-name"><strong>{titleCase(item.name)}</strong><small>{item.types.map(titleCase).join(' / ')}</small></span><span className="row-exp">{item.experience} XP</span><ArrowRight className="row-arrow" size={18} /></Link>
}

function Gallery({ items }: { items: Pokemon[] }) {
  const types = [...new Set(items.flatMap((item) => item.types))].sort()
  const [selected, setSelected] = useState<string[]>([])
  const visible = selected.length ? items.filter((item) => selected.every((type) => item.types.includes(type))) : items
  const toggle = (type: string) => setSelected((current) => current.includes(type) ? current.filter((entry) => entry !== type) : [...current, type])
  return <main className="content"><section className="page-intro gallery-intro"><div><p className="eyebrow">VISUAL ARCHIVE / TYPE FILTERS</p><h1>See the<br /><em>whole story.</em></h1></div><p className="intro-copy">Browse the field collection by elemental type. Choose one or several filters to narrow the gallery.</p></section>
    <div className="filter-bar"><span>Filter by type</span><div className="type-filters">{types.map((type) => <button key={type} className={`type-chip ${selected.includes(type) ? 'selected' : ''} type-${type}`} onClick={() => toggle(type)}>{titleCase(type)}</button>)}</div>{selected.length > 0 && <button className="clear-button" onClick={() => setSelected([])}>Clear all</button>}</div>
    <div className="gallery-grid">{visible.map((item) => <Link to={`/pokemon/${item.id}`} className="gallery-card" key={item.id}><div className="card-image"><span>#{formatNumber(item.id)}</span><img src={item.image} alt={titleCase(item.name)} /></div><div className="card-copy"><div><h3>{titleCase(item.name)}</h3><p>{item.types.map(titleCase).join(' / ')}</p></div><ArrowRight size={17} /></div></Link>)}</div>
    {!visible.length && <EmptyState />}
  </main>
}

function Details({ items }: { items: Pokemon[] }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const currentIndex = items.findIndex((item) => item.id === Number(id))
  const item = items[currentIndex]
  if (!item) return <main className="status-page"><h2>Species not found</h2><Link to="/" className="text-link">Return to index</Link></main>
  const previous = items[(currentIndex - 1 + items.length) % items.length]
  const next = items[(currentIndex + 1) % items.length]
  return <main className="detail-page"><button className="back-link" onClick={() => navigate(-1)}><ArrowLeft size={17} /> Back to index</button><div className="detail-layout"><div className="detail-visual"><p className="eyebrow">FIELD RECORD / #{formatNumber(item.id)}</p><img src={item.image} alt={titleCase(item.name)} /></div><div className="detail-copy"><p className="eyebrow">SPECIES PROFILE</p><h1>{titleCase(item.name)}</h1><div className="detail-types">{item.types.map((type) => <span className={`type-chip type-${type}`} key={type}>{titleCase(type)}</span>)}</div><p className="detail-note">A documented encounter from the Kanto collection. Explore its physical profile, abilities, and base statistics below.</p><div className="facts"><div><small>HEIGHT</small><strong>{(item.height / 10).toFixed(1)} m</strong></div><div><small>WEIGHT</small><strong>{(item.weight / 10).toFixed(1)} kg</strong></div><div><small>BASE XP</small><strong>{item.experience}</strong></div></div><div className="detail-section"><h2>Abilities</h2><p>{item.abilities.map(titleCase).join(' · ')}</p></div><div className="detail-section"><h2>Base stats</h2>{item.stats.slice(0, 4).map((stat) => <div className="stat" key={stat.name}><span>{stat.name.replace('-', ' ')}</span><div className="stat-track"><i className={statLevel(stat.value)} /></div><b>{stat.value}</b></div>)}</div></div></div><div className="detail-nav"><Link to={`/pokemon/${previous.id}`}><ArrowLeft size={17} /><span><small>PREVIOUS</small>{titleCase(previous.name)}</span></Link><Link to={`/pokemon/${next.id}`}><span><small>NEXT</small>{titleCase(next.name)}</span><ArrowRight size={17} /></Link></div></main>
}

function EmptyState() { return <div className="empty-state"><BookOpen size={25} /><h2>No field notes match.</h2><p>Try a different name, type, or filter combination.</p></div> }

export default App
