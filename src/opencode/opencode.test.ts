import { describe, test, expect } from "vitest"

describe("LRU cache for session tracking", () => {
  test("createLRUSet should limit size to maxSize", () => {
    const MAX_SESSIONS = 100
    
    function createLRUSet(maxSize: number = MAX_SESSIONS) {
      const map = new Map<string, number>()
      
      return {
        add(key: string) {
          if (map.has(key)) {
            map.delete(key)
          }
          map.set(key, Date.now())
          
          if (map.size > maxSize) {
            const oldest = map.keys().next().value
            if (oldest) map.delete(oldest)
          }
        },
        has(key: string): boolean {
          return map.has(key)
        },
        delete(key: string): boolean {
          return map.delete(key)
        },
        size(): number {
          return map.size
        }
      }
    }

    const lru = createLRUSet(5)
    
    for (let i = 0; i < 10; i++) {
      lru.add(`session-${i}`)
    }
    
    expect(lru.size()).toBe(5)
    expect(lru.has("session-0")).toBe(false)
    expect(lru.has("session-9")).toBe(true)
  })

  test("createLRUSet should update access order on re-add", () => {
    const MAX_SESSIONS = 100
    
    function createLRUSet(maxSize: number = MAX_SESSIONS) {
      const map = new Map<string, number>()
      
      return {
        add(key: string) {
          if (map.has(key)) {
            map.delete(key)
          }
          map.set(key, Date.now())
          
          if (map.size > maxSize) {
            const oldest = map.keys().next().value
            if (oldest) map.delete(oldest)
          }
        },
        has(key: string): boolean {
          return map.has(key)
        },
        getKeys(): string[] {
          return Array.from(map.keys())
        },
        size(): number {
          return map.size
        }
      }
    }

    const lru = createLRUSet(3)
    
    lru.add("a")
    lru.add("b")
    lru.add("c")
    lru.add("a")
    lru.add("d")
    
    expect(lru.has("b")).toBe(false)
    expect(lru.has("a")).toBe(true)
    expect(lru.has("c")).toBe(true)
    expect(lru.has("d")).toBe(true)
  })
})
