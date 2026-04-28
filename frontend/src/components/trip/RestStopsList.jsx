/** Planned long off-duty / sleeper segments for display. */
export function RestStopsList({ result }) {
  if (!result?.rest_stops?.length) {
    return (
      <p className="muted small">Planned off-duty periods (HOS) appear here for longer runs.</p>
    )
  }
  return (
    <ul className="rest-list">
      {result.rest_stops.map((r, i) => (
        <li key={i}>
          <strong>{r.label}</strong> — {r.duration_h.toFixed(1)}h ({r.t0_min}–{r.t1_min} min on trip)
        </li>
      ))}
    </ul>
  )
}
