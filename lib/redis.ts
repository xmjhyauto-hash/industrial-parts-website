// Lazy-loaded Redis client to avoid issues during static generation
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let redisClient: any = null

async function getRedisClient() {
  if (!process.env.REDIS_URL) {
    return null
  }

  if (!redisClient) {
    const { createClient } = await import('redis')
    redisClient = createClient({ url: process.env.REDIS_URL })
    redisClient.on('error', (err: Error) => {
      console.error('Redis Client Error:', err)
    })
  }

  if (!redisClient.isOpen) {
    await redisClient.connect()
  }

  return redisClient
}

export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const client = await getRedisClient()
    if (!client) return null

    const data = await client.get(key)
    if (!data) return null
    return JSON.parse(data) as T
  } catch (error) {
    console.error(`Redis GET error for key ${key}:`, error)
    return null
  }
}

export async function setCache<T>(key: string, value: T, ttlSeconds: number = 300): Promise<void> {
  try {
    const client = await getRedisClient()
    if (!client) return

    await client.setEx(key, ttlSeconds, JSON.stringify(value))
  } catch (error) {
    console.error(`Redis SET error for key ${key}:`, error)
  }
}

export async function deleteCache(key: string): Promise<void> {
  try {
    const client = await getRedisClient()
    if (!client) return

    await client.del(key)
  } catch (error) {
    console.error(`Redis DEL error for key ${key}:`, error)
  }
}

export async function deleteCachePattern(pattern: string): Promise<void> {
  try {
    const client = await getRedisClient()
    if (!client) return

    const keys = await client.keys(pattern)
    if (keys.length > 0) {
      await client.del(keys)
    }
  } catch (error) {
    console.error(`Redis DEL pattern error for ${pattern}:`, error)
  }
}

// Cache keys
export const CacheKeys = {
  categoryProducts: (slug: string, page: number) => `category:${slug}:page:${page}`,
  searchResults: (query: string) => `search:${encodeURIComponent(query)}`,
} as const
