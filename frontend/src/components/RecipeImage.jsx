import { useState } from 'react'

// Shows the recipe image, or a neutral placeholder if missing or broken.
export function RecipeImage({ src, alt, className = '' }) {
  const [failedSrc, setFailedSrc] = useState(null)
  if (!src || failedSrc === src) {
    return (
      <div className={`recipe-image placeholder ${className}`} aria-hidden="true">
        <span>🍽</span>
      </div>
    )
  }
  return (
    <img
      className={`recipe-image ${className}`}
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailedSrc(src)}
    />
  )
}
