import { useState, useRef, useEffect, useCallback } from 'react'

// ─── Schema ───────────────────────────────────────────────────────────────────
const INITIAL_TABLES = {
  admin: {
    id: 'admin', label: 'Admin', color: '#e05c8a',
    x: 60, y: 50,
    fields: [
      { name: 'id',         type: 'bigint',  pk: true },
      { name: 'secret_key', type: 'bigint'            },
      { name: 'Name',       type: 'varchar'           },
      { name: 'email',      type: 'varchar'           },
      { name: 'password',   type: 'varchar'           },
    ],
  },
  user: {
    id: 'user', label: 'user', color: '#7c5cfc',
    x: 780, y: 40,
    fields: [
      { name: 'id',       type: 'bigint',  pk: true },
      { name: 'Name',     type: 'varchar'           },
      { name: 'email',    type: 'varchar'           },
      { name: 'password', type: 'varchar'           },
    ],
  },
  chat_admin_vs_user: {
    id: 'chat_admin_vs_user', label: 'chat_admin_vs_user', color: '#00b8c4',
    x: 400, y: 105,
    fields: [
      { name: 'id',        type: 'bigint', pk: true },
      { name: 'admin_id',  type: 'bigint', fk: true },
      { name: 'user_id',   type: 'bigint', fk: true },
      { name: 'message',   type: 'text'             },
      { name: 'ticket_id', type: 'bigint', fk: true },
      { name: 'image',     type: 'blob'             },
    ],
  },
  new_client: {
    id: 'new_client', label: 'new_client', color: '#5b8af5',
    x: 55, y: 320,
    fields: [
      { name: 'id',           type: 'bigint',  pk: true },
      { name: 'admin_id',     type: 'bigint',  fk: true },
      { name: 'Name',         type: 'varchar'           },
      { name: 'address',      type: 'varchar'           },
      { name: 'phone_number', type: 'int'               },
      { name: 'company',      type: 'varchar'           },
      { name: 'Total_order',  type: 'text'              },
      { name: 'order_id',     type: 'bigint',  fk: true },
    ],
  },
  order_details: {
    id: 'order_details', label: 'order_details', color: '#5b8af5',
    x: 280, y: 545,
    fields: [
      { name: 'id',          type: 'bigint', pk: true },
      { name: 'order_date',  type: 'date'             },
      { name: 'purchase_id', type: 'bigint', fk: true },
    ],
  },
  new_ticket: {
    id: 'new_ticket', label: 'new_ticket', color: '#00c9a7',
    x: 780, y: 360,
    fields: [
      { name: 'id',           type: 'bigint',   pk: true },
      { name: 'subject',      type: 'varchar'            },
      { name: 'status',       type: 'varchar'            },
      { name: 'last_updated', type: 'datetime'           },
      { name: 'user_id',      type: 'bigint',   fk: true },
      { name: 'purchase_id',  type: 'bigint',   fk: true },
      { name: 'description',  type: 'text'               },
      { name: 'rate_chat',    type: 'int'                },
    ],
  },
  feedback: {
    id: 'feedback', label: 'feedback', color: '#4cd964',
    x: 450, y: 615,
    fields: [
      { name: 'id',                 type: 'bigint', pk: true },
      { name: 'user_id',            type: 'bigint', fk: true },
      { name: 'ratings_out_of_5',   type: 'bigint'           },
      { name: 'summary_advice_msg', type: 'text'             },
      { name: 'ticket_id',          type: 'bigint', fk: true },
    ],
  },
}

const RELATIONS = [
  { from: 'admin',        to: 'chat_admin_vs_user', fromField: 'id',          toField: 'admin_id',   label: '1:N' },
  { from: 'user',         to: 'chat_admin_vs_user', fromField: 'id',          toField: 'user_id',    label: '1:N' },
  { from: 'user',         to: 'new_ticket',         fromField: 'id',          toField: 'user_id',    label: '1:N' },
  { from: 'admin',        to: 'new_client',          fromField: 'id',          toField: 'admin_id',   label: '1:N' },
  { from: 'new_ticket',   to: 'chat_admin_vs_user',  fromField: 'id',          toField: 'ticket_id',  label: '1:N' },
  { from: 'new_ticket',   to: 'feedback',            fromField: 'id',          toField: 'ticket_id',  label: '1:N' },
  { from: 'user',         to: 'feedback',            fromField: 'id',          toField: 'user_id',    label: '1:N' },
  { from: 'order_details',to: 'new_client',          fromField: 'id',          toField: 'order_id',   label: '1:1' },
  { from: 'order_details',to: 'new_ticket',          fromField: 'purchase_id', toField: 'purchase_id',label: '1:N' },
]

// ─── Layout constants ─────────────────────────────────────────────────────────
const TW = 246   // table width
const FH = 29    // field row height
const HH = 40    // header height
const PB = 12    // bottom padding

const tableH = t => HH + t.fields.length * FH + PB

const fieldCY = (t, name) => {
  const i = t.fields.findIndex(f => f.name === name)
  return HH + (i < 0 ? 0 : i) * FH + FH / 2
}

// ─── Path routing ─────────────────────────────────────────────────────────────
function getSides(a, b) {
  const ac = a.x + TW / 2
  const bc = b.x + TW / 2
  if (a.x + TW + 24 < b.x) return { fx: a.x + TW, tx: b.x,       fs:  1, ts: -1 }
  if (b.x + TW + 24 < a.x) return { fx: a.x,       tx: b.x + TW, fs: -1, ts:  1 }
  if (ac < bc)              return { fx: a.x + TW, tx: b.x,       fs:  1, ts: -1 }
  return                           { fx: a.x,       tx: b.x + TW, fs: -1, ts:  1 }
}

function buildPath(fromT, toT, fromField, toField) {
  const fy = fromT.y + fieldCY(fromT, fromField)
  const ty = toT.y   + fieldCY(toT,   toField)
  const { fx, tx, fs, ts } = getSides(fromT, toT)
  const stub = 34, r = 11

  if (Math.abs(fy - ty) < 3) return `M ${fx} ${fy} L ${tx} ${ty}`

  const x1 = fx + fs * stub
  const x2 = tx + ts * stub
  const dy = ty > fy ? r : -r

  return [
    `M ${fx} ${fy}`,
    `L ${x1 - fs * r} ${fy}`,
    `Q ${x1} ${fy} ${x1} ${fy + dy}`,
    `L ${x1} ${ty - dy}`,
    `Q ${x1} ${ty} ${x1 + (x2 > x1 ? r : -r)} ${ty}`,
    `L ${x2 - (x2 > x1 ? r : -r)} ${ty}`,
    `Q ${x2} ${ty} ${x2} ${ty - dy}`,
    `L ${x2} ${fy + dy}`,
    `Q ${x2} ${fy} ${x2 - ts * r} ${fy}`,
    `L ${tx} ${ty}`,
  ].join(' ')
}

// ─── ERD markers ──────────────────────────────────────────────────────────────
function OneBar({ x, y, side }) {
  const d = side * 13
  return (
    <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <line x1={x + d * 0.30} y1={y - 7} x2={x + d * 0.30} y2={y + 7} />
      <line x1={x + d * 0.65} y1={y - 7} x2={x + d * 0.65} y2={y + 7} />
    </g>
  )
}

function CrowFoot({ x, y, side }) {
  const s = side * 15
  return (
    <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <line x1={x} y1={y}      x2={x + s} y2={y - 7} />
      <line x1={x} y1={y}      x2={x + s} y2={y}     />
      <line x1={x} y1={y}      x2={x + s} y2={y + 7} />
      <line x1={x + s} y1={y - 7} x2={x + s} y2={y + 7} />
    </g>
  )
}

// ─── Connector ────────────────────────────────────────────────────────────────
function Connector({ fromT, toT, rel, highlighted }) {
  const path  = buildPath(fromT, toT, rel.fromField, rel.toField)
  const sides = getSides(fromT, toT)
  const fy    = fromT.y + fieldCY(fromT, rel.fromField)
  const ty    = toT.y   + fieldCY(toT,   rel.toField)
  const color = highlighted ? (fromT.color || '#5b8af5') : 'rgba(255,255,255,0.13)'
  const sw    = highlighted ? 2.5 : 1.5
  const lx    = (sides.fx + sides.tx) / 2
  const ly    = Math.min(fy, ty) - 14

  return (
    <g color={color}>
      {/* Fat invisible hit area */}
      <path d={path} fill="none" stroke="transparent" strokeWidth={14} style={{ cursor: 'default' }} />
      {/* Visible line */}
      <path d={path} fill="none" stroke={color} strokeWidth={sw}
        strokeDasharray={highlighted ? 'none' : '7,5'}
        style={{ transition: 'stroke 0.18s, stroke-width 0.18s', pointerEvents: 'none' }}
      />
      {/* One marker on "from" side */}
      <OneBar x={sides.fx} y={fy} side={sides.fs} />
      {/* Many (crow's foot) or One on "to" side */}
      {rel.label === '1:N'
        ? <CrowFoot x={sides.tx} y={ty} side={sides.ts} />
        : <OneBar   x={sides.tx} y={ty} side={sides.ts} />
      }
      {/* Inline field label on hover */}
      {highlighted && (
        <g>
          <rect x={lx - 62} y={ly - 14} width={124} height={18} rx={5}
            fill="#1a1d2e" stroke={color} strokeWidth={0.8} opacity={0.96} />
          <text x={lx} y={ly} textAnchor="middle" fontSize={9.5}
            fontFamily="'JetBrains Mono',monospace" fill={color}
            style={{ pointerEvents: 'none' }}>
            {rel.fromField} → {rel.toField}
          </text>
        </g>
      )}
    </g>
  )
}

// ─── Table card ───────────────────────────────────────────────────────────────
function TableCard({ table, isActive, onDrag, onMouseEnter, onMouseLeave, onFieldHover }) {
  const h = tableH(table)

  const typeColor = t =>
    t === 'bigint' || t === 'int'        ? '#68d391' :
    t === 'varchar'                       ? '#f6ad55' :
    t === 'text'                          ? '#fc8181' :
    t === 'blob'                          ? '#f687b3' :
    t === 'datetime' || t === 'date'      ? '#b794f4' : '#9ae6b4'

  return (
    <g
      transform={`translate(${table.x},${table.y})`}
      style={{ cursor: isActive ? 'grabbing' : 'grab', userSelect: 'none' }}
      onMouseDown={e => onDrag(e, table.id)}
      onMouseEnter={() => onMouseEnter(table.id)}
      onMouseLeave={onMouseLeave}
    >
      {/* Drop shadow */}
      <rect x={5} y={6} width={TW} height={h} rx={13} fill="rgba(0,0,0,0.45)" />
      {/* Glow ring when active */}
      {isActive && (
        <rect x={-2} y={-2} width={TW + 4} height={h + 4} rx={15}
          fill="none" stroke={table.color} strokeWidth={2} opacity={0.4} />
      )}
      {/* Card body */}
      <rect x={0} y={0} width={TW} height={h} rx={13}
        fill="#141728"
        stroke={isActive ? table.color : 'rgba(255,255,255,0.065)'}
        strokeWidth={isActive ? 1.8 : 1}
      />
      {/* Header */}
      <rect x={0} y={0} width={TW} height={HH} rx={13} fill={table.color} />
      <rect x={0} y={HH - 13} width={TW} height={13} fill={table.color} />
      <text x={TW / 2} y={HH / 2 + 7}
        textAnchor="middle" fill="#fff"
        fontSize={12.5} fontWeight="700"
        fontFamily="'JetBrains Mono',monospace"
        style={{ letterSpacing: '0.2px' }}
      >{table.label}</text>

      {/* Fields */}
      {table.fields.map((f, i) => {
        const ry = HH + i * FH
        return (
          <g key={f.name}
            onMouseEnter={() => onFieldHover?.({ table: table.id, field: f.name, type: f.type, pk: f.pk, fk: f.fk })}
            onMouseLeave={() => onFieldHover?.(null)}
          >
            <rect x={1} y={ry} width={TW - 2} height={FH}
              fill={i % 2 === 0 ? 'rgba(255,255,255,0.022)' : 'transparent'} />
            {f.pk  && <text x={10} y={ry + 20} fontSize={11} fill="#f5c842" fontFamily="monospace">🔑</text>}
            {f.fk && !f.pk && <text x={10} y={ry + 20} fontSize={11} fill="#90cdf4" fontFamily="monospace">⬡</text>}
            {!f.pk && !f.fk && <text x={10} y={ry + 20} fontSize={11} fill="#253045" fontFamily="monospace">▸</text>}
            <text x={30} y={ry + 20} fontSize={11.5}
              fontFamily="'JetBrains Mono',monospace"
              fill={f.pk ? '#f5c842' : f.fk ? '#90cdf4' : '#d0d6e8'}
              fontWeight={f.pk ? '700' : '400'}
            >{f.name}</text>
            <text x={TW - 9} y={ry + 20} textAnchor="end"
              fontSize={10} fontFamily="'JetBrains Mono',monospace"
              fill={typeColor(f.type)}
            >{f.type}</text>
            <line x1={8} y1={ry + FH - 1} x2={TW - 8} y2={ry + FH - 1}
              stroke="rgba(255,255,255,0.03)" strokeWidth={1} />
          </g>
        )
      })}
    </g>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function SQLDiagram() {
  const [tables,    setTables]    = useState(INITIAL_TABLES)
  const [hovered,   setHovered]   = useState(null)
  const [active,    setActive]    = useState(null)
  const [fieldInfo, setFieldInfo] = useState(null)
  const [mouse,     setMouse]     = useState({ x: 0, y: 0 })
  const dragging = useRef(null)
  const svgRef   = useRef(null)
  const W = 1160, H = 890

  const startDrag = useCallback((e, id) => {
    e.preventDefault()
    const pt = svgRef.current.createSVGPoint()
    pt.x = e.clientX; pt.y = e.clientY
    const sp = pt.matrixTransform(svgRef.current.getScreenCTM().inverse())
    dragging.current = { id, offX: sp.x - tables[id].x, offY: sp.y - tables[id].y }
    setActive(id)
  }, [tables])

  const onMove = useCallback((e) => {
    setMouse({ x: e.clientX, y: e.clientY })
    if (!dragging.current) return
    const pt = svgRef.current.createSVGPoint()
    pt.x = e.clientX; pt.y = e.clientY
    const sp = pt.matrixTransform(svgRef.current.getScreenCTM().inverse())
    const { id, offX, offY } = dragging.current
    setTables(p => ({ ...p, [id]: { ...p[id], x: sp.x - offX, y: sp.y - offY } }))
  }, [])

  const onUp = useCallback(() => {
    dragging.current = null
    setActive(null)
  }, [])

  useEffect(() => {
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup',   onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup',   onUp)
    }
  }, [onMove, onUp])

  const LEGEND = [
    { c: '#f5c842', l: 'Primary Key'  },
    { c: '#90cdf4', l: 'Foreign Key'  },
    { c: '#68d391', l: 'bigint / int' },
    { c: '#f6ad55', l: 'varchar'      },
    { c: '#fc8181', l: 'text'         },
    { c: '#b794f4', l: 'date/time'    },
    { c: '#f687b3', l: 'blob'         },
  ]

  return (
    <div style={{
      background: 'linear-gradient(135deg,#0b0d1a 0%,#0f1228 55%,#090c18 100%)',
      minHeight: '100vh', padding: '20px 24px',
      fontFamily: "'JetBrains Mono','Fira Code',monospace",
    }}>

      {/* ── Top bar ── */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, flexWrap:'wrap', gap:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <div style={{
            width:44, height:44, borderRadius:12, flexShrink:0,
            background:'linear-gradient(135deg,#5b8af5,#7c5cfc)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:22, boxShadow:'0 4px 20px rgba(91,138,245,0.5)',
          }}>🗄️</div>
          <div>
            <div style={{ color:'#e8ecf8', fontSize:16, fontWeight:700, letterSpacing:'0.5px' }}>
              Suvidha CRM — Database Schema
            </div>
            <div style={{ color:'#2e3a55', fontSize:11, marginTop:4 }}>
              {Object.keys(tables).length} tables &nbsp;·&nbsp; {RELATIONS.length} relations &nbsp;·&nbsp;
              <span style={{ color:'#5b8af5' }}>drag</span> to rearrange &nbsp;·&nbsp;
              <span style={{ color:'#00c9a7' }}>hover</span> to highlight connections
            </div>
          </div>
        </div>
        <div style={{ display:'flex', gap:12, alignItems:'center', flexWrap:'wrap' }}>
          {LEGEND.map(({ c, l }) => (
            <div key={l} style={{ display:'flex', alignItems:'center', gap:5 }}>
              <div style={{ width:8, height:8, borderRadius:2, background:c, flexShrink:0 }} />
              <span style={{ color:'#3a4560', fontSize:10 }}>{l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── ERD notation legend ── */}
      <div style={{ display:'flex', gap:28, marginBottom:14, paddingLeft:2 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, color:'#2e3a55', fontSize:10.5 }}>
          <svg width={52} height={16} style={{ overflow:'visible' }}>
            <line x1={2}  y1={8} x2={50} y2={8}  stroke="#3a4560" strokeWidth={1.5} />
            <line x1={10} y1={2} x2={10} y2={14} stroke="#3a4560" strokeWidth={1.8} />
            <line x1={16} y1={2} x2={16} y2={14} stroke="#3a4560" strokeWidth={1.8} />
          </svg>
          one (1)
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8, color:'#2e3a55', fontSize:10.5 }}>
          <svg width={52} height={16} style={{ overflow:'visible' }}>
            <line x1={2}  y1={8} x2={36} y2={8}  stroke="#3a4560" strokeWidth={1.5} strokeDasharray="5,3" />
            <line x1={36} y1={2} x2={50} y2={8}  stroke="#3a4560" strokeWidth={1.8} />
            <line x1={36} y1={8} x2={50} y2={8}  stroke="#3a4560" strokeWidth={1.8} />
            <line x1={36} y1={14} x2={50} y2={8} stroke="#3a4560" strokeWidth={1.8} />
            <line x1={50} y1={2} x2={50} y2={14} stroke="#3a4560" strokeWidth={1.8} />
          </svg>
          many (N)
        </div>
      </div>

      {/* ── Canvas ── */}
      <div style={{
        border:'1px solid rgba(255,255,255,0.06)',
        borderRadius:18, overflow:'hidden',
        background:'radial-gradient(ellipse at 22% 18%,rgba(91,138,245,0.07) 0%,transparent 62%), #0b0d1a',
        boxShadow:'0 28px 90px rgba(0,0,0,0.65)',
      }}>
        <svg ref={svgRef} width="100%" viewBox={`0 0 ${W} ${H}`}
          style={{ display:'block', maxHeight:'82vh' }}>
          <defs>
            <pattern id="grid" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="0.9" fill="rgba(255,255,255,0.045)" />
            </pattern>
          </defs>
          <rect width={W} height={H} fill="url(#grid)" />

          {/* Relations — behind tables */}
          {RELATIONS.map((rel, i) => {
            const fromT = tables[rel.from]
            const toT   = tables[rel.to]
            if (!fromT || !toT) return null
            return (
              <Connector key={i}
                fromT={fromT} toT={toT} rel={rel}
                highlighted={hovered === rel.from || hovered === rel.to}
              />
            )
          })}

          {/* Tables — above relations */}
          {Object.values(tables).map(t => (
            <TableCard key={t.id} table={t}
              isActive={active === t.id || hovered === t.id}
              onDrag={startDrag}
              onMouseEnter={setHovered}
              onMouseLeave={() => setHovered(null)}
              onFieldHover={setFieldInfo}
            />
          ))}
        </svg>
      </div>

      <div style={{ textAlign:'center', color:'#1a2035', fontSize:10, marginTop:10, letterSpacing:'0.6px' }}>
        Hover a table to highlight its relations &nbsp;·&nbsp; Drag to rearrange &nbsp;·&nbsp;
        Double bar = one &nbsp;·&nbsp; Crow's foot = many
      </div>

      {/* ── Field tooltip ── */}
      {fieldInfo && (
        <div style={{
          position:'fixed', zIndex:1000,
          left: mouse.x + 16, top: mouse.y - 10,
          background:'#1a1d2e',
          border:`1px solid ${fieldInfo.pk ? '#f5c842' : fieldInfo.fk ? '#90cdf4' : 'rgba(255,255,255,0.12)'}`,
          borderRadius:8, padding:'8px 12px',
          fontFamily:"'JetBrains Mono',monospace",
          fontSize:11, color:'#d8dde8',
          pointerEvents:'none',
          boxShadow:'0 8px 24px rgba(0,0,0,0.5)',
        }}>
          <div style={{ color: fieldInfo.pk ? '#f5c842' : fieldInfo.fk ? '#90cdf4' : '#d0d6e8', fontWeight:700, marginBottom:4 }}>
            {fieldInfo.pk ? '🔑' : fieldInfo.fk ? '⬡' : '▸'} {fieldInfo.field}
          </div>
          <div style={{ color:'#3a4560', fontSize:10 }}>
            type:{' '}
            <span style={{ color:
              fieldInfo.type === 'bigint' || fieldInfo.type === 'int' ? '#68d391' :
              fieldInfo.type === 'varchar' ? '#f6ad55' :
              fieldInfo.type === 'text'    ? '#fc8181' :
              fieldInfo.type === 'blob'    ? '#f687b3' : '#b794f4'
            }}>{fieldInfo.type}</span>
          </div>
          {fieldInfo.pk && <div style={{ color:'#f5c842', fontSize:10, marginTop:3 }}>PRIMARY KEY</div>}
          {fieldInfo.fk && <div style={{ color:'#90cdf4', fontSize:10, marginTop:3 }}>FOREIGN KEY</div>}
        </div>
      )}
    </div>
  )
}
