import { useState } from 'react'
import { Field } from './Field.jsx'
import { RecipeImage } from './RecipeImage.jsx'

const newRow = (data = {}) => ({ key: crypto.randomUUID(), name: '', quantity: '', ...data })

function toFormState(recipe) {
  return {
    title: recipe?.title ?? '',
    description: recipe?.description ?? '',
    imageUrl: recipe?.imageUrl ?? '',
    instructions: recipe?.instructions ?? '',
    tags: recipe?.tags?.join(', ') ?? '',
    ingredients: recipe?.ingredients?.length
      ? recipe.ingredients.map((i) => newRow({ name: i.name, quantity: i.quantity ?? '' }))
      : [newRow(), newRow()],
  }
}

function toPayload(form) {
  return {
    title: form.title.trim(),
    description: form.description.trim(),
    imageUrl: form.imageUrl.trim(),
    instructions: form.instructions.trim(),
    tags: form.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean),
    ingredients: form.ingredients
      .filter((i) => i.name.trim() || i.quantity.trim())
      .map((i) => ({ name: i.name.trim(), quantity: i.quantity.trim() })),
  }
}

// Client-side checks mirror the server's rules so most mistakes are caught
// before submitting. The server remains the source of truth.
function validate(payload) {
  const errors = {}
  if (!payload.title) errors.title = 'title is required'
  if (payload.ingredients.length === 0) errors.ingredients = 'add at least one ingredient'
  payload.ingredients.forEach((i, idx) => {
    if (!i.name) errors[`ingredients.${idx}.name`] = 'name is required'
  })
  if (payload.imageUrl && !/^https?:\/\/\S+$/i.test(payload.imageUrl)) {
    errors.imageUrl = 'must be a valid http(s) URL'
  }
  if (payload.tags.length > 10) errors.tags = 'at most 10 tags'
  return errors
}

export function RecipeForm({ initialRecipe, submitLabel, onSubmit, isSubmitting, serverError }) {
  const [form, setForm] = useState(() => toFormState(initialRecipe))
  const [clientErrors, setClientErrors] = useState({})
  // Fields edited since the last submit; their errors are hidden until resubmitted.
  const [edited, setEdited] = useState(() => new Set())

  // Map server field errors (e.g. "ingredients.0.name") onto the visible rows.
  // Server indexes refer to the filtered payload, so translate them back.
  const filledRows = form.ingredients.filter((i) => i.name.trim() || i.quantity.trim())
  const allErrors = { ...(serverError?.fields ?? {}), ...clientErrors }
  const errors = Object.fromEntries(
    Object.entries(allErrors).filter(([path]) => !edited.has(path.split('.')[0]) && !edited.has(path)),
  )
  const rowError = (row) => {
    const idx = filledRows.indexOf(row)
    return idx >= 0 ? errors[`ingredients.${idx}.name`] : undefined
  }

  const markEdited = (...paths) => setEdited((prev) => new Set([...prev, ...paths]))
  const set = (field) => (e) => {
    markEdited(field)
    setForm((f) => ({ ...f, [field]: e.target.value }))
  }
  const setRow = (key, field, value) => {
    markEdited('ingredients')
    setForm((f) => ({
      ...f,
      ingredients: f.ingredients.map((r) => (r.key === key ? { ...r, [field]: value } : r)),
    }))
  }
  const addRow = () => setForm((f) => ({ ...f, ingredients: [...f.ingredients, newRow()] }))
  const removeRow = (key) =>
    setForm((f) => ({
      ...f,
      ingredients: f.ingredients.length > 1 ? f.ingredients.filter((r) => r.key !== key) : f.ingredients,
    }))
  const moveRow = (key, delta) =>
    setForm((f) => {
      const rows = [...f.ingredients]
      const i = rows.findIndex((r) => r.key === key)
      const j = i + delta
      if (j < 0 || j >= rows.length) return f
      ;[rows[i], rows[j]] = [rows[j], rows[i]]
      return { ...f, ingredients: rows }
    })

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = toPayload(form)
    const found = validate(payload)
    setClientErrors(found)
    setEdited(new Set())
    if (Object.keys(found).length === 0) onSubmit(payload)
  }

  return (
    <form className="recipe-form" onSubmit={handleSubmit} noValidate>
      {serverError && Object.keys(serverError.fields ?? {}).length === 0 && (
        <p className="error banner">{serverError.message}</p>
      )}

      <div className="form-grid">
        <div className="form-main">
          <Field
            label="Title"
            value={form.title}
            onChange={set('title')}
            maxLength={120}
            error={errors.title}
            placeholder="Grandma's banana bread"
            autoFocus={!initialRecipe}
          />
          <Field
            label="Short description"
            as="textarea"
            rows={2}
            value={form.description}
            onChange={set('description')}
            maxLength={2000}
            error={errors.description}
            placeholder="What makes it special?"
          />

          <fieldset className={`ingredients ${errors.ingredients ? 'has-error' : ''}`}>
            <legend>Ingredients</legend>
            {form.ingredients.map((row, idx) => (
              <div className="ingredient-row" key={row.key}>
                <input
                  aria-label={`Ingredient ${idx + 1} quantity`}
                  className="qty"
                  placeholder="Qty"
                  value={row.quantity}
                  maxLength={60}
                  onChange={(e) => setRow(row.key, 'quantity', e.target.value)}
                />
                <div className="ingredient-name">
                  <input
                    aria-label={`Ingredient ${idx + 1} name`}
                    placeholder="Ingredient"
                    value={row.name}
                    maxLength={120}
                    aria-invalid={Boolean(rowError(row))}
                    onChange={(e) => setRow(row.key, 'name', e.target.value)}
                  />
                  {rowError(row) && <p className="field-error">{rowError(row)}</p>}
                </div>
                <div className="row-actions">
                  <button type="button" className="icon" title="Move up" onClick={() => moveRow(row.key, -1)} disabled={idx === 0}>
                    ↑
                  </button>
                  <button
                    type="button"
                    className="icon"
                    title="Move down"
                    onClick={() => moveRow(row.key, 1)}
                    disabled={idx === form.ingredients.length - 1}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="icon"
                    title="Remove"
                    onClick={() => removeRow(row.key)}
                    disabled={form.ingredients.length === 1}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
            {errors.ingredients && <p className="field-error">{errors.ingredients}</p>}
            <button type="button" className="secondary small" onClick={addRow}>
              + Add ingredient
            </button>
          </fieldset>

          <Field
            label="Instructions"
            as="textarea"
            rows={8}
            value={form.instructions}
            onChange={set('instructions')}
            error={errors.instructions}
            placeholder={'1. Preheat the oven…\n2. …'}
          />
        </div>

        <aside className="form-side">
          <Field
            label="Image URL"
            type="url"
            value={form.imageUrl}
            onChange={set('imageUrl')}
            error={errors.imageUrl}
            placeholder="https://…"
            hint="Paste a link to a photo of the dish."
          />
          <RecipeImage src={form.imageUrl.trim()} alt="Preview" className="preview" />
          <Field
            label="Tags"
            value={form.tags}
            onChange={set('tags')}
            error={errors.tags}
            placeholder="breakfast, vegetarian"
            hint="Comma-separated, up to 10."
          />
        </aside>
      </div>

      <div className="form-actions">
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  )
}
