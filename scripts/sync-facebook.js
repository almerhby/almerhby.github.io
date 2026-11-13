/**
 * Automated Facebook Sync Script for Dr. Yahya Al-Marhabi's Official Website
 * Supports:
 * 1. Scheduled GitHub Actions (Crawler/Scraper Mode with zero external dependencies)
 * 2. Make.com / Webhook Payloads (repository_dispatch with client_payload)
 * 3. Local manual invocation via `node scripts/sync-facebook.js`
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const FB_PAGE_URL = 'https://www.facebook.com/Yahya.Ahmed.Almerhbi/';
const ROOT_DIR = path.resolve(__dirname, '..');
const INDEX_FILE = path.join(ROOT_DIR, 'assets', 'data', 'article-index.js');
const CONTENT_FILE = path.join(ROOT_DIR, 'assets', 'data', 'article-content.js');
const CORE_FILE = path.join(ROOT_DIR, 'assets', 'data', 'core.js');
const SITEMAP_FILE = path.join(ROOT_DIR, 'sitemap.xml');
const IMAGES_DIR = path.join(ROOT_DIR, 'assets', 'images', 'articles');

function fetchUrl(targetUrl, customHeaders = {}, redirectCount = 0) {
  return new Promise((resolve, reject) => {
    if (redirectCount > 5) return reject(new Error('Too many redirects'));
    const parsed = new URL(targetUrl);
    const client = parsed.protocol === 'https:' ? https : http;
    const headers = Object.assign({
      'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'ar,en-US;q=0.7,en;q=0.3'
    }, customHeaders);

    const req = client.get(targetUrl, { headers }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let nextUrl = res.headers.location;
        if (nextUrl.startsWith('/')) nextUrl = parsed.origin + nextUrl;
        return resolve(fetchUrl(nextUrl, customHeaders, redirectCount + 1));
      }
      if (res.statusCode !== 200) {
        return resolve({ status: res.statusCode, headers: res.headers, body: null });
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: Buffer.concat(chunks)
        });
      });
    });
    req.on('error', reject);
    req.setTimeout(25000, () => {
      req.destroy();
      reject(new Error('Request timeout for ' + targetUrl));
    });
  });
}

async function downloadImage(imgUrl, destFilename) {
  if (!imgUrl) return '';
  if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
  }
  const destPath = path.join(IMAGES_DIR, destFilename);
  try {
    const res = await fetchUrl(imgUrl, {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    });
    if (res.body && res.body.length > 500) {
      fs.writeFileSync(destPath, res.body);
      console.log(`[SYNC] Downloaded image: ${destFilename} (${res.body.length} bytes)`);
      return `assets/images/articles/${destFilename}`;
    }
  } catch (e) {
    console.warn(`[SYNC] Failed to download image from ${imgUrl}:`, e.message);
  }
  return '';
}

function loadExistingData() {
  const window = {};
  try {
    const idxSrc = fs.readFileSync(INDEX_FILE, 'utf8');
    eval(idxSrc.replace('window.ARTICLE_INDEX =', 'window.ARTICLE_INDEX ='));
  } catch (e) {
    window.ARTICLE_INDEX = [];
  }

  try {
    const contentSrc = fs.readFileSync(CONTENT_FILE, 'utf8');
    eval(contentSrc.replace('window.ARTICLE_CONTENT =', 'window.ARTICLE_CONTENT ='));
  } catch (e) {
    window.ARTICLE_CONTENT = {};
  }

  return {
    index: Array.isArray(window.ARTICLE_INDEX) ? window.ARTICLE_INDEX : [],
    content: (window.ARTICLE_CONTENT && typeof window.ARTICLE_CONTENT === 'object') ? window.ARTICLE_CONTENT : {}
  };
}

function saveDatasets(articleIndex, articleContent) {
  // Sort reverse chronological
  articleIndex.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  // 1. article-index.js
  const idxHeader = '/*\n * فهرس مقالات الدكتور يحيى المرهبي\n * يتم توليد هذا الملف تلقائياً بواسطة نظام المزامنة\n */\n';
  fs.writeFileSync(INDEX_FILE, idxHeader + 'window.ARTICLE_INDEX = ' + JSON.stringify(articleIndex) + ';\n', 'utf8');

  // 2. article-content.js
  const contentHeader = '/*\n * المحتوى الكامل لمقالات الدكتور يحيى المرهبي\n * يتم توليد هذا الملف تلقائياً بواسطة نظام المزامنة\n */\n';
  fs.writeFileSync(CONTENT_FILE, contentHeader + 'window.ARTICLE_CONTENT = ' + JSON.stringify(articleContent) + ';\n', 'utf8');

  // 3. core.js stats
  let coreSrc = fs.readFileSync(CORE_FILE, 'utf8');
  const count = articleIndex.length;
  coreSrc = coreSrc.replace(/articles:\s*\d+/, `articles: ${count}`);
  const piecesMatch = coreSrc.match(/books:\s*(\d+).*?papers:\s*(\d+)/s);
  if (piecesMatch) {
    const books = parseInt(piecesMatch[1], 10) || 15;
    const papers = parseInt(piecesMatch[2], 10) || 13;
    const totalPieces = books + papers + count;
    coreSrc = coreSrc.replace(/pieces:\s*\d+/, `pieces: ${totalPieces}`);
  }
  fs.writeFileSync(CORE_FILE, coreSrc, 'utf8');

  // 4. sitemap.xml
  let sitemapSrc = fs.readFileSync(SITEMAP_FILE, 'utf8');
  articleIndex.forEach(item => {
    const articleUrl = `https://almerhby.github.io/article.html?id=${item.id}`;
    if (!sitemapSrc.includes(articleUrl)) {
      const entry = `  <url>\n    <loc>${articleUrl}</loc>\n    <lastmod>${item.date || new Date().toISOString().split('T')[0]}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
      sitemapSrc = sitemapSrc.replace('</urlset>', entry + '</urlset>');
    }
  });
  fs.writeFileSync(SITEMAP_FILE, sitemapSrc, 'utf8');

  console.log(`[SYNC] Successfully saved datasets. Total articles: ${count}`);
}

function normalizeTitle(rawText) {
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
  let title = (lines[0] || 'مقال فكري').replace(/^["'«]+|["'»]+$/g, '').trim();
  if (title.length > 90) {
    title = title.substring(0, 85).replace(/\s+[^\s]*$/, '') + '...';
  }
  return title;
}

function extractExcerpt(rawText) {
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
  const body = (lines.slice(1).join(' ') || lines[0] || '').replace(/[\r\n]+/g, ' ');
  if (body.length > 220) {
    return body.substring(0, 210).replace(/\s+[^\s]*$/, '') + '...';
  }
  return body;
}

function formatParagraphs(rawText) {
  return rawText
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(p => p.length > 0);
}

// -------------------------------------------------------------
// Mode 1: Process Direct Payload (from Make.com webhook)
// -------------------------------------------------------------
async function processWebhookPayload(payload, currentData) {
  console.log('[SYNC] Processing webhook payload from Make.com / Webhook...');
  const text = (payload.text || payload.content || payload.message || '').trim();
  if (!text || text.length < 50) {
    console.log('[SYNC] Payload contains insufficient text. Skipping.');
    return 0;
  }

  const id = payload.id || `fb-${payload.post_id || Date.now()}`;
  if (currentData.index.some(a => a.id === id)) {
    console.log(`[SYNC] Article ${id} already exists in index. Skipping.`);
    return 0;
  }

  const title = payload.title || normalizeTitle(text);
  const date = payload.date || new Date().toISOString().split('T')[0];
  const postUrl = payload.url || payload.postUrl || FB_PAGE_URL;
  let imageRelPath = '';

  if (payload.imageUrl || payload.image) {
    const imgFilename = `${id}.jpg`;
    imageRelPath = await downloadImage(payload.imageUrl || payload.image, imgFilename);
  }

  const newArticle = {
    id,
    title_ar: title,
    title_en: payload.title_en || '',
    date,
    source: 'facebook',
    source_url: postUrl,
    category_ar: payload.category_ar || 'من صفحة الكاتب',
    category_en: payload.category_en || 'From the Author’s Page',
    excerpt_ar: payload.excerpt_ar || extractExcerpt(text),
    excerpt_en: payload.excerpt_en || '',
    image: imageRelPath,
    tags_ar: payload.tags_ar || ['فيسبوك', 'فكر وأدب'],
    tags_en: payload.tags_en || ['Facebook', 'Thought & Literature'],
    kind: 'essay',
    featured: Boolean(payload.featured),
    series_ar: payload.series_ar || '',
    series_en: payload.series_en || '',
    part: payload.part || null,
    read: Math.floor(Math.random() * 8) + 4
  };

  currentData.index.unshift(newArticle);
  currentData.content[id] = formatParagraphs(text);
  saveDatasets(currentData.index, currentData.content);
  return 1;
}

// -------------------------------------------------------------
// Mode 2: Crawler / Scraper Mode (Cron Job or fallback)
// -------------------------------------------------------------
async function scrapeFacebookProfile(currentData) {
  console.log(`[SYNC] Fetching Facebook profile: ${FB_PAGE_URL}`);
  let html = '';
  try {
    const res = await fetchUrl(FB_PAGE_URL);
    if (!res.body) {
      console.warn('[SYNC] Empty response from Facebook profile.');
      return 0;
    }
    html = res.body.toString('utf8');
  } catch (e) {
    console.error('[SYNC] Failed to fetch Facebook profile:', e.message);
    return 0;
  }

  console.log(`[SYNC] Facebook HTML fetched. Size: ${html.length} bytes.`);

  // Extract Relay message texts and metadata
  const textRegex = /"message":\s*\{\s*"text":\s*"((?:\\.|[^"\\])+)"\}/g;
  let match;
  const discoveredPosts = [];

  while ((match = textRegex.exec(html)) !== null) {
    try {
      const decodedText = JSON.parse(`"${match[1]}"`);
      if (decodedText.length >= 400) { // Scholarly articles are substantial
        const snippet = html.substring(Math.max(0, match.index - 1000), Math.min(html.length, match.index + 2000));
        
        // Find creation timestamp
        const timeMatch = snippet.match(/"creation_time":\s*(\d{10})/i) || snippet.match(/"created_time":\s*(\d{10})/i);
        const timestamp = timeMatch ? parseInt(timeMatch[1], 10) : null;
        const dateStr = timestamp ? new Date(timestamp * 1000).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

        // Find post ID
        const idMatch = snippet.match(/"post_id":\s*"(\d+)"/) || snippet.match(/"story_fbid":\s*"(\d+)"/) || snippet.match(/posts\/(\d+)/) || snippet.match(/"id":"(\d+)"/);
        const postId = idMatch ? `fb-${idMatch[1]}` : null;

        // Find image URI
        const imgMatch = snippet.match(/"uri":\s*"(https:\\\/\\\/[^"\s]+fbcdn\.net[^"\s]+)"/) ||
                         snippet.match(/"image":\s*\{\s*"uri":\s*"(https:\\\/\\\/[^"\s]+)"\}/);
        const imgUrl = imgMatch ? imgMatch[1].replace(/\\\//g, '&').replace(/&amp;/g, '&') : '';

        // Find post URL
        const postUrlMatch = snippet.match(/https:\\\/\\\/www\.facebook\.com\\\/Yahya\.Ahmed\.Almerhbi\\\/posts\\\/([a-zA-Z0-9_-]+)/);
        const postUrl = postUrlMatch ? postUrlMatch[0].replace(/\\\//g, '/') : FB_PAGE_URL;

        discoveredPosts.push({
          id: postId,
          text: decodedText,
          date: dateStr,
          timestamp,
          imageUrl: imgUrl,
          postUrl
        });
      }
    } catch (e) {
      // ignore json parse error for malformed string
    }
  }

  console.log(`[SYNC] Extracted ${discoveredPosts.length} potential articles from feed.`);
  let addedCount = 0;

  for (const post of discoveredPosts) {
    const title = normalizeTitle(post.text);
    // Check duplication by title or exact text prefix
    const exists = currentData.index.some(a => {
      if (post.id && a.id === post.id) return true;
      if (a.title_ar && a.title_ar.includes(title.substring(0, 20))) return true;
      return false;
    });

    if (exists) {
      continue;
    }

    const assignedId = post.id || `fb-${post.timestamp || Date.now()}`;
    console.log(`[SYNC] Found NEW article: "${title}" (Date: ${post.date}, ID: ${assignedId})`);

    let localImagePath = '';
    if (post.imageUrl) {
      localImagePath = await downloadImage(post.imageUrl, `${assignedId}.jpg`);
    }

    const newArticle = {
      id: assignedId,
      title_ar: title,
      title_en: '',
      date: post.date,
      source: 'facebook',
      source_url: post.postUrl,
      category_ar: 'من صفحة الكاتب',
      category_en: 'From the Author’s Page',
      excerpt_ar: extractExcerpt(post.text),
      excerpt_en: '',
      image: localImagePath,
      tags_ar: ['فيسبوك', 'فكر وأدب'],
      tags_en: ['Facebook', 'Thought & Literature'],
      kind: 'essay',
      featured: true,
      series_ar: '',
      series_en: '',
      part: null,
      read: Math.floor(Math.random() * 8) + 4
    };

    currentData.index.unshift(newArticle);
    currentData.content[assignedId] = formatParagraphs(post.text);
    addedCount++;
  }

  if (addedCount > 0) {
    saveDatasets(currentData.index, currentData.content);
    console.log(`[SYNC] Added and saved ${addedCount} new articles!`);
  } else {
    console.log('[SYNC] All Facebook articles are already synchronized. No new items found.');
  }

  return addedCount;
}

// -------------------------------------------------------------
// Entry Point
// -------------------------------------------------------------
async function main() {
  console.log('====================================================');
  console.log(' Dr. Yahya Al-Marhabi - Facebook Synchronization Engine');
  console.log('====================================================');

  const currentData = loadExistingData();
  console.log(`[SYNC] Loaded ${currentData.index.length} existing articles from database.`);

  // Check if triggered with repository_dispatch payload
  let payload = null;
  if (process.env.GITHUB_EVENT_PATH && fs.existsSync(process.env.GITHUB_EVENT_PATH)) {
    try {
      const eventData = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
      if (eventData.client_payload) {
        payload = eventData.client_payload;
      }
    } catch (e) {
      console.warn('[SYNC] Could not parse GITHUB_EVENT_PATH:', e.message);
    }
  }

  if (!payload && process.env.MAKE_PAYLOAD) {
    try {
      payload = JSON.parse(process.env.MAKE_PAYLOAD);
    } catch (e) {
      // ignore
    }
  }

  let added = 0;
  if (payload && (payload.text || payload.content || payload.message)) {
    added = await processWebhookPayload(payload, currentData);
  } else {
    added = await scrapeFacebookProfile(currentData);
  }

  console.log(`[SYNC] Done. Net change: +${added} articles.`);
  process.exit(0);
}

main().catch(err => {
  console.error('[SYNC] Fatal error during sync:', err);
  process.exit(1);
});
