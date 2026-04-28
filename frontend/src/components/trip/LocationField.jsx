import { Controller } from 'react-hook-form'
import { FieldError } from '../ui/FieldError'
import { LocationAutocomplete } from './LocationAutocomplete'

/**
 * Label + debounced location autocomplete + FieldError (react-hook-form Controller).
 */
export function LocationField({
  name,
  control,
  rules,
  label,
  placeholder,
  autoComplete,
}) {
  const errId = `err-${name}`
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState }) => (
        <>
          <label className={fieldState.error ? 'has-field-err' : ''}>
            {label}
            <LocationAutocomplete
              field={field}
              invalid={!!fieldState.error}
              ariaDescribedby={fieldState.error ? errId : undefined}
              autoComplete={autoComplete}
              placeholder={placeholder}
            />
          </label>
          <FieldError id={errId} message={fieldState.error?.message} />
        </>
      )}
    />
  )
}
