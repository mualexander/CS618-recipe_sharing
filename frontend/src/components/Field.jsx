import { useId } from 'react'

// Label + input + error message. Pass `as="textarea"` for multi-line fields.
export function Field({ label, error, hint, as: Component = 'input', ...props }) {
  const id = useId()
  return (
    <div className={`field ${error ? 'has-error' : ''}`}>
      <label htmlFor={id}>{label}</label>
      <Component id={id} aria-invalid={Boolean(error)} {...props} />
      {error ? <p className="field-error">{error}</p> : hint && <p className="hint">{hint}</p>}
    </div>
  )
}
