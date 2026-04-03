interface SeoContentOptions {
  name: string
  model?: string | null
  brand?: string | null
  specifications?: Record<string, string> | null
  description?: string | null
  siteName?: string
}

/**
 * Generate SEO-optimized meta title
 * Pattern: "{Brand} {Model} - {ProductName} | {SiteName}"
 * Max length: 60 characters (Google cutoff)
 */
export function generateMetaTitle(options: SeoContentOptions): string {
  const { model, brand, name, siteName = 'Industrial Parts Co.' } = options

  let title = ''

  if (brand && model) {
    title = `${brand} ${model} - ${name}`
  } else if (model) {
    title = `${model} - ${name}`
  } else if (brand) {
    title = `${brand} ${name}`
  } else {
    title = name
  }

  // Ensure it fits within SEO best practices (50-60 chars)
  const maxLen = 60
  if (title.length > maxLen) {
    // Truncate with ellipsis but keep key info
    title = title.substring(0, maxLen - 3) + '...'
  }

  return `${title} | ${siteName}`
}

/**
 * Generate SEO-optimized meta description
 * Pattern: 150-160 chars with key specs and keywords
 */
export function generateMetaDescription(options: SeoContentOptions): string {
  const { brand, model, name, specifications, description, siteName = 'Industrial Parts Co.' } = options

  const parts: string[] = []

  // Lead with brand/model for authority
  if (brand && model) {
    parts.push(`${brand} ${model}`)
  } else if (brand) {
    parts.push(brand)
  } else if (model) {
    parts.push(`Model ${model}`)
  }

  // Add key specification if available
  if (specifications) {
    const voltage = specifications['Voltage'] || specifications['voltage']
    const display = specifications['Display'] || specifications['display']
    const power = specifications['Power'] || specifications['power']
    if (voltage) parts.push(`${voltage}`)
    if (display) parts.push(`${display}`)
    if (power) parts.push(`${power}`)
  }

  // Add brief description or product type
  if (description && description.length > 0) {
    const shortDesc = description.substring(0, 50)
    parts.push(shortDesc)
  } else {
    parts.push(`${name} from ${siteName}`)
  }

  let metaDesc = parts.join(' | ')

  // Ensure 150-160 character length
  if (metaDesc.length > 160) {
    metaDesc = metaDesc.substring(0, 157) + '...'
  } else if (metaDesc.length < 140) {
    metaDesc = `${metaDesc}. Expert technical support and competitive pricing.`
  }

  return metaDesc
}

/**
 * Generate plain text description (no HTML tags)
 */
export function generateHtmlDescription(options: SeoContentOptions): string {
  const { name, model, brand, specifications, description } = options

  const lines: string[] = []

  if (brand) {
    lines.push(brand)
  }

  lines.push(name)

  if (model) {
    lines.push(`Model: ${model}`)
  }

  if (description) {
    lines.push(description)
  }

  if (specifications && Object.keys(specifications).length > 0) {
    lines.push('')
    lines.push('Specifications:')
    for (const [key, value] of Object.entries(specifications)) {
      lines.push(`- ${key}: ${value}`)
    }
  }

  return lines.join('\n')
}

/**
 * Generate SEO-friendly slug for product
 * Pattern: {brand}-{model}-{name} or {name}-{model}
 */
export function generateProductSlug(name: string, model?: string | null, brand?: string | null): string {
  const parts: string[] = []

  if (brand) {
    parts.push(brand.toLowerCase().replace(/[^a-z0-9]/g, '-'))
  }

  if (model) {
    parts.push(model.toLowerCase().replace(/[^a-z0-9]/g, '-'))
  }

  parts.push(name.toLowerCase().replace(/[^a-z0-9]/g, '-'))

  const slug = parts.join('-').replace(/-+/g, '-').replace(/^-|-$/g, '')

  // Ensure slug is not too long (max 100 chars)
  if (slug.length > 100) {
    return slug.substring(0, 100).replace(/-+$/g, '')
  }

  return slug
}
