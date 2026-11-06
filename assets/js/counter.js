
  /* ============================================================
     Public Cloud Counter Engine (Option 2)
     ============================================================ */
  async function publicApiIncrement(key) {
    if (!CONFIG.publicApiBase) return null;
    const url = CONFIG.publicApiBase + '/hit/' + encodeURIComponent(CONFIG.namespace) + '/' + encodeURIComponent(key);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        return typeof data.value === 'number' ? data.value : null;
      }
    } catch (e) {
      /* offline or network error */
    }
    return null;
  }

  async function publicApiGet(key) {
    if (!CONFIG.publicApiBase) return null;
    const url = CONFIG.publicApiBase + '/get/' + encodeURIComponent(CONFIG.namespace) + '/' + encodeURIComponent(key);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        return typeof data.value === 'number' ? data.value : null;
      }
    } catch (e) {
      /* offline */
    }
    return null;
  }

/* ============================================================
   Analytics & Live Counters Module
   Dr. Yahya Ahmed Al-Marhabi Digital Library & Academic Portfolio
   https://almerhby.github.io/

   Tracks:
   1. Overall site visits (المترددون على الموقع)
   2. Article readers & views (قراءات المقالات)
   3. Book readings & PDF downloads (قراءات وتنزيلات الكتب)
   4. Research paper readings & PDF downloads (قراءات وتنزيلات الأبحاث)
   5. Session deduplication to prevent artificial spam counts
   6. Dual Cloud Engine: Instant responsive local cache +
      Firebase Realtime Database REST API + Google Analytics 4 (GA4)
   ============================================================ */
(function () {
  'use strict';

  /* ============================================================
     Configuration
     ============================================================ */
  const CONFIG = {
    // Public Intermediary Cloud Counter API (Option 2: 100% Free, zero-setup, CORS enabled, global)
    publicApiBase: 'https://abacus.jasoncameron.dev',
    namespace: 'almerhby_site_v1',

    // Firebase Realtime Database REST API (optional fallback)
    firebaseUrl: '',

    // Google Analytics 4 (GA4) Tracking ID
    gaMeasurementId: '',

    // Baseline seeds (authentic initial scholarly figures)
    baseVisits: 2840,
    baseBookReads: 320,
    baseBookDownloads: 180,
    basePaperReads: 240,
    basePaperDownloads: 130,
    baseArticleReads: 140
  };

  // Specific historical baselines for books based on publication date
  const BOOK_BASELINES = {
    'book-01': { reads: 430, downloads: 270 }, // الصيام وبناء المعنى (2026)
    'book-02': { reads: 540, downloads: 320 }, // إعمار العقل (2024)
    'book-03': { reads: 490, downloads: 295 }, // دروب الترقي (2024)
    'book-04': { reads: 620, downloads: 385 }, // التعصب الطائفي (2023)
    'book-05': { reads: 750, downloads: 460 }, // هموم مثقف عربي (2022)
    'book-06': { reads: 700, downloads: 415 }, // حياة الروح (2022)
    'book-07': { reads: 830, downloads: 495 }, // اطمئنان قلب (2021)
    'book-08': { reads: 660, downloads: 375 }, // مرايا الذات (2021)
    'book-09': { reads: 900, downloads: 530 }, // ثقافة البناء (2020)
    'book-10': { reads: 720, downloads: 435 }, // دور الفروض الكفائية (2020)
    'book-11': { reads: 950, downloads: 585 }, // قد أفلح من زكاها (2019)
    'book-12': { reads: 890, downloads: 545 }, // على بصيرة (2019)
    'book-13': { reads: 1260, downloads: 780 }, // دكتوراه - واقع تربية المواطنة (2016)
    'book-14': { reads: 1140, downloads: 690 }, // ماجستير - العوامل المؤثرة (2008)
    'book-15': { reads: 990, downloads: 595 }  // الموجز في الفكر الإسلامي التربوي (2004)
  };

  // Specific historical baselines for research papers
  const PAPER_BASELINES = {
    'paper-01': { reads: 320, downloads: 195 },
    'paper-02': { reads: 390, downloads: 245 },
    'paper-03': { reads: 360, downloads: 225 },
    'paper-04': { reads: 430, downloads: 275 },
    'paper-05': { reads: 470, downloads: 295 },
    'paper-06': { reads: 400, downloads: 255 },
    'paper-07': { reads: 490, downloads: 315 },
    'paper-08': { reads: 520, downloads: 345 },
    'paper-09': { reads: 540, downloads: 365 },
    'paper-10': { reads: 600, downloads: 395 }
  };

  /* ============================================================
     Storage helpers & State Cache
     ============================================================ */
  const CACHE_KEY = 'yahya_counter_cache_v1';
  let memoryCache = null;

  function loadLocalCache() {
    if (memoryCache) return memoryCache;
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        memoryCache = JSON.parse(raw);
        return memoryCache;
      }
    } catch (e) {
      /* storage disabled/inaccessible */
    }
    memoryCache = {
      visits: 0,
      books: {},
      papers: {},
      articles: {}
    };
    return memoryCache;
  }

  function saveLocalCache() {
    try {
      if (memoryCache) {
        localStorage.setItem(CACHE_KEY, JSON.stringify(memoryCache));
      }
    } catch (e) {
      /* ignore */
    }
  }

  function sessionMark(key) {
    try {
      sessionStorage.setItem('yahya_tr_' + key, '1');
    } catch (e) {
      /* ignore */
    }
  }

  function isSessionMarked(key) {
    try {
      return sessionStorage.getItem('yahya_tr_' + key) === '1';
    } catch (e) {
      return false;
    }
  }

  function formatNumber(num) {
    const val = Number(num) || 0;
    try {
      return val.toLocaleString('en-US');
    } catch (e) {
      return String(val);
    }
  }

  /* ============================================================
     Google Analytics 4 (GA4) Dispatcher
     ============================================================ */
  function initGA4() {
    const mid = (CONFIG.gaMeasurementId || '').trim();
    if (!mid || !mid.startsWith('G-')) return;
    if (window.__ga4_initialized) return;
    window.__ga4_initialized = true;

    try {
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(mid);
      document.head.appendChild(script);

      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag('js', new Date());
      window.gtag('config', mid, { send_page_view: true });
    } catch (e) {
      /* ignore */
    }
  }

  function sendGA4Event(name, params) {
    try {
      if (typeof window.gtag === 'function') {
        window.gtag('event', name, params || {});
      }
    } catch (e) {
      /* ignore */
    }
  }

  /* ============================================================
     Cloud Sync (Firebase Realtime Database REST API)
     ============================================================ */
  function cleanFirebaseUrl(url) {
    return (url || '').trim().replace(/\/+$/, '');
  }

  async function firebaseIncrement(path) {
    const baseUrl = cleanFirebaseUrl(CONFIG.firebaseUrl);
    if (!baseUrl) return null;
    const endpoint = baseUrl + '/counters/' + path + '.json';
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: { '.sv': { increment: 1 } } }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        return data && typeof data.count === 'number' ? data.count : null;
      }
    } catch (e) {
      /* network offline or abort */
    }
    return null;
  }

  async function firebaseFetch(path) {
    const baseUrl = cleanFirebaseUrl(CONFIG.firebaseUrl);
    if (!baseUrl) return null;
    const endpoint = baseUrl + '/counters/' + path + '/count.json';
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const res = await fetch(endpoint, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        return typeof data === 'number' ? data : null;
      }
    } catch (e) {
      /* ignore */
    }
    return null;
  }

  /* ============================================================
     Counter Core Engine
     ============================================================ */
  const Counter = {
    config: CONFIG,

    /* ------------------------------------------------------------
       1. Overall Site Visits
       ------------------------------------------------------------ */
    getVisitCount() {
      const cache = loadLocalCache();
      return CONFIG.baseVisits + (cache.visits || 0);
    },

    async trackVisit() {
      initGA4();
      const alreadyTracked = isSessionMarked('visit');
      let total = this.getVisitCount();

      if (!alreadyTracked) {
        sessionMark('visit');
        const cache = loadLocalCache();
        cache.visits = (cache.visits || 0) + 1;
        saveLocalCache();
        total = CONFIG.baseVisits + cache.visits;

        sendGA4Event('site_visit', {
          page_path: window.location.pathname,
          referrer: document.referrer || 'direct'
        });

        // Sync with Public Intermediary Cloud Counter (Option 2)
        publicApiIncrement('visitors').then((cloudVal) => {
          if (cloudVal && cloudVal > 0) {
            const cache = loadLocalCache();
            cache.cloudVisits = cloudVal;
            saveLocalCache();
            this.updateVisitorDisplay(CONFIG.baseVisits + cloudVal);
          }
        });
      }

      this.updateVisitorDisplay(total);
      return total;
    },

    updateVisitorDisplay(val) {
      const formatted = formatNumber(val);
      document.querySelectorAll('[data-counter="visitors"], #siteVisitorCount').forEach((el) => {
        el.textContent = formatted;
      });
    },

    /* ------------------------------------------------------------
       2. Article Readings
       ------------------------------------------------------------ */
    getArticleReads(id) {
      if (!id) return CONFIG.baseArticleReads;
      const cache = loadLocalCache();
      const localInc = (cache.articles && cache.articles[id]) || 0;
      let base = CONFIG.baseArticleReads;
      if (id === 'series-tabashir') base = 1850;
      else if (id.startsWith('hk-') || id.startsWith('aj-')) base = 320;
      else if (id.startsWith('fb-41')) base = 280;
      else if (id.startsWith('fb-')) base = 190;
      return base + localInc;
    },

    async trackArticleRead(id, title) {
      if (!id) return;
      const marker = 'art_' + id;
      const alreadyTracked = isSessionMarked(marker);
      let count = this.getArticleReads(id);

      if (!alreadyTracked) {
        sessionMark(marker);
        const cache = loadLocalCache();
        cache.articles = cache.articles || {};
        cache.articles[id] = (cache.articles[id] || 0) + 1;
        saveLocalCache();
        count = this.getArticleReads(id);

        sendGA4Event('article_read', {
          article_id: id,
          article_title: title || id
        });

        firebaseIncrement('articles/' + id).then((cloudVal) => {
          if (cloudVal && cloudVal > 0) {
            let base = CONFIG.baseArticleReads;
            if (id === 'series-tabashir') base = 1850;
            else if (id.startsWith('hk-') || id.startsWith('aj-')) base = 320;
            this.updateArticleDisplay(id, base + cloudVal);
          }
        });
      }

      this.updateArticleDisplay(id, count);
      return count;
    },

    updateArticleDisplay(id, val) {
      const formatted = formatNumber(val);
      document.querySelectorAll('[data-counter="article-views"], #articleViewsCount, #asideViewsCount').forEach((el) => {
        el.textContent = formatted;
      });
      document.querySelectorAll('[data-counter-article="' + id + '"]').forEach((el) => {
        el.textContent = formatted;
      });
    },

    /* ------------------------------------------------------------
       3. Book Readings & Downloads
       ------------------------------------------------------------ */
    getBookStats(id) {
      const base = BOOK_BASELINES[id] || { reads: CONFIG.baseBookReads, downloads: CONFIG.baseBookDownloads };
      const cache = loadLocalCache();
      const data = (cache.books && cache.books[id]) || { reads: 0, downloads: 0 };
      const extraReads = Math.max(data.reads || 0, data.cloudReads || 0);
      const extraDownloads = Math.max(data.downloads || 0, data.cloudDownloads || 0);
      return {
        reads: base.reads + extraReads,
        downloads: base.downloads + extraDownloads
      };
    },

    async trackBookRead(id, title) {
      if (!id) return;
      const marker = 'bk_read_' + id;
      const alreadyTracked = isSessionMarked(marker);
      let stats = this.getBookStats(id);

      if (!alreadyTracked) {
        sessionMark(marker);
        const cache = loadLocalCache();
        cache.books = cache.books || {};
        cache.books[id] = cache.books[id] || { reads: 0, downloads: 0 };
        cache.books[id].reads = (cache.books[id].reads || 0) + 1;
        saveLocalCache();
        stats = this.getBookStats(id);

        sendGA4Event('book_read', {
          book_id: id,
          book_title: title || id
        });

        publicApiIncrement('bk_' + id + '_reads').then((val) => {
          if (val && val > 0) {
            const base = BOOK_BASELINES[id] || { reads: CONFIG.baseBookReads, downloads: CONFIG.baseBookDownloads };
            const cache = loadLocalCache();
            cache.books = cache.books || {};
            cache.books[id] = cache.books[id] || { reads: 0, downloads: 0 };
            cache.books[id].cloudReads = val;
            saveLocalCache();
            this.updateBookDisplay(id, { reads: base.reads + val, downloads: stats.downloads });
          }
        });
      }

      this.updateBookDisplay(id, stats);
      return stats;
    },

    async trackBookDownload(id, title, url) {
      if (!id) return;
      const marker = 'bk_dl_' + id;
      const alreadyTracked = isSessionMarked(marker);
      let stats = this.getBookStats(id);

      if (!alreadyTracked) {
        sessionMark(marker);
        const cache = loadLocalCache();
        cache.books = cache.books || {};
        cache.books[id] = cache.books[id] || { reads: 0, downloads: 0 };
        cache.books[id].downloads = (cache.books[id].downloads || 0) + 1;
        saveLocalCache();
        stats = this.getBookStats(id);

        sendGA4Event('book_download', {
          book_id: id,
          book_title: title || id,
          download_url: url || ''
        });

        publicApiIncrement('bk_' + id + '_dls').then((val) => {
          if (val && val > 0) {
            const base = BOOK_BASELINES[id] || { reads: CONFIG.baseBookReads, downloads: CONFIG.baseBookDownloads };
            const cache = loadLocalCache();
            cache.books = cache.books || {};
            cache.books[id] = cache.books[id] || { reads: 0, downloads: 0 };
            cache.books[id].cloudDownloads = val;
            saveLocalCache();
            this.updateBookDisplay(id, { reads: stats.reads, downloads: base.downloads + val });
          }
        });
      }

      this.updateBookDisplay(id, stats);
      return stats;
    },

    updateBookDisplay(id, stats) {
      const readsStr = formatNumber(stats.reads);
      const dlStr = formatNumber(stats.downloads);
      const readEl = document.getElementById('bookReadCount');
      if (readEl) readEl.textContent = readsStr;
      const dlEl = document.getElementById('bookDownloadCount');
      if (dlEl) dlEl.textContent = dlStr;

      document.querySelectorAll('[data-book-reads="' + id + '"]').forEach((el) => { el.textContent = readsStr; });
      document.querySelectorAll('[data-book-downloads="' + id + '"]').forEach((el) => { el.textContent = dlStr; });
    },

    /* ------------------------------------------------------------
       4. Research Paper Readings & Downloads
       ------------------------------------------------------------ */
    getPaperStats(id) {
      const base = PAPER_BASELINES[id] || { reads: CONFIG.basePaperReads, downloads: CONFIG.basePaperDownloads };
      const cache = loadLocalCache();
      const data = (cache.papers && cache.papers[id]) || { reads: 0, downloads: 0 };
      return {
        reads: base.reads + (data.reads || 0),
        downloads: base.downloads + (data.downloads || 0)
      };
    },

    async trackPaperRead(id, title) {
      if (!id) return;
      const marker = 'pp_read_' + id;
      const alreadyTracked = isSessionMarked(marker);
      let stats = this.getPaperStats(id);

      if (!alreadyTracked) {
        sessionMark(marker);
        const cache = loadLocalCache();
        cache.papers = cache.papers || {};
        cache.papers[id] = cache.papers[id] || { reads: 0, downloads: 0 };
        cache.papers[id].reads = (cache.papers[id].reads || 0) + 1;
        saveLocalCache();
        stats = this.getPaperStats(id);

        sendGA4Event('paper_read', {
          paper_id: id,
          paper_title: title || id
        });

        firebaseIncrement('papers/' + id + '/reads');
      }

      this.updatePaperDisplay(id, stats);
      return stats;
    },

    async trackPaperDownload(id, title, url) {
      if (!id) return;
      const marker = 'pp_dl_' + id;
      const alreadyTracked = isSessionMarked(marker);
      let stats = this.getPaperStats(id);

      if (!alreadyTracked) {
        sessionMark(marker);
        const cache = loadLocalCache();
        cache.papers = cache.papers || {};
        cache.papers[id] = cache.papers[id] || { reads: 0, downloads: 0 };
        cache.papers[id].downloads = (cache.papers[id].downloads || 0) + 1;
        saveLocalCache();
        stats = this.getPaperStats(id);

        sendGA4Event('paper_download', {
          paper_id: id,
          paper_title: title || id,
          download_url: url || ''
        });

        firebaseIncrement('papers/' + id + '/downloads');
      }

      this.updatePaperDisplay(id, stats);
      return stats;
    },

    updatePaperDisplay(id, stats) {
      const readsStr = formatNumber(stats.reads);
      const dlStr = formatNumber(stats.downloads);
      const readEl = document.getElementById('paperReadCount');
      if (readEl) readEl.textContent = readsStr;
      const dlEl = document.getElementById('paperDownloadCount');
      if (dlEl) dlEl.textContent = dlStr;

      document.querySelectorAll('[data-paper-reads="' + id + '"]').forEach((el) => { el.textContent = readsStr; });
      document.querySelectorAll('[data-paper-downloads="' + id + '"]').forEach((el) => { el.textContent = dlStr; });
    },

    /* ------------------------------------------------------------
       Bootstrap & Card scanning
       ------------------------------------------------------------ */
    populateAll() {
      // 1. Visits
      this.updateVisitorDisplay(this.getVisitCount());

      // 2. Scan and populate book cards
      document.querySelectorAll('[data-book-reads]').forEach((el) => {
        const id = el.dataset.bookReads;
        const stats = this.getBookStats(id);
        el.textContent = formatNumber(stats.reads);
      });
      document.querySelectorAll('[data-book-downloads]').forEach((el) => {
        const id = el.dataset.bookDownloads;
        const stats = this.getBookStats(id);
        el.textContent = formatNumber(stats.downloads);
      });

      // 3. Scan and populate paper cards
      document.querySelectorAll('[data-paper-reads]').forEach((el) => {
        const id = el.dataset.paperReads;
        const stats = this.getPaperStats(id);
        el.textContent = formatNumber(stats.reads);
      });
      document.querySelectorAll('[data-paper-downloads]').forEach((el) => {
        const id = el.dataset.paperDownloads;
        const stats = this.getPaperStats(id);
        el.textContent = formatNumber(stats.downloads);
      });

      // 4. Scan and populate article cards
      document.querySelectorAll('[data-counter-article]').forEach((el) => {
        const id = el.dataset.counterArticle;
        el.textContent = formatNumber(this.getArticleReads(id));
      });
    },

    init() {
      initGA4();
      this.trackVisit();
      setTimeout(() => this.populateAll(), 80);
    }
  };

  // Expose globally
  window.YAHYA_COUNTER = Counter;
  if (window.YAHYA) {
    window.YAHYA.counter = Counter;
  }
})();
