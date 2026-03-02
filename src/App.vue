<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'

interface FeedItem {
  id: string
  title: string
  description: string
  link: string
  pubDate: string
  source: string
  image: string | null
  isBreaking: boolean
}

interface RssSource {
  url: string
  name: string
  isBreaking?: boolean
}

type TabType = 'international' | 'domestic'

const activeTab = ref<TabType>('international')
const feeds = ref<FeedItem[]>([])
const loading = ref(true)
const error = ref('')
const selectedSources = ref<Set<string>>(new Set())
const showBreakingOnly = ref(false)

const rssSources: Record<TabType, RssSource[]> = {
  international: [
    { url: '/api/rss/bbc', name: 'BBC News' },
    { url: '/api/rss/cnn', name: 'CNN' },
    { url: '/api/rss/cbc', name: 'CBC' },
    { url: '/api/rss/foxnews', name: 'Fox News' },
  ],
  domestic: [
    { url: '/api/rss/chosun', name: '조선일보' },
    { url: '/api/rss/mk', name: '매일경제' },
    { url: '/api/rss/jtbc-flash', name: 'JTBC', isBreaking: true },
    { url: '/api/rss/jtbc-issue', name: 'JTBC 이슈' },
    { url: '/api/rss/sbs-headline', name: 'SBS 헤드라인' },
    { url: '/api/rss/sbs-topic', name: 'SBS 주요뉴스' },
    { url: '/api/rss/sbs-flash', name: 'SBS', isBreaking: true },
    { url: '/api/rss/donga', name: '동아일보' },
  ],
}

// Format date string with exact time and relative time
const formatTime = (dateStr: string): string => {
  const date = new Date(dateStr)
  const now = new Date()

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  let relative = ''
  if (diffMins < 1) relative = '방금 전'
  else if (diffMins < 60) relative = `${diffMins}분 전`
  else if (diffHours < 24) relative = `${diffHours}시간 전`
  else relative = `${diffDays}일 전`

  return `${year}.${month}.${day} ${hours}:${minutes} (${relative})`
}

// Extract image URL from RSS item
const extractImage = (item: Element): string | null => {
  // Try media:thumbnail
  const mediaThumbnail = item.getElementsByTagName('media:thumbnail')[0]
  if (mediaThumbnail) {
    return mediaThumbnail.getAttribute('url') || null
  }

  // Try media:content
  const mediaContent = item.getElementsByTagName('media:content')[0]
  if (mediaContent) {
    const url = mediaContent.getAttribute('url')
    if (url && (url.includes('.jpg') || url.includes('.png') || url.includes('.webp'))) {
      return url
    }
  }

  // Try enclosure
  const enclosure = item.querySelector('enclosure')
  if (enclosure) {
    const type = enclosure.getAttribute('type')
    if (type?.startsWith('image/')) {
      return enclosure.getAttribute('url') || null
    }
  }

  // Try to extract from description HTML
  const description = item.querySelector('description')?.textContent || ''
  const imgMatch = description.match(/<img[^>]+src=["']([^"']+)["']/)
  if (imgMatch) {
    return imgMatch[1]
  }

  return null
}

// Decode HTML entities
const decodeHtmlEntities = (text: string): string => {
  const textarea = document.createElement('textarea')
  textarea.innerHTML = text
  return textarea.value
}

// Fetch single RSS feed
const fetchSingleRSS = async (source: RssSource): Promise<FeedItem[]> => {
  const response = await fetch(source.url)
  const text = await response.text()

  const parser = new DOMParser()
  const xml = parser.parseFromString(text, 'text/xml')
  const items = xml.querySelectorAll('item')

  return Array.from(items).map((item, index) => ({
    id: `${source.name}-${index}`,
    title: decodeHtmlEntities(item.querySelector('title')?.textContent || ''),
    description: decodeHtmlEntities(item.querySelector('description')?.textContent?.replace(/<[^>]*>/g, '') || ''),
    link: item.querySelector('link')?.textContent || '',
    pubDate: item.querySelector('pubDate')?.textContent || '',
    source: source.name,
    image: extractImage(item),
    isBreaking: source.isBreaking || false,
  }))
}

// Fetch and merge RSS feeds
const fetchRSS = async () => {
  try {
    loading.value = true
    error.value = ''

    const sources = rssSources[activeTab.value]
    const results = await Promise.all(sources.map(fetchSingleRSS))

    // Merge and sort by date
    const allFeeds = results.flat()
    allFeeds.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())

    feeds.value = allFeeds
  } catch (e) {
    error.value = 'Failed to load news'
    console.error(e)
  } finally {
    loading.value = false
  }
}

// Get available sources for current tab
const availableSources = computed(() => {
  return rssSources[activeTab.value].map(s => s.name)
})

// Filter feeds by selected sources and breaking news
const filteredFeeds = computed(() => {
  let result = feeds.value

  if (selectedSources.value.size > 0) {
    result = result.filter(item => selectedSources.value.has(item.source))
  }

  if (showBreakingOnly.value) {
    result = result.filter(item => item.isBreaking)
  }

  return result
})

// Toggle source selection
const toggleSource = (source: string) => {
  const newSet = new Set(selectedSources.value)
  if (newSet.has(source)) {
    newSet.delete(source)
  } else {
    newSet.add(source)
  }
  selectedSources.value = newSet
}

// Clear all filters
const clearFilters = () => {
  selectedSources.value = new Set()
  showBreakingOnly.value = false
}

watch(activeTab, () => {
  selectedSources.value = new Set()
  showBreakingOnly.value = false
  fetchRSS()
})

onMounted(() => {
  fetchRSS()
})
</script>

<template>
  <div class="min-h-screen bg-gray-100">
    <!-- Header -->
    <header class="sticky top-0 z-10 bg-white border-b border-gray-200">
      <div class="flex items-center justify-between px-4 py-3">
        <h1 class="text-xl font-bold text-gray-900">HyunSang's Morning News</h1>
        <button @click="fetchRSS" class="text-sm text-blue-600 hover:text-blue-800">Refresh</button>
      </div>

      <!-- Tabs -->
      <div class="flex">
        <button
          @click="activeTab = 'international'"
          :class="[
            'flex-1 py-3 text-sm font-medium transition-colors',
            activeTab === 'international'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700',
          ]"
        >
          International
        </button>
        <button
          @click="activeTab = 'domestic'"
          :class="[
            'flex-1 py-3 text-sm font-medium transition-colors',
            activeTab === 'domestic'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700',
          ]"
        >
          Domestic
        </button>
      </div>

      <!-- Source Filter -->
      <div class="px-4 py-2 bg-gray-50 border-t border-gray-100">
        <div class="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            v-if="selectedSources.size > 0 || showBreakingOnly"
            @click="clearFilters"
            class="flex-shrink-0 px-3 py-1 text-xs font-medium text-gray-500 bg-white border border-gray-300 rounded-full hover:bg-gray-100"
          >
            All
          </button>
          <button
            @click="showBreakingOnly = !showBreakingOnly"
            :class="[
              'flex-shrink-0 px-3 py-1 text-xs font-medium rounded-full transition-colors',
              showBreakingOnly
                ? 'bg-red-600 text-white'
                : 'bg-white text-red-600 border border-red-300 hover:bg-red-50',
            ]"
          >
            {{ activeTab === 'international' ? 'Breaking' : '속보' }}
          </button>
          <span class="text-gray-300">|</span>
          <button
            v-for="source in availableSources"
            :key="source"
            @click="toggleSource(source)"
            :class="[
              'flex-shrink-0 px-3 py-1 text-xs font-medium rounded-full transition-colors',
              selectedSources.has(source)
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100',
            ]"
          >
            {{ source }}
          </button>
        </div>
      </div>
    </header>

    <!-- Feed Container -->
    <main class="max-w-xl mx-auto py-4 px-4">
      <!-- Loading -->
      <div v-if="loading" class="text-center py-8 text-gray-500">Loading...</div>

      <!-- Error -->
      <div v-else-if="error" class="text-center py-8 text-red-500">
        {{ error }}
      </div>

      <!-- Feed Items -->
      <div v-else class="space-y-4">
        <article
          v-for="item in filteredFeeds"
          :key="item.id"
          class="bg-white rounded-lg shadow overflow-hidden"
        >
          <a :href="item.link" target="_blank" rel="noopener" class="block">
            <!-- Image -->
            <img
              v-if="item.image"
              :src="item.image"
              :alt="item.title"
              class="w-full h-48 object-cover"
              loading="lazy"
            />

            <div class="p-4">
              <h2 class="font-semibold text-gray-900 mb-2 hover:text-blue-600">
                <span v-if="item.isBreaking" class="text-red-600 font-bold mr-1">[속보]</span>
                {{ item.title }}
              </h2>
              <p class="text-sm text-gray-600 mb-2 line-clamp-2">
                {{ item.description }}
              </p>
              <div class="flex items-center gap-2 text-xs text-gray-400">
                <span class="text-blue-600 font-medium">{{ item.source }}</span>
                <span>·</span>
                <span>{{ formatTime(item.pubDate) }}</span>
              </div>
            </div>
          </a>
        </article>
      </div>
    </main>
  </div>
</template>
