export function FieldError({ id, message }) {
  if (!message) return null
  return (
    <p className="field-err" id={id} role="alert">
      {message}
    </p>
  )
}
