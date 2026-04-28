/** Summary stats under “Route & map” after a successful plan. */
export function TripRouteStats({ result }) {
  if (!result) return null
  const l = result.legs || {}
  return (
    <div className="stats">
      <p>
        <span className="stat-label">To pickup</span> {l.to_pickup_miles?.toFixed(0)} mi ·{' '}
        {Math.round(l.to_pickup_minutes)} min drive
      </p>
      <p>
        <span className="stat-label">To dropoff</span> {l.to_drop_miles?.toFixed(0)} mi ·{' '}
        {Math.round(l.to_drop_minutes)} min drive
      </p>
      <p>
        <span className="stat-label">Total (road only)</span> {result.total_distance_miles?.toFixed(0)} mi ·{' '}
        {result.total_drive_minutes} min drive
      </p>
    </div>
  )
}
