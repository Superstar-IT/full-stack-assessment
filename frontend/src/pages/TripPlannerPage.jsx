import { EldLog } from '../components/eld/EldLog'
import { MapView } from '../components/map/MapView'
import { RestStopsList } from '../components/trip/RestStopsList'
import { TripPlanForm } from '../components/trip/TripPlanForm'
import { TripRouteStats } from '../components/trip/TripRouteStats'
import { useTripPlannerForm } from '../hooks/useTripPlannerForm'

export function TripPlannerPage() {
  const planning = useTripPlannerForm()
  const currentLocation = planning.watch('current_location')
  const dropoffLocation = planning.watch('dropoff_location')
  const cycleUsed = planning.watch('current_cycle_used_hrs')

  return (
    <>
      <section className="row">
        <TripPlanForm planning={planning} />
        <div className="card grow">
          <h2>Route &amp; map</h2>
          <TripRouteStats result={planning.planResult} />
          <MapView result={planning.planResult} />
        </div>
      </section>

      {planning.planResult && (
        <section className="section">
          <h2>Rests &amp; HOS (scheduled)</h2>
          <RestStopsList result={planning.planResult} />
        </section>
      )}

      <section className="section eld">
        <h2>Driver&apos;s daily log</h2>
        <EldLog
          result={planning.planResult}
          routeFrom={currentLocation}
          routeTo={dropoffLocation}
          cycleUsedHrs={
            typeof cycleUsed === 'number' && Number.isFinite(cycleUsed)
              ? cycleUsed
              : Number(cycleUsed) || 0
          }
        />
      </section>
    </>
  )
}
