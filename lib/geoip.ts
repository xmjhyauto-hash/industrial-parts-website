/**
 * Lightweight IP to country lookup using IANA IPv4 reserves
 * No external dependencies required
 * Based on https://www.iana.org/assignments/ipv4-address-space/ipv4-address-space.xhtml
 */

// Common IP range allocations by country (simplified, for demonstration)
// For production, use MaxMind GeoLite2 or similar
const IP_COUNTRY_RANGES: Array<{
  start: number
  end: number
  country: string
}> = [
  // China
  { start: 0xC000000, end: 0xC1FFFFFF, country: 'CN' },
  { start: 0xC2A00000, end: 0xC2AFFFFF, country: 'CN' },
  // United States (various ranges)
  { start: 0x01000000, end: 0x010FFFFF, country: 'US' },
  { start: 0x02000000, end: 0x02FFFFFF, country: 'US' },
  { start: 0x03000000, end: 0x03FFFFFF, country: 'US' },
  // Europe (selected ranges)
  { start: 0x05000000, end: 0x05FFFFFF, country: 'EU' }, // RIPE NCC
  { start: 0x08000000, end: 0x08FFFFFF, country: 'EU' },
  // APNIC (Asia Pacific)
  { start: 0x0A000000, end: 0x0AFFFFFF, country: 'AP' },
  { start: 0x0B000000, end: 0x0BFFFFFF, country: 'AP' },
  // Japan
  { start: 0x40000000, end: 0x4FFFFFFF, country: 'JP' },
  // Korea
  { start: 0x42000000, end: 0x42FFFFFF, country: 'KR' },
  // Australia
  { start: 0x4C000000, end: 0x4FFFFFFF, country: 'AU' },
  // Singapore
  { start: 0x5F000000, end: 0x5FFFFFFF, country: 'SG' },
  // Malaysia
  { start: 0x60000000, end: 0x60FFFFFF, country: 'MY' },
  // India
  { start: 0x66000000, end: 0x66FFFFFF, country: 'IN' },
  // Hong Kong
  { start: 0x67000000, end: 0x67FFFFFF, country: 'HK' },
  // Taiwan
  { start: 0x68000000, end: 0x68FFFFFF, country: 'TW' },
  // Brazil
  { start: 0x72000000, end: 0x72FFFFFF, country: 'BR' },
  // Canada
  { start: 0x78000000, end: 0x78FFFFFF, country: 'CA' },
  // UK
  { start: 0x80000000, end: 0x80FFFFFF, country: 'GB' },
  // Germany
  { start: 0x81000000, end: 0x81FFFFFF, country: 'DE' },
  // France
  { start: 0x82000000, end: 0x82FFFFFF, country: 'FR' },
  // Russia
  { start: 0x83000000, end: 0x83FFFFFF, country: 'RU' },
  // China (larger range)
  { start: 0xAC100000, end: 0xAC1FFFFF, country: 'CN' },
  // Localhost
  { start: 0x7F000000, end: 0x7FFFFFFF, country: 'LOCAL' },
  // Private/Reserved
  { start: 0x0A000000, end: 0x0AFFFFFF, country: 'PRIVATE' }, // 10.x.x.x
  { start: 0x7F000000, end: 0x7FFFFFFF, country: 'PRIVATE' }, // 127.x.x.x
  { start: 0xC0A80000, end: 0xC0A8FFFF, country: 'PRIVATE' }, // 192.168.x.x
]

function ipToNumber(ip: string): number {
  const parts = ip.split('.').map(Number)
  if (parts.length !== 4) return 0
  return (parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]
}

export function lookupCountry(ip: string): string {
  if (!ip) return 'UNKNOWN'

  // Handle IPv6 (simplified - return for now)
  if (ip.includes(':')) return 'UNKNOWN'

  // Handle localhost/private
  if (ip === '127.0.0.1' || ip === '::1') return 'LOCAL'

  // Handle localhost ranges
  if (ip.startsWith('127.')) return 'LOCAL'

  // Handle private ranges
  if (ip.startsWith('192.168.')) return 'PRIVATE'
  if (ip.startsWith('10.')) return 'PRIVATE'
  if (ip.startsWith('172.')) {
    const second = parseInt(ip.split('.')[1])
    if (second >= 16 && second <= 31) return 'PRIVATE'
  }

  const ipNum = ipToNumber(ip)
  if (ipNum === 0) return 'UNKNOWN'

  // Binary search through ranges
  let left = 0
  let right = IP_COUNTRY_RANGES.length - 1

  while (left <= right) {
    const mid = Math.floor((left + right) / 2)
    const range = IP_COUNTRY_RANGES[mid]

    if (ipNum >= range.start && ipNum <= range.end) {
      const country = range.country
      if (country === 'PRIVATE' || country === 'LOCAL') return 'UNKNOWN'
      return country
    } else if (ipNum < range.start) {
      right = mid - 1
    } else {
      left = mid + 1
    }
  }

  // Default - return unknown
  return 'UNKNOWN'
}

export const countryNames: Record<string, string> = {
  US: 'United States',
  CN: 'China',
  IN: 'India',
  DE: 'Germany',
  GB: 'United Kingdom',
  JP: 'Japan',
  KR: 'South Korea',
  FR: 'France',
  BR: 'Brazil',
  CA: 'Canada',
  AU: 'Australia',
  SG: 'Singapore',
  MY: 'Malaysia',
  TH: 'Thailand',
  VN: 'Vietnam',
  ID: 'Indonesia',
  PH: 'Philippines',
  HK: 'Hong Kong',
  TW: 'Taiwan',
  AE: 'UAE',
  SA: 'Saudi Arabia',
  RU: 'Russia',
  IT: 'Italy',
  ES: 'Spain',
  NL: 'Netherlands',
  CH: 'Switzerland',
  SE: 'Sweden',
  NO: 'Norway',
  DK: 'Denmark',
  FI: 'Finland',
  PL: 'Poland',
  MX: 'Mexico',
  AR: 'Argentina',
  ZA: 'South Africa',
  EG: 'Egypt',
  NG: 'Nigeria',
  KE: 'Kenya',
  EU: 'Europe',
  AP: 'Asia Pacific',
  LOCAL: 'Localhost',
  PRIVATE: 'Private Network',
  UNKNOWN: 'Unknown',
}

export function getCountryName(code: string): string {
  return countryNames[code] || code || 'Unknown'
}
