const STATUS_ROWS = [
  { st: 1, num: '1', label: 'Off Duty' },
  { st: 2, num: '2', label: 'Sleeper Berth' },
  { st: 3, num: '3', label: 'Driving' },
  { st: 4, num: '4', label: 'On Duty (not driving)' },
]

const HOUR_LABELS = [
  'Midnight',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  '11',
  'Noon',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  '11',
  'Midnight',
]

const M_PER_UNIT = 1
const LEFT = 100
const GRID_W = 1440
const RIGHT = 48
const TBAR = 22
const R_H = 28
const GAP = 1

/** FMCSA Driver's Guide palette (navy header, medium blue headings, blue graph trace) */
const FMCSA = {
  navy: '#002d62',
  blue: '#0079c1',
  headerWash: '#e1f0f7',
  gridBg: '#ffffff',
}

const fill = (st) => {
  switch (st) {
    case 1:
      return '#d5e8f5'
    case 2:
      return '#8fc4e8'
    case 3:
      return FMCSA.blue
    case 4:
      return '#005a97'
    default:
      return '#7eb3dd'
  }
}

function fmtTime(m) {
  const t = ((m % 1440) + 1440) % 1440
  const h = Math.floor(t / 60)
  const mm = t % 60
  return `${h % 12 || 12}:${mm.toString().padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`
}

function rowTotalsMin(segments) {
  const m = { 1: 0, 2: 0, 3: 0, 4: 0 }
  for (const s of segments) {
    if (s.st >= 1 && s.st <= 4) {
      m[s.st] += Math.max(0, s.b - s.a)
    }
  }
  return m
}

function fmtHours(mins) {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (m === 0) return `${h}`
  return `${h}:${m.toString().padStart(2, '0')}`
}

function GraphGrid({ day }) {
  const totals = rowTotalsMin(day.segments || [])
  const svgW = LEFT + GRID_W + RIGHT
  const svgH = TBAR + STATUS_ROWS.length * R_H + 8
  const bottom = TBAR + STATUS_ROWS.length * R_H

  return (
    <svg
      className="paper-log__svg"
      viewBox={`0 0 ${svgW} ${svgH}`}
      role="img"
      aria-label={`24-hour grid for ${day.date}`}
      preserveAspectRatio="xMidYMin meet"
    >
      {/* Hour labels: navy band (FMCSA guide header style); Total column — light blue */}
      <rect x={LEFT} y={0} width={GRID_W} height={TBAR - 2} fill={FMCSA.navy} />
      <rect
        x={LEFT + GRID_W}
        y={0}
        width={RIGHT}
        height={TBAR - 2}
        fill={FMCSA.headerWash}
        stroke={FMCSA.navy}
        strokeWidth={1}
      />
      <text
        x={LEFT + GRID_W + RIGHT / 2}
        y={14}
        textAnchor="middle"
        fill={FMCSA.navy}
        fontSize={8}
        fontFamily="Arial, sans-serif"
        fontWeight={700}
      >
        Total
        <tspan x={LEFT + GRID_W + RIGHT / 2} dy={10} fontWeight={600}>
          Hours
        </tspan>
      </text>
      {HOUR_LABELS.map((lab, hi) => {
        const cx = hi < 24 ? LEFT + hi * 60 + 30 : LEFT + GRID_W - 28
        return (
          <text
            key={hi}
            x={cx}
            y={14}
            textAnchor="middle"
            fill="#fff"
            fontSize={lab === 'Midnight' || lab === 'Noon' ? 7.5 : 8.5}
            fontFamily="Arial, sans-serif"
          >
            {lab}
          </text>
        )
      })}

      {STATUS_ROWS.map((row, ri) => {
        const y0 = TBAR + ri * R_H + GAP
        const y1 = TBAR + (ri + 1) * R_H - GAP

        return (
          <g key={row.st}>
            <rect x={0} y={y0 - 2} width={LEFT - 6} height={y1 - y0 + 4} fill="#fff" stroke={FMCSA.navy} strokeWidth={1} />
            <text x={8} y={y0 + (y1 - y0) * 0.72} fontSize={10} fontFamily="Arial, sans-serif" fill={FMCSA.navy}>
              <tspan fontWeight={700}>{row.num}.</tspan>
              <tspan> </tspan>
              <tspan>{row.label}</tspan>
            </text>

            <rect x={LEFT} y={y0} width={GRID_W} height={y1 - y0} fill={FMCSA.gridBg} stroke="#000" strokeWidth={1} />

            {Array.from({ length: 24 * 4 + 1 }, (_, i) => {
              const xm = i * 15
              const x = LEFT + xm * M_PER_UNIT
              const isHour = xm % 60 === 0
              return (
                <line
                  key={`v-${ri}-${i}`}
                  x1={x}
                  y1={y0}
                  x2={x}
                  y2={y1}
                  stroke="#000"
                  strokeWidth={isHour ? 1 : 0.35}
                  opacity={isHour ? 1 : 0.55}
                />
              )
            })}

            {(day.segments || []).map((s, j) => {
              if (s.st !== row.st || s.b <= s.a) return null
              const xa = LEFT + s.a * M_PER_UNIT
              const w = Math.max(M_PER_UNIT * 0.5, (s.b - s.a) * M_PER_UNIT)
              return (
                <rect
                  key={`b-${row.st}-${j}-${s.a}`}
                  x={xa}
                  y={y0 + 2}
                  width={w}
                  height={y1 - y0 - 4}
                  fill={fill(s.st)}
                  opacity={1}
                  stroke={FMCSA.navy}
                  strokeWidth={0.5}
                >
                  <title>
                    {s.st_name} · {fmtTime(s.a)}–{fmtTime(s.b)}
                    {s.label ? ` · ${s.label}` : ''}
                  </title>
                </rect>
              )
            })}

            <rect x={LEFT + GRID_W} y={y0} width={RIGHT} height={y1 - y0} fill={FMCSA.headerWash} stroke={FMCSA.navy} strokeWidth={1} />
            <text
              x={LEFT + GRID_W + RIGHT / 2}
              y={(y0 + y1) / 2 + 4}
              textAnchor="middle"
              fontSize={11}
              fontFamily="Arial, sans-serif"
              fill={FMCSA.navy}
              fontWeight={600}
            >
              {fmtHours(totals[row.st])}
            </text>
          </g>
        )
      })}

      <line x1={LEFT} y1={0} x2={LEFT} y2={bottom} stroke={FMCSA.navy} strokeWidth={2} />
      <line x1={LEFT + GRID_W} y1={TBAR} x2={LEFT + GRID_W} y2={bottom} stroke={FMCSA.navy} strokeWidth={1} />
      <line x1={LEFT + GRID_W + RIGHT} y1={TBAR} x2={LEFT + GRID_W + RIGHT} y2={bottom} stroke={FMCSA.navy} strokeWidth={1} />
      <line x1={LEFT} y1={bottom} x2={LEFT + GRID_W + RIGHT} y2={bottom} stroke={FMCSA.navy} strokeWidth={2} />
    </svg>
  )
}

function Recap({ day, cycleUsedHrs }) {
  const totals = rowTotalsMin(day.segments || [])
  const driving = totals[3]
  const onDutyNd = totals[4]
  const onDutyToday = driving + onDutyNd
  const hrsToday = onDutyToday / 60

  const a70 = typeof cycleUsedHrs === 'number' ? cycleUsedHrs + hrsToday : null
  const avail70 = a70 != null ? Math.max(0, 70 - a70) : null
  const a60 = typeof cycleUsedHrs === 'number' ? cycleUsedHrs + hrsToday : null
  const avail60 = a60 != null ? Math.max(0, 60 - a60) : null

  return (
    <div className="paper-log__recap">
      <div className="paper-log__recap-note">
        <strong>Recap: Complete at end of day</strong>
        <span>On duty hours today, Total lines 3 &amp; 4: {(hrsToday).toFixed(2)}</span>
      </div>
      <table className="paper-log__recap-table">
        <thead>
          <tr>
            <th className="paper-log__recap-corner" />
            <th colSpan={3}>70 Hour / 8 Day Drivers</th>
            <th colSpan={3}>60 Hour / 7 Day Drivers</th>
          </tr>
          <tr>
            <th />
            <th>A</th>
            <th>B</th>
            <th>C</th>
            <th>A</th>
            <th>B</th>
            <th>C</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row" className="paper-log__recap-lead">
              Estimate*
            </th>
            <td>{a70 != null ? a70.toFixed(1) : '—'}</td>
            <td>{avail70 != null ? avail70.toFixed(1) : '—'}</td>
            <td>—</td>
            <td>{a60 != null ? a60.toFixed(1) : '—'}</td>
            <td>{avail60 != null ? avail60.toFixed(1) : '—'}</td>
            <td>—</td>
          </tr>
        </tbody>
      </table>
      <ul className="paper-log__recap-legend">
        <li>
          <strong>A</strong> — Total hours on duty last 7 or 8 days including today (approx.: cycle used + today lines 3 &amp; 4).
        </li>
        <li>
          <strong>B</strong> — Hours available tomorrow (70 or 60 minus A). If you took 34 consecutive hours off duty you have a full 60/70 available.
        </li>
        <li>
          <strong>C</strong> — Per paper log (7-day field); not computed in this demo.
        </li>
      </ul>
    </div>
  )
}

function PaperDay({ day, routeFrom, routeTo, milesTotal, cycleUsedHrs }) {
  const [y, mo, da] = day.date.split('-')
  const remarks =
    'Trip planned via app; times use home-terminal time zone. Changes of duty status at locations along route per simulation.'

  return (
    <article className="paper-log">
      <header className="paper-log__title-row">
        <h2 className="paper-log__main-title">Drivers Daily Log (24 hours)</h2>
        <p className="paper-log__dup">
          Original — File at home terminal. Duplicate — Driver retains in his/her possession for 8 days.
        </p>
      </header>

      <div className="paper-log__date-row">
        <span className="paper-log__date-label">Date</span>
        <span className="paper-log__date-box">
          (month) <strong>{mo}</strong>
        </span>
        <span className="paper-log__date-box">
          (day) <strong>{da}</strong>
        </span>
        <span className="paper-log__date-box">
          (year) <strong>{y}</strong>
        </span>
      </div>

      <div className="paper-log__route-block">
        <label className="paper-log__field paper-log__field--full">
          <span>From:</span>
          <span className="paper-log__line">{routeFrom || '—'}</span>
        </label>
        <label className="paper-log__field paper-log__field--full">
          <span>To:</span>
          <span className="paper-log__line">{routeTo || '—'}</span>
        </label>
      </div>

      <div className="paper-log__meta-grid">
        <div className="paper-log__meta-left">
          <div className="paper-log__twins">
            <div className="paper-log__box paper-log__box--small">
              <span>Total Miles Driving Today</span>
              <strong>{milesTotal != null ? Math.round(milesTotal) : '—'}</strong>
            </div>
            <div className="paper-log__box paper-log__box--small">
              <span>Total Mileage Today</span>
              <strong>{milesTotal != null ? Math.round(milesTotal) : '—'}</strong>
            </div>
          </div>
          <div className="paper-log__box paper-log__box--tall">
            <span>Truck/Tractor and Trailer Numbers or License Plate(s)/State (show each unit)</span>
            <span className="paper-log__placeholder">—</span>
          </div>
        </div>
        <div className="paper-log__meta-right">
          <label className="paper-log__field">
            <span>Name of Carrier or Carriers</span>
            <span className="paper-log__line">Trip plan (assessment)</span>
          </label>
          <label className="paper-log__field">
            <span>Main Office Address</span>
            <span className="paper-log__line">—</span>
          </label>
          <label className="paper-log__field">
            <span>Home Terminal Address</span>
            <span className="paper-log__line">—</span>
          </label>
        </div>
      </div>

      <div className="paper-log__graph">
        <GraphGrid day={day} />
      </div>

      <div className="paper-log__remarks-block">
        <h3 className="paper-log__remarks-title">Remarks</h3>
        <div className="paper-log__remarks-inner">
          <div className="paper-log__ship-labels">
            <div>Shipping Documents:</div>
            <div>DVL or Manifest No. or</div>
            <div>Shipper &amp; Commodity</div>
          </div>
          <div className="paper-log__remarks-lines">
            <p className="paper-log__remarks-text">{remarks}</p>
            <p className="paper-log__remarks-instruct">
              Enter name of place you reported and where released from work and when and where each change of duty occurred. Use time standard of home terminal.
            </p>
          </div>
        </div>
      </div>

      <Recap day={day} cycleUsedHrs={cycleUsedHrs} />
    </article>
  )
}

export function EldLog({ result, routeFrom, routeTo, cycleUsedHrs }) {
  if (!result?.daily_logs?.length) {
    return <p className="muted">Plan a trip to generate daily log sheets.</p>
  }

  const miles = result.total_distance_miles

  return (
    <div className="paper-log-stack">
      {result.daily_logs.map((d, i) => (
        <PaperDay
          key={`${d.date}-${i}`}
          day={d}
          routeFrom={routeFrom}
          routeTo={routeTo}
          milesTotal={i === 0 ? miles : undefined}
          cycleUsedHrs={cycleUsedHrs}
        />
      ))}
    </div>
  )
}
