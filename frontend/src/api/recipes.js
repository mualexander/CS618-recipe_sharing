const BASE = '/api/v1/recipes'

async function request(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `request failed: ${res.status}`)
  }
  return res.status === 204 ? null : res.json()
}

export const getRecipes = () => request(BASE)

export const createRecipe = (recipe) =>
  request(BASE, { method: 'POST', body: JSON.stringify(recipe) })

export const deleteRecipe = (id) => request(`${BASE}/${id}`, { method: 'DELETE' })
