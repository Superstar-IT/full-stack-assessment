import { FieldError } from '../ui/FieldError'
import { LocationField } from './LocationField'
import { cycleRules, locationRules, timeZoneRules, tripStartRules } from './tripFieldRules'

/**
 * Trip inputs: locations (autocomplete), HOS cycle, time zone, optional trip start.
 */
export function TripPlanForm({ planning }) {
  const {
    register,
    control,
    formState: { errors },
    submitTripPlan,
    bannerError,
    submitting,
  } = planning

  const msg = (name) => errors[name]?.message

  return (
    <form className="card" onSubmit={submitTripPlan} noValidate>
      <LocationField
        name="current_location"
        control={control}
        rules={locationRules.current_location}
        label="Current location"
        placeholder="Search address or place…"
        autoComplete="street-address"
      />
      <LocationField
        name="pickup_location"
        control={control}
        rules={locationRules.pickup_location}
        label="Pickup location"
        placeholder="Search pickup address…"
      />
      <LocationField
        name="dropoff_location"
        control={control}
        rules={locationRules.dropoff_location}
        label="Dropoff location"
        placeholder="Search dropoff address…"
      />

      <label className={msg('current_cycle_used_hrs') ? 'has-field-err' : ''}>
        Current cycle used (hrs, 0–70)
        <input
          type="number"
          min={0}
          max={70}
          step={0.1}
          aria-invalid={!!msg('current_cycle_used_hrs')}
          aria-describedby={msg('current_cycle_used_hrs') ? 'err-current_cycle_used_hrs' : undefined}
          {...register('current_cycle_used_hrs', cycleRules)}
        />
        <FieldError id="err-current_cycle_used_hrs" message={msg('current_cycle_used_hrs')} />
      </label>

      <label className={msg('time_zone') ? 'has-field-err' : ''}>
        IANA time zone
        <input
          placeholder="America/Chicago"
          aria-invalid={!!msg('time_zone')}
          aria-describedby={msg('time_zone') ? 'err-time_zone' : undefined}
          {...register('time_zone', timeZoneRules)}
        />
        <FieldError id="err-time_zone" message={msg('time_zone')} />
      </label>

      <label className={msg('trip_start') ? 'has-field-err' : ''}>
        Trip start (optional) — your device local time; if empty, default 6:00 in the time zone above
        <input
          type="datetime-local"
          step={60}
          aria-invalid={!!msg('trip_start')}
          aria-describedby={msg('trip_start') ? 'err-trip_start' : undefined}
          {...register('trip_start', tripStartRules)}
        />
        <FieldError id="err-trip_start" message={msg('trip_start')} />
      </label>

      {bannerError && <div className="err">{bannerError}</div>}
      <button type="submit" disabled={submitting} className="primary">
        {submitting ? 'Planning…' : 'Route & ELD'}
      </button>
    </form>
  )
}
