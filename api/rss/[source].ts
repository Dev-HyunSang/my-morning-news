import type { VercelRequest, VercelResponse } from '@vercel/node'

const RSS_SOURCES: Record<string, string> = {
  bbc: 'https://feeds.bbci.co.uk/news/world/rss.xml',
  cnn: 'http://rss.cnn.com/rss/edition_world.rss',
  cbc: 'https://rss.cbc.ca/lineup/world.xml',
  foxnews: 'https://moxie.foxnews.com/google-publisher/world.xml',
  abc: 'https://abcnews.go.com/abcnews/topstories',
  'abc-us': 'https://abcnews.go.com/abcnews/usheadlines',
  yonhap: 'https://www.yna.co.kr/rss/news.xml',
  chosun: 'https://www.chosun.com/arc/outboundfeeds/rss/?outputType=xml',
  mk: 'https://www.mk.co.kr/rss/40300001/',
  'jtbc-flash': 'https://news-ex.jtbc.co.kr/v1/get/rss/newsflesh',
  'jtbc-issue': 'https://news-ex.jtbc.co.kr/v1/get/rss/issue',
  'sbs-headline': 'https://news.sbs.co.kr/news/headlineRssFeed.do?plink=RSSREADER',
  'sbs-topic': 'https://news.sbs.co.kr/news/TopicRssFeed.do?plink=RSSREADER',
  'sbs-flash': 'https://news.sbs.co.kr/news/newsflashRssFeed.do?plink=RSSREADER',
  donga: 'https://rss.donga.com/total.xml',
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { source } = req.query
  const sourceKey = Array.isArray(source) ? source[0] : source

  if (!sourceKey || !RSS_SOURCES[sourceKey]) {
    return res.status(404).json({ error: 'Source not found' })
  }

  try {
    const response = await fetch(RSS_SOURCES[sourceKey], {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RSS Reader)',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const text = await response.text()

    res.setHeader('Content-Type', 'application/xml; charset=utf-8')
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate')
    return res.status(200).send(text)
  } catch (error) {
    console.error(`Failed to fetch ${sourceKey}:`, error)
    return res.status(500).json({ error: 'Failed to fetch RSS' })
  }
}
