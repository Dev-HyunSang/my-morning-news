import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    proxy: {
      '/api/rss/chosun': {
        target: 'https://www.chosun.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/rss\/chosun/, '/arc/outboundfeeds/rss/?outputType=xml')
      },
      '/api/rss/bbc': {
        target: 'https://feeds.bbci.co.uk',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/rss\/bbc/, '/news/world/rss.xml')
      },
      '/api/rss/mk': {
        target: 'https://www.mk.co.kr',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/rss\/mk/, '/rss/40300001/')
      },
      '/api/rss/cnn': {
        target: 'http://rss.cnn.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/rss\/cnn/, '/rss/edition_world.rss')
      },
      '/api/rss/cbc': {
        target: 'https://rss.cbc.ca',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/rss\/cbc/, '/lineup/world.xml')
      },
      '/api/rss/jtbc-flash': {
        target: 'https://news-ex.jtbc.co.kr',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/rss\/jtbc-flash/, '/v1/get/rss/newsflesh')
      },
      '/api/rss/jtbc-issue': {
        target: 'https://news-ex.jtbc.co.kr',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/rss\/jtbc-issue/, '/v1/get/rss/issue')
      },
      '/api/rss/sbs-headline': {
        target: 'https://news.sbs.co.kr',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/rss\/sbs-headline/, '/news/headlineRssFeed.do?plink=RSSREADER')
      },
      '/api/rss/sbs-topic': {
        target: 'https://news.sbs.co.kr',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/rss\/sbs-topic/, '/news/TopicRssFeed.do?plink=RSSREADER')
      },
      '/api/rss/sbs-flash': {
        target: 'https://news.sbs.co.kr',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/rss\/sbs-flash/, '/news/newsflashRssFeed.do?plink=RSSREADER')
      },
      '/api/rss/donga': {
        target: 'https://rss.donga.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/rss\/donga/, '/total.xml')
      },
      '/api/rss/foxnews': {
        target: 'https://moxie.foxnews.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/rss\/foxnews/, '/google-publisher/world.xml')
      }
    }
  }
})
