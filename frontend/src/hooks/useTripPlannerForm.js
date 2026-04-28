import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { postTripPlan } from '../api/tripPlanApi'
import { TRIP_FORM_DEFAULTS } from '../constants/tripFormDefaults'
import { buildTripPayload } from '../utils/tripPayload'

export function useTripPlannerForm() {
  const [planResult, setPlanResult] = useState(null)
  const [bannerError, setBannerError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const form = useForm({
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: TRIP_FORM_DEFAULTS,
  })

  const { handleSubmit, setError } = form

  const onValid = async (values) => {
    setBannerError(null)
    setSubmitting(true)
    try {
      const payload = buildTripPayload(values)
      const data = await postTripPlan(payload)
      setPlanResult(data)
    } catch (e) {
      const fe = e.fieldErrors || {}
      Object.entries(fe).forEach(([name, msg]) => {
        setError(name, { type: 'server', message: msg })
      })
      const keys = Object.keys(fe)
      if (keys.length === 0) setBannerError(e.message || 'Something went wrong.')
      else if (keys.length > 1) setBannerError('Please fix the highlighted fields.')
      else setBannerError(null)
      setPlanResult(null)
    } finally {
      setSubmitting(false)
    }
  }

  return {
    ...form,
    planResult,
    bannerError,
    submitting,
    submitTripPlan: handleSubmit(onValid),
  }
}
