/**
 * Automated Facebook Sync Script for Dr. Yahya Al-Marhabi's Official Website
 * Supports:
 * 1. Scheduled GitHub Actions (Crawler/Scraper Mode with zero external dependencies)
 * 2. Lookaside & Preload High-Res Image Extractor (Auto-downloads post illustrations)
 * 3. Self-healing Image Repair (Re-fetches and fixes any missing images for recent articles)
 * 4. Local manual invocation via `node scripts/sync-facebook.js` or `sync-articles.bat`
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
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/*,*/*;q=0.8',
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
      'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)'
    });
    if (res.body && res.body.length > 2000) {
      // Check content-type or valid image header
      const contentType = (res.headers && res.headers['content-type']) || '';
      if (contentType.includes('text/html') && !contentType.includes('image')) {
        return '';
      }
      fs.writeFileSync(destPath, res.body);
      console.log(`[SYNC] Downloaded image: ${destFilename} (${res.body.length} bytes)`);
      return `assets/images/articles/${destFilename}`;
    }
  } catch (e) {
    console.warn(`[SYNC] Failed to download image from ${imgUrl}:`, e.message);
  }
  return '';
}

async function resolveAndDownloadImage(postId, snippet, fullHtml) {
  const numericId = String(postId).replace(/^fb-/, '');
  if (!/^\d+$/.test(numericId)) return '';

  const candidates = [];

  // Strategy 1: Check Preload tags in the full page HTML
  if (fullHtml) {
    const preloadRegex = new RegExp(`href="([^"]*media_id=${numericId}[^"]*)"`, 'i');
    const match = fullHtml.match(preloadRegex);
    if (match) {
      candidates.push(match[1].replace(/&amp;/g, '&'));
    }
  }

  // Strategy 2: Official Facebook Crawler Media Lookaside Endpoint
  candidates.push(`https://lookaside.fbsbx.com/lookaside/crawler/media/?media_id=${numericId}`);

  // Strategy 3: Check snippet for any direct fbcdn.net URI
  if (snippet) {
    const fbcdnMatches = snippet.match(/https:[^"'<>\s\\]+fbcdn\.net[^"'<>\s\\]+/g) || [];
    for (const m of fbcdnMatches) {
      const unescaped = m.replace(/\\u0025/g, '%').replace(/\\\//g, '/').replace(/\\/g, '').replace(/&amp;/g, '&');
      candidates.push(unescaped);
    }
  }

  // Strategy 4: Search around numericId in fullHtml for direct image CDN links
  if (fullHtml) {
    const idPos = fullHtml.indexOf(numericId);
    if (idPos !== -1) {
      const localSlice = fullHtml.substring(Math.max(0, idPos - 1500), Math.min(fullHtml.length, idPos + 2500));
      const sliceMatches = localSlice.match(/https:[^"'<>\s\\]+fbcdn\.net[^"'<>\s\\]+/g) || [];
      for (const m of sliceMatches) {
        const unescaped = m.replace(/\\u0025/g, '%').replace(/\\\//g, '/').replace(/\\/g, '').replace(/&amp;/g, '&');
        candidates.push(unescaped);
      }
    }
  }

  const destFilename = `fb-${numericId}.jpg`;
  for (const cUrl of candidates) {
    const downloadedPath = await downloadImage(cUrl, destFilename);
    if (downloadedPath) {
      return downloadedPath;
    }
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
  const prevArticlesMatch = coreSrc.match(/(["']?articles["']?\s*:\s*)(\d+)/);
  const prevCount = prevArticlesMatch ? parseInt(prevArticlesMatch[2], 10) : count;
  const diff = count - prevCount;

  coreSrc = coreSrc.replace(/(["']?articles["']?\s*:\s*)\d+/, `$1${count}`);
  if (diff !== 0) {
    const prevPiecesMatch = coreSrc.match(/(["']?pieces["']?\s*:\s*)(\d+)/);
    if (prevPiecesMatch) {
      const prevPieces = parseInt(prevPiecesMatch[2], 10);
      coreSrc = coreSrc.replace(/(["']?pieces["']?\s*:\s*)\d+/, `$1${prevPieces + diff}`);
    }
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
  // If line 0 is author name or date, use line 1
  if (title.includes('المرهبي') || title.match(/^\d{1,2}\s+[^\s]+\s+\d{4}/)) {
    title = (lines[1] || lines[0] || 'مقال فكري').replace(/^["'«]+|["'»]+$/g, '').trim();
  }
  if (title.length > 90) {
    title = title.substring(0, 85).replace(/\s+[^\s]*$/, '') + '...';
  }
  return title;
}

function extractExcerpt(rawText) {
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
  let bodyLines = lines;
  if (lines[0] && (lines[0].includes('المرهبي') || lines[0].match(/^\d{1,2}\s+[^\s]+\s+\d{4}/))) {
    bodyLines = lines.slice(1);
  }
  const body = (bodyLines.slice(1).join(' ') || bodyLines[0] || '').replace(/[\r\n]+/g, ' ');
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
// Auto-repair missing images for recent articles
// -------------------------------------------------------------
async function repairMissingImages(currentData, fullHtml) {
  console.log('[SYNC] Verifying and repairing images for recent articles...');
  let repaired = 0;
  // Inspect the top 20 recent articles
  for (const item of currentData.index.slice(0, 20)) {
    const hasValidImage = item.image && fs.existsSync(path.join(ROOT_DIR, item.image));
    if (!hasValidImage && item.id && item.id.startsWith('fb-')) {
      const numericId = item.id.replace('fb-', '');
      if (/^\d+$/.test(numericId)) {
        console.log(`[SYNC] Image missing for "${item.title_ar}" (${item.id}). Resolving...`);
        const resolvedPath = await resolveAndDownloadImage(numericId, '', fullHtml);
        if (resolvedPath) {
          item.image = resolvedPath;
          repaired++;
          console.log(`[SYNC] Restored image for ${item.id} -> ${resolvedPath}`);
        }
      }
    }
  }
  return repaired;
}

// -------------------------------------------------------------
// Scraper Mode (Cron Job, Dispatch, or Local Run)
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

  // Step 1: Repair any missing images in existing recent articles
  const repairedCount = await repairMissingImages(currentData, html);

  // Step 2: Extract Relay message texts and metadata for new posts
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

        // Find post URL
        const postUrlMatch = snippet.match(/https:\\\/\\\/www\.facebook\.com\\\/Yahya\.Ahmed\.Almerhbi\\\/posts\\\/([a-zA-Z0-9_-]+)/);
        const postUrl = postUrlMatch ? postUrlMatch[0].replace(/\\\//g, '/') : FB_PAGE_URL;

        discoveredPosts.push({
          id: postId,
          text: decodedText,
          date: dateStr,
          timestamp,
          snippet,
          postUrl
        });
      }
    } catch (e) {
      // ignore json parse error
    }
  }

  console.log(`[SYNC] Extracted ${discoveredPosts.length} potential articles from feed.`);
  let addedCount = 0;

  for (const post of discoveredPosts) {
    const title = normalizeTitle(post.text);
    // Check duplication by id or title prefix
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

    // Download image
    const localImagePath = await resolveAndDownloadImage(assignedId, post.snippet, html);

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

  if (addedCount > 0 || repairedCount > 0) {
    saveDatasets(currentData.index, currentData.content);
    console.log(`[SYNC] Changes saved: ${addedCount} new articles added, ${repairedCount} images restored.`);
  } else {
    console.log('[SYNC] All Facebook articles and images are fully synchronized.');
  }

  return addedCount + repairedCount;
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

  const changes = await scrapeFacebookProfile(currentData);

  console.log(`[SYNC] Completed successfully. Total modifications: ${changes}`);
  process.exit(0);
}

main().catch(err => {
  console.error('[SYNC] Fatal error during sync:', err);
  process.exit(1);
});
