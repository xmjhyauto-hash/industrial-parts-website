import { autoFetchRateLimiter } from './rate-limiter'
import { generateMetaTitle, generateMetaDescription, generateHtmlDescription } from './seo-generator'

const SERPER_API_KEY = process.env.SERPER_API_KEY
const SERPER_ENDPOINT = 'https://google.serper.dev/search'
const SITE_NAME = process.env.SITE_NAME || 'Industrial Parts Co.'

export interface SearchResult {
  title: string
  snippet: string
  url: string
}

export interface EnrichedProduct {
  name: string
  model: string | null
  brand: string | null
  description: string | null
  specifications: Record<string, string> | null
  metaTitle: string
  metaDescription: string
}

export interface AutoFetchOptions {
  model: string
  brand?: string | null
  productName: string
}

export interface AutoFetchResult {
  success: boolean
  status: 'enriched' | 'not_found' | 'fallback' | 'error' | 'skipped'
  enrichedData?: EnrichedProduct
  error?: string
  sources: string[]
}

/**
 * Search for product information using Serper.dev API
 * Rate limited to 1 request per 2 seconds
 */
export async function searchProductInfo(
  model: string,
  brand?: string | null
): Promise<SearchResult[]> {
  console.log('searchProductInfo called for model:', model, 'brand:', brand)
  if (!SERPER_API_KEY) {
    throw new Error('SERPER_API_KEY environment variable is not set')
  }

  // Build search query - prioritize datasheet and specification sources
  const query = brand
    ? `"${model}" "${brand}" industrial specifications datasheet`
    : `"${model}" specifications datasheet industrial product`
  console.log('searchProductInfo: calling Serper API with query:', query)

  await autoFetchRateLimiter.waitForToken()

  const response = await fetch(SERPER_ENDPOINT, {
    method: 'POST',
    headers: {
      'X-API-KEY': SERPER_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      q: query,
      num: 5
    }),
    next: { revalidate: 0 }
  })

  console.log('searchProductInfo: Serper response status:', response.status)
  if (!response.ok) {
    const errorText = await response.text()
    console.error('searchProductInfo: Serper API error:', response.status, errorText)
    throw new Error(`Serper API error: ${response.status}`)
  }

  const data = await response.json()
  console.log('searchProductInfo: received data, organic count:', data.organic?.length || 0)

  // Serper.dev returns organic results in data.organic
  return (data.organic || []).map((item: any) => ({
    title: item.title,
    snippet: item.snippet,
    url: item.link,
  }))
}

/**
 * Extract specifications from search results
 * Parses common industrial product datasheet patterns
 */
export function extractSpecifications(searchResults: SearchResult[]): {
  specs: Record<string, string>
  description: string
} | null {
  if (searchResults.length === 0) {
    return null
  }

  // Combine all snippets for extraction
  const allText = searchResults.map(r => `${r.title} ${r.snippet}`).join(' ')

  const specs: Record<string, string> = {}

  // Pattern: "Input: 24V DC" or "Voltage: 24V DC" or "24V DC input"
  const voltageMatch = allText.match(/(?:Input\s*[Vv]oltage|Voltage|Power\s*Supply)[:\s]*(\d+[Vv]\s*(?:DC|AC)?)/i)
  if (voltageMatch) specs['Voltage'] = voltageMatch[1]

  // Pattern: "Display: 7 inch TFT" or "7-inch display"
  const displayMatch = allText.match(/(?:Display|Screen)[:\s]*(\d+(?:\.\d+)?\s*(?:inch|"|\')?\s*(?:TFT|LCD|LED)?)/i)
  if (displayMatch) specs['Display'] = displayMatch[1]

  // Pattern: "Operating temperature: -20°C to 60°C"
  const tempMatch = allText.match(/Operating\s*temp(?:erature)?[:\s]*([^\n,]+)/i)
  if (tempMatch) specs['Operating Temperature'] = tempMatch[1].trim().substring(0, 50)

  // Pattern: "Power: 50W" or "50 W power consumption"
  const powerMatch = allText.match(/(?:Power|Consumption|Power\s*Consumption)[:\s]*(\d+[Ww])/i)
  if (powerMatch) specs['Power'] = powerMatch[1]

  // Pattern: "Communication: RS485" or "Interface: RS485"
  const commMatch = allText.match(/(?:Communication|Interface|Protocol)[:\s]*([^\n,]+)/i)
  if (commMatch) specs['Communication'] = commMatch[1].trim().substring(0, 30)

  // Pattern: "Protection: IP65"
  const protectionMatch = allText.match(/(?:Protection)[:\s]*([^\n,]+)/i)
  if (protectionMatch) specs['Protection'] = protectionMatch[1].trim().substring(0, 20)

  // Pattern: "Dimensions: 100x200x50mm"
  const dimMatch = allText.match(/(?:Dimensions|Size)[:\s]*([^\n,]+)/i)
  if (dimMatch) specs['Dimensions'] = dimMatch[1].trim().substring(0, 30)

  // Use the first result's snippet as description base
  const description = searchResults[0]?.snippet || ''

  return { specs, description: description.substring(0, 500) }
}

/**
 * Generate fallback SEO content from local product data
 * Used when external search API is unavailable or fails
 */
function generateFallbackContent(options: AutoFetchOptions): EnrichedProduct {
  const { model, brand, productName } = options

  // Generate description from product data
  const description = brand
    ? `${productName} by ${brand}${model ? `, Model: ${model}` : ''}. Industrial quality product available for inquiry.`
    : `${productName}${model ? `, Model: ${model}` : ''}. Industrial quality product available for inquiry.`

  // Generate HTML description
  const htmlDescription = generateHtmlDescription({
    name: productName,
    model,
    brand,
    specifications: null,
    description,
  })

  return {
    name: productName,
    model: model || null,
    brand: brand || null,
    description: htmlDescription,
    specifications: null,
    metaTitle: generateMetaTitle({ name: productName, model, brand, siteName: SITE_NAME }),
    metaDescription: generateMetaDescription({
      name: productName,
      model,
      brand,
      specifications: null,
      description,
      siteName: SITE_NAME,
    }),
  }
}

/**
 * Auto-fetch and enrich product data from web search
 * Falls back to locally generated SEO content if external search fails
 */
export async function autoFetchProduct(
  options: AutoFetchOptions
): Promise<AutoFetchResult> {
  const { model, brand, productName } = options
  console.log('autoFetchProduct called for:', productName, 'model:', model, 'brand:', brand)

  if (!model) {
    console.log('autoFetchProduct: no model, skipping')
    return {
      success: false,
      status: 'skipped',
      error: 'Model number is required for auto-fetch',
      sources: [],
    }
  }

  // Try external search first
  if (SERPER_API_KEY) {
    console.log('autoFetchProduct: SERPER_API_KEY is set, calling searchProductInfo')
    try {
      // Step 1: Search for product info
      const searchResults = await searchProductInfo(model, brand)
      console.log('autoFetchProduct: searchProductInfo returned', searchResults.length, 'results')

      if (searchResults.length === 0) {
        // No results found - use fallback content
        const fallbackData = generateFallbackContent(options)
        return {
          success: true,
          status: 'fallback',
          enrichedData: fallbackData,
          sources: [],
        }
      }

      // Step 2: Extract specifications
      const extracted = extractSpecifications(searchResults)

      // Step 3: Generate SEO content
      const enrichedData: EnrichedProduct = {
        name: productName,
        model,
        brand: brand || null,
        description: extracted?.description || null,
        specifications: extracted?.specs && Object.keys(extracted.specs).length > 0 ? extracted.specs : null,
        metaTitle: generateMetaTitle({ name: productName, model, brand, siteName: SITE_NAME }),
        metaDescription: generateMetaDescription({
          name: productName,
          model,
          brand,
          specifications: extracted?.specs || null,
          description: extracted?.description || null,
          siteName: SITE_NAME,
        }),
      }

      return {
        success: true,
        status: 'enriched',
        enrichedData,
        sources: searchResults.map(r => r.url),
      }
    } catch (error) {
      console.warn('External search failed, using fallback:', error)
      // Fall through to fallback generation
    }
  }

  // Fallback: Generate SEO content from local product data
  const fallbackData = generateFallbackContent(options)
  return {
    success: true,
    status: 'fallback',
    enrichedData: fallbackData,
    sources: [],
  }
}

/**
 * Check if auto-fetch is configured and available
 * Returns true if SERPER_API_KEY is set
 */
export function isAutoFetchAvailable(): boolean {
  return !!SERPER_API_KEY
}
