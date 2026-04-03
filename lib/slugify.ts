import slugifyLib from 'slugify'

export function slugify(text: string): string {
  return slugifyLib(text, {
    lower: true,
    strict: true,
    trim: true,
  })
}

export function generateProductSlug(name: string, model?: string | null): string {
  const base = model ? `${name}-${model}` : name
  return slugify(base)
}
