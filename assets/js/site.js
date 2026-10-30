/* ============================================================
   Shared chrome, dialogs, citations, sharing and global actions
   ============================================================ */
(function () {
  'use strict';

  const Y = window.YAHYA;
  if (!Y) return;

  const {
    P, I, t, esc, truncate, formatDate, absolute, articleUrl, bookUrl, paperUrl,
    sourceLabel, titleOf, bookTypeLabel, paperTypeLabel, collectionLabel, subOf,
    summaryOf, venueOf, placeOf, publisherOf, abstractOf, readPref, writePref, SITE_URL
  } = Y;

  const ar = () => (Y.lang || 'ar') === 'ar';

  const DETAIL_TITLES = {
    index: { ar: 'د. يحيى أحمد المرهبي — أكاديمي وباحث ومفكّر تربوي', en: 'Dr. Yahya Ahmed Al-Marhabi — Academic, Researcher & Writer' },
    about: { ar: 'السيرة الأكاديمية — د. يحيى أحمد المرهبي', en: 'Academic Profile — Dr. Yahya Ahmed Al-Marhabi' },
    books: { ar: 'الكتب والرسائل — د. يحيى أحمد المرهبي', en: 'Books & Theses — Dr. Yahya Ahmed Al-Marhabi' },
    research: { ar: 'الأبحاث العلمية — د. يحيى أحمد المرهبي', en: 'Research — Dr. Yahya Ahmed Al-Marhabi' },
    articles: { ar: 'المقالات والكتابات — د. يحيى أحمد المرهبي', en: 'Writing Archive — Dr. Yahya Ahmed Al-Marhabi' },
    '404': { ar: 'الصفحة غير موجودة — د. يحيى أحمد المرهبي', en: 'Page not found — Dr. Yahya Ahmed Al-Marhabi' }
  };

  let navOpen = false;
  let currentCitation = null;
  let currentCitationFormat = 'apa';
  let lastFocused = null;
  let toastTimer = null;

  /* ------------------------------------------------------------
     Header & footer
     ------------------------------------------------------------ */
  function headerHTML() {
    const active = Y.PAGE === 'article' ? 'articles' : Y.PAGE;
    const nav = [
      ['index', 'index.html', 'home'],
      ['about', 'about.html', 'about'],
      ['books', 'books.html', 'books'],
      ['research', 'research.html', 'research'],
      ['articles', 'articles.html', 'articles']
    ];
    const links = nav.map(([key, href, label]) =>
      '<a class="nav-link" href="' + href + '"' + (active === key ? ' aria-current="page"' : '') + '>' +
      '<span class="t-ar">' + esc(Y.COPY.ar[label]) + '</span><span class="t-en">' + esc(Y.COPY.en[label]) + '</span></a>'
    ).join('');
    const mobileLinks = nav.map(([key, href, label]) =>
      '<a href="' + href + '"' + (active === key ? ' aria-current="page"' : '') + '>' +
      '<span class="t-ar">' + esc(Y.COPY.ar[label]) + '</span><span class="t-en">' + esc(Y.COPY.en[label]) + '</span></a>'
    ).join('');

    return '<a class="skip-link" href="#main"><span class="t-ar">' + esc(Y.COPY.ar.skip) + '</span><span class="t-en">' + esc(Y.COPY.en.skip) + '</span></a>' +
      '<header class="site-header" id="siteHeader"><div class="container header-inner">' +
      '<a class="brand" href="index.html" aria-label="' + esc(P.name_en || 'Yahya Al-Marhabi') + '">' +
      '<span class="brand-mark">' + Y.brandMark + '</span>' +
      '<span class="brand-text"><span class="brand-name"><span class="t-ar">د. يحيى المرهبي</span><span class="t-en">Yahya Al-Marhabi</span></span>' +
      '<span class="brand-sub"><span class="t-ar">' + esc(Y.COPY.ar.brandSub) + '</span><span class="t-en">' + esc(Y.COPY.en.brandSub) + '</span></span></span></a>' +
      '<nav class="main-nav" aria-label="' + esc(t('navLabel')) + '">' + links + '</nav>' +
      '<div class="header-actions">' +
      '<div class="lang-toggle" role="group" aria-label="' + esc(t('language')) + '">' +
      '<button class="lang-btn" type="button" data-action="set-lang" data-lang="ar" aria-pressed="false">عربي</button>' +
      '<button class="lang-btn" type="button" data-action="set-lang" data-lang="en" aria-pressed="false">EN</button></div>' +
      '<button class="icon-btn" type="button" data-action="toggle-theme" aria-label="' + esc(t('themeDark')) + '" title="' + esc(t('themeDark')) + '">' + I.moon + '</button>' +
      '<button class="nav-toggle" type="button" data-action="toggle-nav" aria-controls="mobileNav" aria-expanded="false" aria-label="' + esc(t('menu')) + '">' + I.menu + '</button>' +
      '</div></div></header>' +
      '<div class="mobile-nav" id="mobileNav"><div class="mobile-nav-inner">' + mobileLinks +
      '<div class="mobile-lang"><button class="filter-btn" type="button" data-action="set-lang" data-lang="ar">عربي</button><button class="filter-btn" type="button" data-action="set-lang" data-lang="en">English</button></div>' +
      '</div></div>';
  }

  function footerHTML() {
    const navLink = (href, label) => '<li><a href="' + href + '"><span class="t-ar">' + esc(Y.COPY.ar[label]) + '</span><span class="t-en">' + esc(Y.COPY.en[label]) + '</span></a></li>';
    return '<footer class="site-footer"><div class="container">' +
      '<div class="footer-grid">' +
      '<div class="footer-brand"><a class="brand" href="index.html"><span class="brand-mark">' + Y.brandMark + '</span>' +
      '<span class="brand-text"><span class="brand-name"><span class="t-ar">د. يحيى المرهبي</span><span class="t-en">Yahya Al-Marhabi</span></span>' +
      '<span class="brand-sub"><span class="t-ar">' + esc(Y.COPY.ar.brandSub) + '</span><span class="t-en">' + esc(Y.COPY.en.brandSub) + '</span></span></span></a>' +
      '<p><span class="t-ar">' + esc(Y.COPY.ar.footerAbout) + '</span><span class="t-en">' + esc(Y.COPY.en.footerAbout) + '</span></p>' +
      '<div class="social-row">' + Y.socialLinks() + '</div></div>' +
      '<div class="footer-col"><h4><span class="t-ar">' + esc(Y.COPY.ar.footerExplore) + '</span><span class="t-en">' + esc(Y.COPY.en.footerExplore) + '</span></h4><ul>' +
      navLink('index.html', 'home') + navLink('about.html', 'about') + navLink('books.html', 'books') + navLink('research.html', 'research') + navLink('articles.html', 'articles') + '</ul></div>' +
      '<div class="footer-col"><h4><span class="t-ar">' + esc(Y.COPY.ar.footerLibrary) + '</span><span class="t-en">' + esc(Y.COPY.en.footerLibrary) + '</span></h4><ul>' +
      '<li><a href="books.html?cat=self"><span class="t-ar">رباعية الذات الإنسانية</span><span class="t-en">The Human Self Quartet</span></a></li>' +
      '<li><a href="books.html"><span class="t-ar">جميع الكتب والرسائل</span><span class="t-en">All books & theses</span></a></li>' +
      '<li><a href="research.html"><span class="t-ar">الأبحاث المحكّمة</span><span class="t-en">Peer-reviewed research</span></a></li>' +
      '<li><a href="article.html?id=series-tabashir"><span class="t-ar">تباشير الصباح</span><span class="t-en">Morning Glimpses</span></a></li>' +
      '</ul></div>' +
      '<div class="footer-col"><h4><span class="t-ar">' + esc(Y.COPY.ar.footerConnect) + '</span><span class="t-en">' + esc(Y.COPY.en.footerConnect) + '</span></h4><ul>' +
      '<li><a href="mailto:' + esc(P.email) + '">' + esc(P.email) + '</a></li>' +
      '<li><a href="' + esc(P.scholar) + '" target="_blank" rel="noopener"><span class="t-ar">جوجل سكولار</span><span class="t-en">Google Scholar</span></a></li>' +
      '<li><a href="' + esc(P.aljazeera) + '" target="_blank" rel="noopener"><span class="t-ar">الجزيرة نت</span><span class="t-en">Al Jazeera</span></a></li>' +
      '<li><a href="' + esc(P.hekmah) + '" target="_blank" rel="noopener"><span class="t-ar">حكمة يمانية</span><span class="t-en">Hekmah Yamaniya</span></a></li>' +
      '<li><a href="' + Y.CV_PDF + '" target="_blank" rel="noopener"><span class="t-ar">السيرة الذاتية PDF</span><span class="t-en">CV (PDF)</span></a></li>' +
      '</ul></div></div>' +
      '<div class="footer-bottom"><span>© ' + Y.currentYear() + ' ' + esc(P.name_ar || '') + ' — <span class="t-ar">' + esc(Y.COPY.ar.allRights) + '</span><span class="t-en">' + esc(Y.COPY.en.allRights) + '</span></span>' +
      '<span><span class="t-ar">موقع أكاديمي ومكتبة رقمية</span><span class="t-en">Academic portfolio & digital library</span></span></div>' +
      '</div></footer>';
  }

  function renderChrome() {
    const header = document.querySelector('[data-site-header]');
    const footer = document.querySelector('[data-site-footer]');
    if (header) header.innerHTML = headerHTML();
    if (footer) footer.innerHTML = footerHTML();
    updateLangButtons();
    updateThemeButtons();
    syncNavState();
  }

  function updateLangButtons() {
    document.querySelectorAll('[data-action="set-lang"]').forEach((button) => {
      const active = button.dataset.lang === Y.lang;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  function updateThemeButtons() {
    document.documentElement.dataset.theme = Y.theme;
    const dark = Y.theme === 'dark';
    const label = dark ? t('themeLight') : t('themeDark');
    document.querySelectorAll('[data-action="toggle-theme"]').forEach((button) => {
      button.innerHTML = dark ? I.sun : I.moon;
      button.setAttribute('aria-label', label);
      button.setAttribute('title', label);
    });
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', dark ? '#0c1310' : '#0f5b4a');
  }

  function applyPreferences() {
    document.documentElement.lang = Y.lang;
    document.documentElement.dir = Y.lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.dataset.theme = Y.theme;
    updateLangButtons();
    updateThemeButtons();
  }

  function setLanguage(next) {
    if (next !== 'ar' && next !== 'en') return;
    if (next === Y.lang) return;
    closeAllDialogs();
    Y.setLang(next);
    writePref('yahya-lang', next);
    applyPreferences();
    setPageTitle();
    renderChrome();
    if (typeof Y.__pageRender === 'function') Y.__pageRender();
    updateThemeButtons();
    window.scrollTo({ top: window.scrollY, behavior: 'auto' });
  }

  function setTheme(next) {
    Y.setTheme(next);
    writePref('yahya-theme', next);
    updateThemeButtons();
  }

  function toggleTheme() {
    setTheme(Y.theme === 'dark' ? 'light' : 'dark');
  }

  function setPageTitle() {
    const titles = DETAIL_TITLES[Y.PAGE];
    if (!titles) return;
    document.title = Y.lang === 'ar' ? titles.ar : titles.en;
  }

  /* ------------------------------------------------------------
     Mobile navigation & scroll chrome
     ------------------------------------------------------------ */
  function syncNavState() {
    document.body.classList.toggle('nav-open', navOpen);
    document.querySelectorAll('[data-action="toggle-nav"]').forEach((button) => {
      button.setAttribute('aria-expanded', navOpen ? 'true' : 'false');
    });
  }

  function toggleNav(force) {
    navOpen = typeof force === 'boolean' ? force : !navOpen;
    syncNavState();
  }

  function setupScroll() {
    const onScroll = () => {
      const header = document.querySelector('.site-header');
      if (header) header.classList.toggle('scrolled', window.scrollY > 8);
      updateProgress();
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  function updateProgress() {
    const bar = document.getElementById('readingBar');
    if (!bar) return;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const value = max > 0 ? Math.min(100, Math.max(0, (window.scrollY / max) * 100)) : 0;
    bar.style.width = value.toFixed(2) + '%';
  }

  /* ------------------------------------------------------------
     Dialogs
     ------------------------------------------------------------ */
  function ensureDialogs() {
    if (document.getElementById('detailDialog')) return;
    const close = '<button class="modal-close" type="button" data-action="close-dialog" aria-label="' + esc(t('close')) + '">' + I.close + '</button>';
    document.body.insertAdjacentHTML('beforeend',
      '<dialog id="detailDialog" class="detail-dialog"><div class="modal-shell">' + close + '<div id="detailBody"></div></div></dialog>' +
      '<dialog id="pdfDialog" class="pdf-dialog" aria-labelledby="pdfTitle"><div class="modal-shell pdf-shell">' +
      '<div class="pdf-head">' +
      '<div class="pdf-head-info">' +
      '<div class="pdf-head-top"><span class="pdf-badge">' + esc(t('pdfReaderTitle')) + '</span><span id="pdfMeta" class="pdf-meta"></span></div>' +
      '<h3 id="pdfTitle"></h3>' +
      '</div>' +
      '<div class="pdf-actions">' +
      '<a id="pdfDownload" class="btn btn-primary btn-download" href="#" download>' + I.download + '<span>' + esc(t('downloadPdf')) + '</span></a>' +
      '<a id="pdfOpen" class="icon-btn" href="#" target="_blank" rel="noopener" aria-label="' + esc(t('openTab')) + '" title="' + esc(t('openTab')) + '">' + I.external + '</a>' +
      '<button class="icon-btn" type="button" data-action="pdf-fullscreen" aria-label="' + esc(t('fullscreen')) + '" title="' + esc(t('fullscreen')) + '">' + I.maximize + '</button>' +
      '<button class="icon-btn modal-close-btn" type="button" data-action="close-dialog" aria-label="' + esc(t('close')) + '" title="' + esc(t('close')) + '">' + I.close + '</button>' +
      '</div></div>' +
      '<nav class="pdf-mode-nav" aria-label="' + esc(t('readerEngine')) + '">' +
      '<div class="pdf-mode-tabs" role="tablist">' +
      '<button class="pdf-mode-tab active" type="button" role="tab" data-action="pdf-mode" data-mode="builtin" aria-selected="true"><span class="tab-badge">1</span><span>' + esc(t('modeBuiltin')) + '</span></button>' +
      '<button class="pdf-mode-tab" type="button" role="tab" data-action="pdf-mode" data-mode="flipbook" aria-selected="false"><span class="tab-badge">2</span><span>' + esc(t('modeFlipbook')) + '</span></button>' +
      '<button class="pdf-mode-tab" type="button" role="tab" data-action="pdf-mode" data-mode="google" aria-selected="false"><span class="tab-badge">3</span><span>' + esc(t('modeGoogle')) + '</span></button>' +
      '<button class="pdf-mode-tab" type="button" role="tab" data-action="pdf-mode" data-mode="native" aria-selected="false"><span class="tab-badge">4</span><span>' + esc(t('modeNative')) + '</span></button>' +
      '<button id="pdfChaptersTab" class="pdf-mode-tab" type="button" role="tab" data-action="pdf-mode" data-mode="chapters" aria-selected="false" style="display:none;"><span class="tab-badge">5</span><span>' + esc(t('modeChapters')) + '</span></button>' +
      '</div></nav>' +
      '<div class="pdf-views-container">' +
      '<div id="pdfBuiltinView" class="pdf-view-pane active">' +
      '<div class="pdf-subtoolbar">' +
      '<div class="pdf-subgroup">' +
      '<button class="pdf-pill-btn" type="button" data-action="toggle-scroll-mode" title="' + esc(t('viewMode')) + '"><span id="scrollModeIcon">📜</span><span id="scrollModeLabel">' + esc(t('modeContinuous')) + '</span></button>' +
      '<button class="pdf-pill-btn" type="button" data-action="cycle-theme" title="' + esc(t('themeSepia')) + '"><span id="readerThemeIcon">📜</span><span id="readerThemeLabel">' + esc(t('themeSepia')) + '</span></button>' +
      '</div>' +
      '<div class="pdf-subgroup zoom-group">' +
      '<button class="pdf-icon-tool" type="button" data-action="pdf-zoom-out" aria-label="' + esc(t('zoomOut')) + '" title="' + esc(t('zoomOut')) + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg></button>' +
      '<button class="pdf-pill-btn" type="button" data-action="pdf-fit-width" title="' + esc(t('zoomFitWidth')) + '"><span id="zoomPercent">' + esc(t('zoomFitWidth')) + '</span></button>' +
      '<button class="pdf-icon-tool" type="button" data-action="pdf-zoom-in" aria-label="' + esc(t('zoomIn')) + '" title="' + esc(t('zoomIn')) + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg></button>' +
      '</div></div>' +
      '<div id="pdfCanvasContainer" class="pdf-canvas-container theme-sepia" tabindex="0">' +
      '<div id="pdfLoadingSpinner" class="pdf-spinner-box"><div class="pdf-spinner"></div><p id="pdfLoadingText">' + esc(t('loadingPdf')) + '</p></div>' +
      '<div id="pdfErrorBox" class="pdf-error-box" style="display:none;"></div>' +
      '<div id="pdfPagesHost" class="pdf-pages-host"></div>' +
      '</div>' +
      '<div id="pdfBottomBar" class="pdf-bottom-bar" style="display:none;">' +
      '<button id="pdfPrevBtn" class="btn btn-sm btn-ghost pdf-page-btn" type="button" data-action="pdf-prev"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 18l-6-6 6-6"/></svg><span>' + esc(t('pagePrev')) + '</span></button>' +
      '<div class="pdf-page-jump"><span class="pdf-page-lbl">' + esc(t('pageLabel')) + '</span><input id="pdfPageInput" type="number" min="1" max="1" value="1" aria-label="' + esc(t('pageLabel')) + '"><span class="pdf-page-of">' + esc(t('pageOf')) + ' <strong id="pdfTotalPages">1</strong></span></div>' +
      '<button id="pdfNextBtn" class="btn btn-sm btn-ghost pdf-page-btn" type="button" data-action="pdf-next"><span>' + esc(t('pageNext')) + '</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 18l6-6-6-6"/></svg></button>' +
      '</div></div>' +
      '<div id="pdfFlipbookView" class="pdf-view-pane">' +
      '<div class="pdf-subtoolbar flipbook-subtoolbar">' +
      '<div class="pdf-subgroup">' +
      '<button id="flipbookSoundBtn" class="pdf-pill-btn sound-toggle-btn active" type="button" data-action="toggle-flip-sound" title="' + esc(t('flipbookSound')) + '">' +
      '<span class="sound-icon">' + I.volume + '</span>' +
      '<span id="flipbookSoundLabel">' + esc(t('soundOn')) + '</span>' +
      '</button>' +
      '<span class="flipbook-hint-chip">💡 ' + (ar() ? 'انقر على الصفحة أو الأسهم للتقليب' : 'Click page or arrows to turn') + '</span>' +
      '</div>' +
      '<div class="pdf-subgroup">' +
      '<div class="pdf-page-jump">' +
      '<span class="pdf-page-lbl">' + esc(t('pageLabel')) + '</span>' +
      '<input id="flipbookPageInput" type="number" min="1" max="1" value="1" aria-label="' + esc(t('pageLabel')) + '">' +
      '<span class="pdf-page-of">' + esc(t('pageOf')) + ' <strong id="flipbookTotalPages">1</strong></span>' +
      '</div></div></div>' +
      '<div id="flipbookStage" class="flipbook-stage" tabindex="0">' +
      '<div class="flipbook-desk">' +
      '<div id="flipbookBook" class="flipbook-book" data-dir="' + (ar() ? 'rtl' : 'ltr') + '">' +
      '<div class="flipbook-spine"></div>' +
      '<div class="flipbook-page-wrapper page-left" data-action="flip-click-left" title="' + esc(t('flipPrev')) + '">' +
      '<div class="flipbook-page-inner">' +
      '<canvas id="flipCanvasLeft" class="flip-canvas"></canvas>' +
      '<div id="flipPageNumLeft" class="flip-page-number"></div>' +
      '</div>' +
      '<div class="flip-edge-shadow left-edge"></div>' +
      '<button class="flip-nav-arrow arrow-left" type="button" data-action="flip-click-left" aria-label="' + esc(t('flipPrev')) + '" title="' + esc(t('flipPrev')) + '">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 18l-6-6 6-6"/></svg>' +
      '</button>' +
      '</div>' +
      '<div class="flipbook-page-wrapper page-right" data-action="flip-click-right" title="' + esc(t('flipNext')) + '">' +
      '<div class="flipbook-page-inner">' +
      '<canvas id="flipCanvasRight" class="flip-canvas"></canvas>' +
      '<div id="flipPageNumRight" class="flip-page-number"></div>' +
      '</div>' +
      '<div class="flip-edge-shadow right-edge"></div>' +
      '<button class="flip-nav-arrow arrow-right" type="button" data-action="flip-click-right" aria-label="' + esc(t('flipNext')) + '" title="' + esc(t('flipNext')) + '">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 18l6-6-6-6"/></svg>' +
      '</button>' +
      '</div>' +
      '<div id="flipTurningLeaf" class="flip-turning-leaf" style="display:none;">' +
      '<div class="flip-leaf-face flip-leaf-front"><div class="flip-leaf-tint"></div></div>' +
      '<div class="flip-leaf-face flip-leaf-back"><div class="flip-leaf-tint"></div></div>' +
      '</div>' +
      '</div></div></div>' +
      '<div class="pdf-bottom-bar flipbook-bottom-bar">' +
      '<button id="flipPrevBtn" class="btn btn-sm btn-ghost pdf-page-btn" type="button" data-action="flip-prev">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 18l-6-6 6-6"/></svg>' +
      '<span>' + esc(t('flipPrev')) + '</span>' +
      '</button>' +
      '<div id="flipbookStatus" class="flipbook-status-label"></div>' +
      '<button id="flipNextBtn" class="btn btn-sm btn-ghost pdf-page-btn" type="button" data-action="flip-next">' +
      '<span>' + esc(t('flipNext')) + '</span>' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 18l6-6-6-6"/></svg>' +
      '</button>' +
      '</div></div>' + +
      '<div id="pdfGoogleView" class="pdf-view-pane">' +
      '<div class="pdf-notice-bar"><p>' + esc(t('googleNotice')) + '</p><button class="btn btn-sm btn-ghost" type="button" data-action="reload-google">' + esc(t('retry')) + '</button></div>' +
      '<div class="pdf-frame-wrap"><iframe id="pdfGoogleFrame" title="Google Docs Viewer" loading="lazy"></iframe></div>' +
      '</div>' +
      '<div id="pdfNativeView" class="pdf-view-pane">' +
      '<div class="pdf-notice-bar"><p>' + esc(t('nativeNotice')) + '</p></div>' +
      '<div class="pdf-frame-wrap"><iframe id="pdfFrame" title="Native PDF Viewer" loading="lazy"></iframe></div>' +
      '</div>' +
      '<div id="pdfChaptersView" class="pdf-view-pane">' +
      '<div id="pdfChaptersContent" class="pdf-chapters-scroll"></div>' +
      '</div></div></div></dialog>' +
      '<dialog id="citationDialog" class="citation-dialog"><div class="modal-shell">' + close + '<div id="citationBody"></div></div></dialog>' +
      '<div class="toast" id="toast" role="status" aria-live="polite"><div class="toast-inner"></div></div>'
    );

    const pdfDialog = document.getElementById('pdfDialog');
    pdfDialog.addEventListener('close', () => {
      cleanupPdfReader();
      syncModalState();
    });
    document.querySelectorAll('dialog').forEach((dialog) => {
      dialog.addEventListener('click', (event) => {
        if (event.target === dialog) {
          dialog.close();
          syncModalState();
        }
      });
      dialog.addEventListener('close', syncModalState);
      dialog.addEventListener('cancel', () => setTimeout(syncModalState, 0));
    });
    if (window.MutationObserver) {
      const observer = new MutationObserver(syncModalState);
      document.querySelectorAll('dialog').forEach((dialog) => {
        observer.observe(dialog, { attributes: true, attributeFilter: ['open'] });
      });
    }
  }

  function syncModalState() {
    const anyOpen = Array.from(document.querySelectorAll('dialog')).some((dialog) => dialog.open);
    document.body.classList.toggle('modal-open', anyOpen);
  }

  function openDialog(dialog) {
    if (!dialog) return;
    lastFocused = document.activeElement;
    if (!dialog.open) dialog.showModal();
    syncModalState();
    const focusTarget = dialog.querySelector('.modal-close, button, a[href], iframe');
    if (focusTarget) setTimeout(() => focusTarget.focus(), 30);
  }

  function closeAllDialogs() {
    document.querySelectorAll('dialog[open]').forEach((dialog) => dialog.close());
    syncModalState();
    if (lastFocused && typeof lastFocused.focus === 'function') {
      try { lastFocused.focus(); } catch (e) { /* ignore */ }
    }
  }

  function toast(message) {
    const root = document.getElementById('toast');
    if (!root) return;
    root.querySelector('.toast-inner').textContent = message;
    root.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => root.classList.remove('show'), 2400);
  }

  /* ------------------------------------------------------------
     Books, papers, PDFs
     ------------------------------------------------------------ */
  function openBook(id) {
    ensureDialogs();
    const book = Y.BOOKS.find((item) => item.id === id);
    if (!book) return;
    const chapters = Array.isArray(book.chapters) ? book.chapters : [];
    const links = [];
    if (book.external_url) links.push('<a href="' + esc(book.external_url) + '" target="_blank" rel="noopener">' + I.external + 'فولابوك / Foulabook</a>');
    if (book.noor_url) links.push('<a href="' + esc(book.noor_url) + '" target="_blank" rel="noopener">' + I.bookOpen + 'نور / Noor</a>');
    const body =
      '<div class="book-modal-grid"><div class="book-modal-cover">' + Y.bookCover(book, true) + '</div>' +
      '<div class="book-modal-info"><div class="eyebrow">' + esc(bookTypeLabel(book.typ)) + ' · ' + esc(book.year) + '</div>' +
      '<h2 class="' + (Y.titleIsArabicOnly(book) ? 'ar-text' : '') + '">' + esc(titleOf(book)) + '</h2>' +
      '<p class="book-modal-sub">' + esc(subOf(book)) + '</p>' +
      '<div class="modal-meta"><span class="chip">' + esc(book.year) + '</span>' +
      (book.pages ? '<span class="chip">' + esc(book.pages) + ' ' + esc(t('pages')) + '</span>' : '') +
      '<span class="chip">' + esc(collectionLabel(book.cat)) + '</span>' +
      '<span class="chip">' + esc(publisherOf(book)) + '</span></div>' +
      '<div class="modal-actions">' +
      (book.pdf ? '<button class="btn btn-primary" type="button" data-action="pdf-book" data-id="' + esc(book.id) + '">' + I.bookOpen + esc(t('readNow')) + '</button>' : '') +
      '<button class="btn btn-ghost" type="button" data-action="cite-book" data-id="' + esc(book.id) + '">' + I.quote + esc(t('cite')) + '</button>' +
      '<button class="btn btn-ghost" type="button" data-action="share-book" data-id="' + esc(book.id) + '">' + I.share + esc(t('share')) + '</button>' +
      (book.pdf ? '<a class="btn btn-ghost" href="' + esc(book.pdf) + '" download>' + I.download + esc(t('downloadPdf')) + '</a>' : '') +
      '</div>' +
      '<div class="modal-section"><h3>' + esc(t('summary')) + '</h3><p>' + esc(summaryOf(book)) + '</p></div>' +
      (chapters.length ? '<div class="modal-section"><h3>' + esc(t('contents')) + '</h3><div class="chapter-list">' +
        chapters.map((chapter, index) => '<details class="chapter-item"><summary>' + esc(chapter.title_ar || chapter.title_en || (t('part') + ' ' + (index + 1))) + '</summary><p>' + esc(chapter.text_ar || chapter.text_en || '') + '</p></details>').join('') +
        '</div></div>' : '') +
      (links.length ? '<div class="modal-links">' + links.join('') + '</div>' : '') +
      '</div></div>';
    document.getElementById('detailBody').innerHTML = body;
    openDialog(document.getElementById('detailDialog'));
  }

  function openPaper(id) {
    ensureDialogs();
    const paper = Y.PAPERS.find((item) => item.id === id);
    if (!paper) return;
    const doi = paper.doi || '';
    const body =
      '<div class="book-modal-grid paper-modal-grid">' +
      '<div class="paper-emblem"><div class="eyebrow">' + esc(paperTypeLabel(paper.typ)) + '</div>' +
      '<div class="paper-emblem-icon">' + I.file + '</div><div class="paper-emblem-year">' + esc(paper.year) + '</div>' +
      '<div class="paper-emblem-venue">' + esc(venueOf(paper)) + '</div></div>' +
      '<div class="book-modal-info"><div class="eyebrow">' + esc(paperTypeLabel(paper.typ)) + ' · ' + esc(paper.year) + '</div>' +
      '<h2 class="' + (Y.titleIsArabicOnly(paper) ? 'ar-text' : '') + '">' + esc(titleOf(paper)) + '</h2>' +
      '<p class="book-modal-sub">' + esc(subOf(paper)) + '</p>' +
      '<div class="modal-meta"><span class="chip">' + esc(paper.year) + '</span><span class="chip">' + esc(venueOf(paper)) + '</span>' +
      (placeOf(paper) ? '<span class="chip">' + esc(placeOf(paper)) + '</span>' : '') + (doi ? '<span class="chip chip--green">DOI</span>' : '') + '</div>' +
      '<div class="modal-actions">' +
      (paper.pdf ? '<button class="btn btn-primary" type="button" data-action="pdf-paper" data-id="' + esc(paper.id) + '">' + I.bookOpen + esc(t('readPdf')) + '</button>' : '') +
      '<button class="btn btn-ghost" type="button" data-action="cite-paper" data-id="' + esc(paper.id) + '">' + I.quote + esc(t('cite')) + '</button>' +
      '<button class="btn btn-ghost" type="button" data-action="share-paper" data-id="' + esc(paper.id) + '">' + I.share + esc(t('share')) + '</button>' +
      (doi ? '<a class="btn btn-ghost" href="' + esc(doi) + '" target="_blank" rel="noopener">' + I.link + esc(t('openDoi')) + '</a>' : '') +
      '</div>' +
      '<div class="modal-section"><h3>' + esc(t('abstract')) + '</h3><p>' + esc(abstractOf(paper)) + '</p></div>' +
      (paper.external_url || paper.pdf ? '<div class="modal-links">' +
        (paper.pdf ? '<a href="' + esc(paper.pdf) + '" target="_blank" rel="noopener">' + I.file + esc(t('pdfAvailable')) + '</a>' : '') +
        (paper.external_url ? '<a href="' + esc(paper.external_url) + '" target="_blank" rel="noopener">' + I.external + esc(t('external')) + '</a>' : '') +
        (doi ? '<a href="' + esc(doi) + '" target="_blank" rel="noopener">' + I.link + esc(doi) + '</a>' : '') +
        '</div>' : '') +
      '</div></div>';
    document.getElementById('detailBody').innerHTML = body;
    openDialog(document.getElementById('detailDialog'));
  }

  /* ------------------------------------------------------------
     PDF Reader Engine (Multi-Method & Mobile-Optimized)
     ------------------------------------------------------------ */
  let pdfState = {
    url: '',
    title: '',
    meta: '',
    item: null,
    mode: 'builtin', // 'builtin' | 'flipbook' | 'google' | 'native' | 'chapters'
    doc: null,
    currentLoadedUrl: '',
    currentPage: 1,
    totalPages: 1,
    scaleMode: 'fit-width',
    currentScale: 1,
    scrollMode: 'continuous', // default continuous
    theme: 'sepia',           // default warm / sepia
    soundEnabled: true,       // default sound on
    flipPage: 1,
    isFlipping: false,
    touchStartX: 0,
    touchStartY: 0,
    touchStartTime: 0,
    renderTask: null,
    pdfJsPromise: null
  };

  function playPageFlipSound() {
    if (!pdfState.soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!window._flipAudioCtx) {
        window._flipAudioCtx = new AudioCtx();
      }
      const ctx = window._flipAudioCtx;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      const duration = 0.28;
      const bufferSize = Math.floor(ctx.sampleRate * duration);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        output[i] = (b0 + b1 + b2) * 0.25;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.Q.value = 1.25;
      filter.frequency.setValueAtTime(1600, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(360, ctx.currentTime + duration);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.36, ctx.currentTime + 0.045);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start();
    } catch (e) {
      /* AudioContext gesture requirement */
    }
  }

  function toggleFlipSound() {
    pdfState.soundEnabled = !pdfState.soundEnabled;
    const btn = document.getElementById('flipbookSoundBtn');
    const lbl = document.getElementById('flipbookSoundLabel');
    if (btn && lbl) {
      btn.classList.toggle('active', pdfState.soundEnabled);
      lbl.textContent = esc(t(pdfState.soundEnabled ? 'soundOn' : 'soundOff'));
      const iconSpan = btn.querySelector('.sound-icon');
      if (iconSpan) iconSpan.innerHTML = pdfState.soundEnabled ? I.volume : I.volumeMute;
    }
    if (pdfState.soundEnabled) {
      playPageFlipSound();
    }
  }

  function loadPdfJsScript() {
    if (window.pdfjsLib) {
      if (!window.pdfjsLib.GlobalWorkerOptions.workerSrc) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'assets/js/vendor/pdf.worker.min.js';
      }
      return Promise.resolve(window.pdfjsLib);
    }
    if (pdfState.pdfJsPromise) return pdfState.pdfJsPromise;

    pdfState.pdfJsPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'assets/js/vendor/pdf.min.js';
      script.onload = () => {
        if (window.pdfjsLib) {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'assets/js/vendor/pdf.worker.min.js';
          resolve(window.pdfjsLib);
        } else {
          fallbackCdn();
        }
      };
      script.onerror = () => fallbackCdn();

      function fallbackCdn() {
        const cdnScript = document.createElement('script');
        cdnScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        cdnScript.onload = () => {
          if (window.pdfjsLib) {
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            resolve(window.pdfjsLib);
          } else {
            reject(new Error('PDF.js could not be loaded'));
          }
        };
        cdnScript.onerror = () => reject(new Error('Failed to load PDF engine'));
        document.head.appendChild(cdnScript);
      }

      document.head.appendChild(script);
    });

    return pdfState.pdfJsPromise;
  }

  function openPdf(url, title, meta, item) {
    if (!url) return;
    ensureDialogs();
    pdfState.url = url;
    pdfState.title = title || 'PDF';
    pdfState.meta = meta || '';
    pdfState.item = item || null;
    pdfState.currentPage = 1;
    pdfState.flipPage = 1;
    pdfState.scrollMode = 'continuous'; // default continuous scroll
    pdfState.theme = 'sepia';           // default warm / sepia mode

    document.getElementById('pdfTitle').textContent = pdfState.title;
    document.getElementById('pdfMeta').textContent = pdfState.meta;

    const download = document.getElementById('pdfDownload');
    download.href = url;
    const filename = url.split('/').pop() || 'document.pdf';
    download.setAttribute('download', filename);

    const open = document.getElementById('pdfOpen');
    open.href = url;

    // Apply default warm sepia theme
    const container = document.getElementById('pdfCanvasContainer');
    if (container) {
      container.classList.remove('theme-night');
      container.classList.add('theme-sepia');
    }
    const themeIcon = document.getElementById('readerThemeIcon');
    const themeLbl = document.getElementById('readerThemeLabel');
    if (themeIcon) themeIcon.textContent = '📜';
    if (themeLbl) themeLbl.textContent = esc(t('themeSepia'));

    const scrollModeLabel = document.getElementById('scrollModeLabel');
    const scrollModeIcon = document.getElementById('scrollModeIcon');
    if (scrollModeLabel) scrollModeLabel.textContent = esc(t('modeContinuous'));
    if (scrollModeIcon) scrollModeIcon.textContent = '📜';

    const bottomBar = document.getElementById('pdfBottomBar');
    if (bottomBar) bottomBar.style.display = 'none';

    // Check if chapters tab should be available
    const chaptersTab = document.getElementById('pdfChaptersTab');
    if (item && Array.isArray(item.chapters) && item.chapters.length > 0) {
      chaptersTab.style.display = '';
    } else {
      chaptersTab.style.display = 'none';
      if (pdfState.mode === 'chapters') pdfState.mode = 'builtin';
    }

    openDialog(document.getElementById('pdfDialog'));
    switchPdfMode(pdfState.mode || 'builtin');
    initPdfTouchEvents();
  }

  function switchPdfMode(mode) {
    pdfState.mode = mode;
    document.querySelectorAll('.pdf-mode-tab').forEach((tab) => {
      const isActive = tab.dataset.mode === mode;
      tab.classList.toggle('active', isActive);
      tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    // Toggle panes
    const builtinView = document.getElementById('pdfBuiltinView');
    const flipbookView = document.getElementById('pdfFlipbookView');
    const googleView = document.getElementById('pdfGoogleView');
    const nativeView = document.getElementById('pdfNativeView');
    const chaptersView = document.getElementById('pdfChaptersView');

    if (builtinView) builtinView.classList.toggle('active', mode === 'builtin');
    if (flipbookView) flipbookView.classList.toggle('active', mode === 'flipbook');
    if (googleView) googleView.classList.toggle('active', mode === 'google');
    if (nativeView) nativeView.classList.toggle('active', mode === 'native');
    if (chaptersView) chaptersView.classList.toggle('active', mode === 'chapters');

    if (mode === 'builtin') {
      if (!pdfState.doc || pdfState.currentLoadedUrl !== pdfState.url) {
        loadBuiltinPdf();
      } else {
        renderCurrentPage();
      }
    } else if (mode === 'flipbook') {
      if (!pdfState.doc || pdfState.currentLoadedUrl !== pdfState.url) {
        loadBuiltinPdf().then(() => {
          renderFlipbookSpread();
        }).catch(() => {});
      } else {
        renderFlipbookSpread();
      }
    } else if (mode === 'google') {
      loadGoogleViewer();
    } else if (mode === 'native') {
      loadNativeViewer();
    } else if (mode === 'chapters') {
      renderChaptersView();
    }
  }

  function loadGoogleViewer() {
    const frame = document.getElementById('pdfGoogleFrame');
    // Ensure URL is absolute for Google's servers
    let absUrl = pdfState.url;
    if (!/^https?:\/\//i.test(absUrl)) {
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:') {
        absUrl = 'https://almerhby.github.io/' + absUrl.replace(/^\.\//, '');
      } else {
        absUrl = new URL(absUrl, window.location.href).href;
      }
    }
    frame.src = 'https://docs.google.com/viewer?url=' + encodeURIComponent(absUrl) + '&embedded=true';
  }

  function reloadGoogleViewer() {
    loadGoogleViewer();
  }

  function loadNativeViewer() {
    const frame = document.getElementById('pdfFrame');
    frame.src = encodeURI(pdfState.url) + '#toolbar=1&navpanes=1&view=FitH';
  }

  function loadBuiltinPdf() {
    const spinner = document.getElementById('pdfLoadingSpinner');
    const errorBox = document.getElementById('pdfErrorBox');
    const host = document.getElementById('pdfPagesHost');
    if (spinner) spinner.style.display = 'flex';
    if (errorBox) errorBox.style.display = 'none';
    if (host) host.innerHTML = '';

    const cMapUrl = 'assets/js/vendor/cmaps/';
    const standardFontDataUrl = 'assets/js/vendor/standard_fonts/';

    const tryLoad = (useCdnFallback) => {
      return loadPdfJsScript().then((pdfjs) => {
        return pdfjs.getDocument({
          url: encodeURI(pdfState.url),
          cMapUrl: useCdnFallback ? 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/' : cMapUrl,
          cMapPacked: true,
          standardFontDataUrl: useCdnFallback ? 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/standard_fonts/' : standardFontDataUrl,
          enableXfa: true,
          useSystemFonts: false,
          isEvalSupported: false
        }).promise;
      });
    };

    return tryLoad(false)
      .catch((err) => {
        console.warn('Retrying PDF with CDN CMaps...', err);
        return tryLoad(true);
      })
      .then((doc) => {
        pdfState.doc = doc;
        pdfState.currentLoadedUrl = pdfState.url;
        pdfState.totalPages = doc.numPages;
        pdfState.currentPage = 1;
        pdfState.flipPage = 1;
        if (spinner) spinner.style.display = 'none';
        const totalPagesEl = document.getElementById('pdfTotalPages');
        if (totalPagesEl) totalPagesEl.textContent = String(doc.numPages);
        const pageInput = document.getElementById('pdfPageInput');
        if (pageInput) {
          pageInput.max = String(doc.numPages);
          pageInput.value = '1';
        }
        const flipTotal = document.getElementById('flipbookTotalPages');
        if (flipTotal) flipTotal.textContent = String(doc.numPages);
        const flipInput = document.getElementById('flipbookPageInput');
        if (flipInput) {
          flipInput.max = String(doc.numPages);
          flipInput.value = '1';
        }
        if (pdfState.mode === 'flipbook') {
          renderFlipbookSpread();
        } else {
          renderCurrentPage();
        }
        return doc;
      })
      .catch((err) => {
        if (spinner) spinner.style.display = 'none';
        if (errorBox) {
          errorBox.style.display = 'block';
          errorBox.innerHTML =
            '<p>' + esc(t('loadError')) + '</p>' +
            '<div class="pdf-error-actions">' +
            '<button class="btn btn-primary" type="button" data-action="pdf-mode" data-mode="google">' + esc(t('modeGoogle')) + '</button>' +
            '<button class="btn btn-ghost" type="button" data-action="pdf-mode" data-mode="native">' + esc(t('modeNative')) + '</button>' +
            '<a class="btn btn-ghost" href="' + esc(pdfState.url) + '" download>' + I.download + esc(t('downloadPdf')) + '</a>' +
            '</div>';
        }
        console.warn('PDF.js loading note:', err);
        throw err;
      });
  }

  function renderCurrentPage() {
    if (!pdfState.doc) return;
    if (pdfState.scrollMode === 'continuous') {
      renderContinuousPages();
      return;
    }
    renderSinglePage(pdfState.currentPage);
  }

  function renderSinglePage(pageNum) {
    if (!pdfState.doc) return;
    pageNum = Math.max(1, Math.min(pageNum, pdfState.totalPages));
    pdfState.currentPage = pageNum;

    // Update UI controls
    const pageInput = document.getElementById('pdfPageInput');
    if (pageInput) pageInput.value = String(pageNum);
    const prevBtn = document.getElementById('pdfPrevBtn');
    if (prevBtn) prevBtn.disabled = pageNum <= 1;
    const nextBtn = document.getElementById('pdfNextBtn');
    if (nextBtn) nextBtn.disabled = pageNum >= pdfState.totalPages;

    if (pdfState.renderTask) {
      try { pdfState.renderTask.cancel(); } catch (e) { /* ignore */ }
      pdfState.renderTask = null;
    }

    pdfState.doc.getPage(pageNum).then((page) => {
      const container = document.getElementById('pdfCanvasContainer');
      const host = document.getElementById('pdfPagesHost');
      const containerWidth = Math.max(280, container.clientWidth - 28);
      const unscaledViewport = page.getViewport({ scale: 1 });

      let scale;
      if (pdfState.scaleMode === 'fit-width') {
        scale = containerWidth / unscaledViewport.width;
        pdfState.currentScale = scale;
        const zp = document.getElementById('zoomPercent');
        if (zp) zp.textContent = esc(t('zoomFitWidth'));
      } else {
        scale = pdfState.currentScale;
        const zp = document.getElementById('zoomPercent');
        if (zp) zp.textContent = Math.round(scale * 100) + '%';
      }

      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      const viewport = page.getViewport({ scale: scale * dpr });

      let canvas = host.querySelector('#pdfSingleCanvas');
      if (!canvas) {
        host.innerHTML = '';
        canvas = document.createElement('canvas');
        canvas.id = 'pdfSingleCanvas';
        canvas.className = 'pdf-page-canvas';
        host.appendChild(canvas);
      }

      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      canvas.style.width = Math.floor(viewport.width / dpr) + 'px';
      canvas.style.height = Math.floor(viewport.height / dpr) + 'px';

      const ctx = canvas.getContext('2d', { alpha: false });
      pdfState.renderTask = page.render({ canvasContext: ctx, viewport });
      pdfState.renderTask.promise.then(() => {
        pdfState.renderTask = null;
        container.scrollTop = 0;
      }).catch((err) => {
        if (err && err.name === 'RenderingCancelledException') return;
        console.error('Render error', err);
      });
    });
  }

  function renderContinuousPages() {
    if (!pdfState.doc) return;
    const host = document.getElementById('pdfPagesHost');
    host.innerHTML = '';
    const container = document.getElementById('pdfCanvasContainer');
    const containerWidth = Math.max(280, container.clientWidth - 28);
    const count = Math.min(pdfState.totalPages, 20);

    for (let i = 1; i <= count; i++) {
      const wrapper = document.createElement('div');
      wrapper.className = 'pdf-continuous-page';
      wrapper.dataset.page = String(i);
      const canvas = document.createElement('canvas');
      canvas.className = 'pdf-page-canvas';
      wrapper.appendChild(canvas);
      host.appendChild(wrapper);

      ((pageNum, c) => {
        pdfState.doc.getPage(pageNum).then((page) => {
          const unscaled = page.getViewport({ scale: 1 });
          const scale = pdfState.scaleMode === 'fit-width' ? (containerWidth / unscaled.width) : pdfState.currentScale;
          const dpr = Math.min(window.devicePixelRatio || 1, 2);
          const vp = page.getViewport({ scale: scale * dpr });
          c.width = Math.floor(vp.width);
          c.height = Math.floor(vp.height);
          c.style.width = Math.floor(vp.width / dpr) + 'px';
          c.style.height = Math.floor(vp.height / dpr) + 'px';
          const ctx = c.getContext('2d', { alpha: false });
          page.render({ canvasContext: ctx, viewport: vp });
        });
      })(i, canvas);
    }
  }

  function changePdfPage(delta) {
    if (!pdfState.doc) return;
    renderSinglePage(pdfState.currentPage + delta);
  }

  function setPdfPage(num) {
    if (!pdfState.doc || isNaN(num)) return;
    renderSinglePage(num);
  }

  function zoomPdf(action) {
    if (action === 'fit-width') {
      pdfState.scaleMode = 'fit-width';
    } else if (typeof action === 'number') {
      pdfState.scaleMode = 'manual';
      pdfState.currentScale = Math.max(0.4, Math.min(3.5, (pdfState.currentScale || 1) + action));
    }
    renderCurrentPage();
  }

  function toggleScrollMode() {
    pdfState.scrollMode = pdfState.scrollMode === 'flip' ? 'continuous' : 'flip';
    const isFlip = pdfState.scrollMode === 'flip';
    document.getElementById('scrollModeLabel').textContent = esc(t(isFlip ? 'modeFlip' : 'modeContinuous'));
    document.getElementById('scrollModeIcon').textContent = isFlip ? '📖' : '📜';
    const bottomBar = document.getElementById('pdfBottomBar');
    if (bottomBar) bottomBar.style.display = isFlip ? 'flex' : 'none';
    renderCurrentPage();
  }

  function cycleReaderTheme() {
    const container = document.getElementById('pdfCanvasContainer');
    if (pdfState.theme === 'default') {
      pdfState.theme = 'night';
      container.classList.remove('theme-sepia');
      container.classList.add('theme-night');
      document.getElementById('readerThemeIcon').textContent = '🌙';
      document.getElementById('readerThemeLabel').textContent = esc(t('themeNight'));
    } else if (pdfState.theme === 'night') {
      pdfState.theme = 'sepia';
      container.classList.remove('theme-night');
      container.classList.add('theme-sepia');
      document.getElementById('readerThemeIcon').textContent = '📜';
      document.getElementById('readerThemeLabel').textContent = esc(t('themeSepia'));
    } else {
      pdfState.theme = 'default';
      container.classList.remove('theme-night', 'theme-sepia');
      document.getElementById('readerThemeIcon').textContent = '☀️';
      document.getElementById('readerThemeLabel').textContent = esc(t('themeDefault'));
    }
  }

  function renderChaptersView() {
    const content = document.getElementById('pdfChaptersContent');
    if (!pdfState.item) {
      content.innerHTML = '<p class="muted center" style="padding:40px">' + esc(t('noResultsText')) + '</p>';
      return;
    }
    const book = pdfState.item;
    const chapters = Array.isArray(book.chapters) ? book.chapters : [];
    content.innerHTML =
      '<div class="pdf-book-brief">' +
      '<div class="brief-head">' +
      '<h3>' + esc(titleOf(book)) + '</h3>' +
      (subOf(book) ? '<p class="brief-sub">' + esc(subOf(book)) + '</p>' : '') +
      '</div>' +
      '<div class="brief-summary"><h4>' + esc(t('summary')) + '</h4><p>' + esc(summaryOf(book)) + '</p></div>' +
      '<div class="brief-chapters"><h4>' + esc(t('contents')) + ' (' + chapters.length + ')</h4>' +
      chapters.map((ch, idx) =>
        '<details class="pdf-ch-item"' + (idx === 0 ? ' open' : '') + '>' +
        '<summary><span class="ch-num">' + (idx + 1) + '</span><span class="ch-title">' + esc(ch.title_ar || ch.title_en || (t('part') + ' ' + (idx + 1))) + '</span></summary>' +
        '<div class="ch-text">' + esc(ch.text_ar || ch.text_en || '').replace(/\n/g, '<br>') + '</div>' +
        '</details>'
      ).join('') +
      '</div></div>';
  }

  function renderFlipbookSpread() {
    if (!pdfState.doc) return;
    const stage = document.getElementById('flipbookStage');
    if (!stage) return;
    const bookEl = document.getElementById('flipbookBook');
    const stageW = Math.max(280, stage.clientWidth - 32);
    const stageH = Math.max(380, stage.clientHeight - 24);
    const isSingle = stageW < 768;

    if (bookEl) {
      bookEl.classList.toggle('is-single-page', isSingle);
    }

    const cur = pdfState.flipPage || 1;
    const total = pdfState.totalPages || 1;

    const flipInput = document.getElementById('flipbookPageInput');
    if (flipInput) {
      flipInput.value = String(cur);
      flipInput.max = String(total);
    }
    const flipTotal = document.getElementById('flipbookTotalPages');
    if (flipTotal) flipTotal.textContent = String(total);

    const prevBtn = document.getElementById('flipPrevBtn');
    if (prevBtn) prevBtn.disabled = cur <= 1;

    const nextBtn = document.getElementById('flipNextBtn');
    if (nextBtn) {
      if (isSingle) {
        nextBtn.disabled = cur >= total;
      } else {
        nextBtn.disabled = cur === 1 ? (total <= 1) : (cur + 1 >= total);
      }
    }

    const statusEl = document.getElementById('flipbookStatus');
    if (statusEl) {
      if (isSingle || cur === 1) {
        statusEl.textContent = (ar() ? 'صفحة ' : 'Page ') + cur + ' ' + (ar() ? 'من ' : 'of ') + total;
      } else {
        const rightNum = cur;
        const leftNum = Math.min(total, cur + 1);
        statusEl.textContent = (ar() ? 'صفحتان ' : 'Pages ') + rightNum + ' - ' + leftNum + ' ' + (ar() ? 'من ' : 'of ') + total;
      }
    }

    const maxPageW = isSingle ? Math.min(stageW - 16, 540) : Math.min((stageW - 36) / 2, 480);
    const maxPageH = Math.min(stageH - 16, 680);

    const canvasR = document.getElementById('flipCanvasRight');
    const canvasL = document.getElementById('flipCanvasLeft');
    const numR = document.getElementById('flipPageNumRight');
    const numL = document.getElementById('flipPageNumLeft');

    if (isSingle) {
      if (numR) numR.textContent = (ar() ? 'صفحة ' : 'Page ') + cur;
      renderFlipPageToCanvas(cur, canvasR, maxPageW, maxPageH);
    } else {
      if (cur === 1) {
        if (numR) numR.textContent = (ar() ? 'الغلاف · ص 1' : 'Cover · Page 1');
        renderFlipPageToCanvas(1, canvasR, maxPageW, maxPageH);
        if (canvasL) renderInsideCover(canvasL, maxPageW, maxPageH);
        if (numL) numL.textContent = '';
      } else {
        const rightPage = cur;
        const leftPage = cur + 1;
        if (numR) numR.textContent = (ar() ? 'صفحة ' : 'Page ') + rightPage;
        renderFlipPageToCanvas(rightPage, canvasR, maxPageW, maxPageH);

        if (leftPage <= total) {
          if (numL) numL.textContent = (ar() ? 'صفحة ' : 'Page ') + leftPage;
          renderFlipPageToCanvas(leftPage, canvasL, maxPageW, maxPageH);
        } else {
          if (canvasL) renderInsideCover(canvasL, maxPageW, maxPageH);
          if (numL) numL.textContent = '';
        }
      }
    }
  }

  function renderFlipPageToCanvas(pageNum, canvas, maxWidth, maxHeight) {
    if (!pdfState.doc || !canvas || pageNum < 1 || pageNum > pdfState.totalPages) return;
    pdfState.doc.getPage(pageNum).then((page) => {
      const unscaled = page.getViewport({ scale: 1 });
      const scaleW = maxWidth / unscaled.width;
      const scaleH = maxHeight / unscaled.height;
      const scale = Math.min(scaleW, scaleH);
      const dpr = Math.min(window.devicePixelRatio || 1, 2.2);
      const vp = page.getViewport({ scale: scale * dpr });

      canvas.width = Math.floor(vp.width);
      canvas.height = Math.floor(vp.height);
      canvas.style.width = Math.floor(vp.width / dpr) + 'px';
      canvas.style.height = Math.floor(vp.height / dpr) + 'px';

      const ctx = canvas.getContext('2d', { alpha: false });
      page.render({ canvasContext: ctx, viewport: vp });
    }).catch((err) => {
      console.warn('Flip page render error', err);
    });
  }

  function renderInsideCover(canvas, maxWidth, maxHeight) {
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.floor(maxWidth * 0.75 * dpr);
    const h = Math.floor(maxHeight * 0.9 * dpr);
    canvas.width = Math.max(200, w);
    canvas.height = Math.max(300, h);
    canvas.style.width = Math.floor(canvas.width / dpr) + 'px';
    canvas.style.height = Math.floor(canvas.height / dpr) + 'px';
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, '#fbf8f0');
    grad.addColorStop(0.5, '#f4ece0');
    grad.addColorStop(1, '#ebe0cf');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'rgba(110, 85, 60, 0.18)';
    ctx.font = 'bold ' + Math.floor(canvas.width * 0.055) + 'px "Scheherazade New", serif, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(pdfState.title || 'د. يحيى أحمد المرهبي', canvas.width / 2, canvas.height / 2);
  }

  function flipbookTurn(direction) {
    if (!pdfState.doc || pdfState.isFlipping) return;
    const stage = document.getElementById('flipbookStage');
    const isSingle = stage && (stage.clientWidth - 32 < 768);
    const total = pdfState.totalPages;
    const cur = pdfState.flipPage || 1;

    let targetPage;
    if (isSingle) {
      targetPage = cur + direction;
    } else {
      if (direction > 0) {
        targetPage = (cur === 1) ? 2 : cur + 2;
      } else {
        targetPage = (cur <= 3) ? 1 : cur - 2;
      }
    }

    if (targetPage < 1 || targetPage > total) {
      if (direction > 0 && cur < total) {
        targetPage = total;
      } else {
        return;
      }
    }
    if (targetPage === cur) return;

    pdfState.isFlipping = true;
    playPageFlipSound();

    const bookEl = document.getElementById('flipbookBook');
    const leaf = document.getElementById('flipTurningLeaf');

    if (bookEl && leaf) {
      const isNext = direction > 0;
      const turnClass = isNext ? 'flip-anim-next' : 'flip-anim-prev';
      leaf.style.display = 'block';
      bookEl.classList.add(turnClass);

      setTimeout(() => {
        pdfState.flipPage = targetPage;
        renderFlipbookSpread();
        bookEl.classList.remove(turnClass);
        leaf.style.display = 'none';
        pdfState.isFlipping = false;
      }, 520);
    } else {
      pdfState.flipPage = targetPage;
      renderFlipbookSpread();
      pdfState.isFlipping = false;
    }
  }

  function initPdfTouchEvents() {
    const container = document.getElementById('pdfCanvasContainer');
    if (container && !container.dataset.touchBound) {
      container.dataset.touchBound = 'true';

      container.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
          pdfState.touchStartX = e.touches[0].clientX;
          pdfState.touchStartY = e.touches[0].clientY;
          pdfState.touchStartTime = Date.now();
        }
      }, { passive: true });

      container.addEventListener('touchend', (e) => {
        if (pdfState.scrollMode !== 'flip') return;
        if (!e.changedTouches || e.changedTouches.length === 0) return;
        const dx = e.changedTouches[0].clientX - pdfState.touchStartX;
        const dy = e.changedTouches[0].clientY - pdfState.touchStartY;
        const dt = Date.now() - pdfState.touchStartTime;
        if (dt < 600 && Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.4) {
          if (dx < 0) {
            changePdfPage(1); // Swipe left -> Next page
          } else {
            changePdfPage(-1); // Swipe right -> Previous page
          }
        }
      }, { passive: true });
    }

    const flipStage = document.getElementById('flipbookStage');
    if (flipStage && !flipStage.dataset.touchBound) {
      flipStage.dataset.touchBound = 'true';
      let touchStartX = 0, touchStartY = 0, touchStartTime = 0;
      flipStage.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
          touchStartX = e.touches[0].clientX;
          touchStartY = e.touches[0].clientY;
          touchStartTime = Date.now();
        }
      }, { passive: true });

      flipStage.addEventListener('touchend', (e) => {
        if (!e.changedTouches || e.changedTouches.length === 0) return;
        const dx = e.changedTouches[0].clientX - touchStartX;
        const dy = e.changedTouches[0].clientY - touchStartY;
        const dt = Date.now() - touchStartTime;
        if (dt < 600 && Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.3) {
          if (dx < 0) {
            flipbookTurn(1); // Swipe left -> Next
          } else {
            flipbookTurn(-1); // Swipe right -> Prev
          }
        }
      }, { passive: true });
    }

    const pageInput = document.getElementById('pdfPageInput');
    if (pageInput && !pageInput.dataset.bound) {
      pageInput.dataset.bound = 'true';
      pageInput.addEventListener('change', (e) => {
        setPdfPage(parseInt(e.target.value, 10));
      });
      pageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          setPdfPage(parseInt(e.target.value, 10));
          pageInput.blur();
        }
      });
    }

    const flipInput = document.getElementById('flipbookPageInput');
    if (flipInput && !flipInput.dataset.bound) {
      flipInput.dataset.bound = 'true';
      flipInput.addEventListener('change', (e) => {
        const val = parseInt(e.target.value, 10);
        if (!isNaN(val) && val >= 1 && val <= pdfState.totalPages) {
          pdfState.flipPage = val;
          renderFlipbookSpread();
        }
      });
      flipInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const val = parseInt(e.target.value, 10);
          if (!isNaN(val) && val >= 1 && val <= pdfState.totalPages) {
            pdfState.flipPage = val;
            renderFlipbookSpread();
            flipInput.blur();
          }
        }
      });
    }

    if (!window._pdfEventsBound) {
      window._pdfEventsBound = true;
      // Keyboard navigation when dialog is open
      window.addEventListener('keydown', (e) => {
        const dialog = document.getElementById('pdfDialog');
        if (!dialog || !dialog.open) return;
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          if (pdfState.mode === 'flipbook') {
            flipbookTurn(ar() ? -1 : 1);
          } else {
            changePdfPage(ar() ? -1 : 1);
          }
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          if (pdfState.mode === 'flipbook') {
            flipbookTurn(ar() ? 1 : -1);
          } else {
            changePdfPage(ar() ? 1 : -1);
          }
        }
      });

      window.addEventListener('resize', () => {
        const dialog = document.getElementById('pdfDialog');
        if (dialog && dialog.open) {
          if (pdfState.mode === 'builtin' && pdfState.scaleMode === 'fit-width') {
            renderCurrentPage();
          } else if (pdfState.mode === 'flipbook') {
            renderFlipbookSpread();
          }
        }
      }, { passive: true });
    }
  }

  function cleanupPdfReader() {
    if (pdfState.renderTask) {
      try { pdfState.renderTask.cancel(); } catch (e) { /* ignore */ }
      pdfState.renderTask = null;
    }
    const frame = document.getElementById('pdfFrame');
    if (frame) frame.src = 'about:blank';
    const googleFrame = document.getElementById('pdfGoogleFrame');
    if (googleFrame) googleFrame.src = 'about:blank';
    const host = document.getElementById('pdfPagesHost');
    if (host) host.innerHTML = '';
    const shell = document.querySelector('.pdf-shell');
    if (shell) shell.classList.remove('is-fullscreen');
    pdfState.isFlipping = false;
  }

  function openBookPdf(id) {
    const book = Y.BOOKS.find((item) => item.id === id);
    if (!book || !book.pdf) return;
    const meta = [book.year, bookTypeLabel(book.typ), book.pages ? book.pages + ' ' + t('pages') : '', publisherOf(book)].filter(Boolean).join(' · ');
    openPdf(book.pdf, titleOf(book), meta, book);
  }

  function openPaperPdf(id) {
    const paper = Y.PAPERS.find((item) => item.id === id);
    if (!paper || !paper.pdf) return;
    const meta = [paper.year, paperTypeLabel(paper.typ), venueOf(paper)].filter(Boolean).join(' · ');
    openPdf(paper.pdf, titleOf(paper), meta, paper);
  }

  function openCvPdf() {
    const title = ar() ? 'السيرة الذاتية — د. يحيى أحمد المرهبي' : 'Academic CV — Dr. Yahya Al-Marhabi';
    const meta = ar() ? 'نسخة 2025 · عربية وإنجليزية' : '2025 Edition · Arabic & English';
    openPdf(Y.CV_PDF, title, meta, null);
  }

  function togglePdfFullscreen() {
    const dialog = document.getElementById('pdfDialog');
    const shell = dialog && dialog.querySelector('.modal-shell');
    if (!shell) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
      shell.classList.remove('is-fullscreen');
    } else if (shell.requestFullscreen) {
      shell.requestFullscreen().catch(() => {
        shell.classList.toggle('is-fullscreen');
      });
    } else {
      shell.classList.toggle('is-fullscreen');
    }
  }

  /* ------------------------------------------------------------
     Citation engine
     ------------------------------------------------------------ */
  function bibSafe(value) {
    return String(value || '').replace(/\\/g, '\\textbackslash{}').replace(/[{}]/g, '').replace(/&/g, '\\&').replace(/%/g, '\\%').replace(/_/g, '\\_').replace(/#/g, '\\#');
  }

  function bibUrlSafe(value) {
    return String(value || '').replace(/\\/g, '').replace(/[{}]/g, '').replace(/\s+/g, '');
  }

  function asciiKey(value) {
    return String(value || '')
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '')
      .slice(0, 18);
  }

  function citationParts(kind, item) {
    const ar = Y.lang === 'ar';
    const year = item.year || (item.date ? String(item.date).slice(0, 4) : '');
    const title = ar ? item.title_ar || item.title_en || '' : item.title_en || item.title_ar || '';
    const titleOther = ar ? item.title_en || item.title_ar || '' : item.title_ar || item.title_en || '';
    let published = '';
    let source = '';
    let url = '';
    let extra = '';
    if (kind === 'book') {
      source = publisherOf(item);
      url = absolute(bookUrl(item.id));
      extra = item.doi || '';
    } else if (kind === 'paper') {
      source = venueOf(item);
      url = item.doi || item.external_url || absolute(paperUrl(item.id));
      extra = item.doi || '';
    } else {
      source = sourceLabel(item.source);
      url = item.source_url || absolute(articleUrl(item.id));
      published = item.date || '';
      extra = '';
    }
    return { ar, year, title, titleOther, source, url, published, extra };
  }

  function apaCitation(kind, item) {
    const p = citationParts(kind, item);
    const author = p.ar ? 'المرهبي، يحيى أحمد.' : 'Al-Marhabi, Y. A.';
    if (kind === 'book') {
      return p.ar
        ? author + ' (' + p.year + '). ' + p.title + '. ' + p.source + '. ' + p.url
        : author + ' (' + p.year + '). ' + p.title + '. ' + p.source + '. ' + p.url;
    }
    if (kind === 'paper') {
      const tail = p.extra ? ' ' + p.extra : '';
      return p.ar
        ? author + ' (' + p.year + '). ' + p.title + '. ' + p.source + '.' + tail
        : author + ' (' + p.year + '). ' + p.title + '. ' + p.source + '.' + tail;
    }
    const d = Y.dateObj(p.published);
    let date = p.year;
    if (d) {
      date = p.ar ? p.year + '، ' + d.getDate() + ' ' + ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'][d.getMonth()] : p.year + ', ' + ['January','February','March','April','May','June','July','August','September','October','November','December'][d.getMonth()] + ' ' + d.getDate();
    }
    return p.ar
      ? author + ' (' + date + '). ' + p.title + '. ' + p.source + '. ' + p.url
      : author + ' (' + date + '). ' + p.title + '. ' + p.source + '. ' + p.url;
  }

  function mlaCitation(kind, item) {
    const p = citationParts(kind, item);
    const author = p.ar ? 'المرهبي، يحيى أحمد.' : 'Al-Marhabi, Yahya Ahmed.';
    const title = p.ar ? '«' + p.title + '».' : '"' + p.title + '."';
    if (kind === 'book') {
      return p.ar
        ? author + ' ' + title + ' ' + p.source + '، ' + p.year + '. ' + p.url
        : author + ' ' + title + ' ' + p.source + ', ' + p.year + '. ' + p.url;
    }
    if (kind === 'paper') {
      return p.ar
        ? author + ' ' + title + ' ' + p.source + '، ' + p.year + '.' + (p.extra ? ' ' + p.extra : '')
        : author + ' ' + title + ' ' + p.source + ', ' + p.year + '.' + (p.extra ? ' ' + p.extra : '');
    }
    const d = Y.dateObj(p.published);
    const date = d ? (p.ar ? d.getDate() + ' ' + ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'][d.getMonth()] + ' ' + d.getFullYear() : ['January','February','March','April','May','June','July','August','September','October','November','December'][d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear()) : p.year;
    return p.ar
      ? author + ' ' + title + ' ' + p.source + '، ' + date + '، ' + p.url + '.'
      : author + ' ' + title + ' ' + p.source + ', ' + date + ', ' + p.url + '.';
  }

  function bibtexCitation(kind, item) {
    const p = citationParts(kind, item);
    const titleEn = item.title_en || item.title_ar || item.id;
    let type = 'misc';
    let fields = [];
    if (kind === 'book') {
      type = 'book';
      fields = [['author', 'Al-Marhabi, Yahya Ahmed'], ['title', titleEn], ['year', p.year], ['publisher', item.pub_en || item.pub_ar || ''], ['address', 'Yemen']];
    } else if (kind === 'paper') {
      type = item.typ === 'conference' ? 'inproceedings' : 'article';
      fields = [['author', 'Al-Marhabi, Yahya Ahmed'], ['title', titleEn], ['year', p.year], [item.typ === 'conference' ? 'booktitle' : 'journal', item.venue_en || item.venue_ar || ''], ['address', item.place_en || item.place_ar || '']];
      if (item.doi) fields.push(['doi', String(item.doi).replace(/^https?:\/\/doi.org\//, '')]);
    } else {
      type = 'misc';
      fields = [['author', 'Al-Marhabi, Yahya Ahmed'], ['title', titleEn], ['year', p.year], ['howpublished', item.source === 'hekmah' ? 'Hekmah Yamaniya' : item.source === 'aljazeera' ? 'Al Jazeera Net' : 'Facebook'], ['note', 'Arabic essay']];
    }
    fields.push(['language', 'Arabic']);
    fields.push(['url', p.url]);
    fields.push(['urldate', Y.isoToday()]);
    const key = 'almarhabi' + p.year + asciiKey(titleEn) || item.id;
    const lines = fields.filter((f) => f[1]).map((f) => {
      const safe = (f[0] === 'url' || f[0] === 'doi') ? bibUrlSafe(f[1]) : bibSafe(f[1]);
      return '  ' + f[0] + ' = {' + safe + '}';
    });
    return '@' + type + '{' + key.replace(/[^a-zA-Z0-9]/g, '') + ',\n' + lines.join(',\n') + '\n}';
  }

  function citationText(format) {
    if (!currentCitation) return '';
    const { kind, item } = currentCitation;
    if (format === 'mla') return mlaCitation(kind, item);
    if (format === 'bibtex') return bibtexCitation(kind, item);
    return apaCitation(kind, item);
  }

  function citationUrl(kind, item) {
    if (kind === 'book') return absolute(bookUrl(item.id));
    if (kind === 'paper') return item.doi || item.external_url || absolute(paperUrl(item.id));
    return item.source_url || absolute(articleUrl(item.id));
  }

  function openCitation(kind, id) {
    let item = null;
    if (kind === 'book') item = Y.BOOKS.find((x) => x.id === id);
    else if (kind === 'paper') item = Y.PAPERS.find((x) => x.id === id);
    else item = Y.INDEX.find((x) => x.id === id);
    if (!item) return;
    currentCitation = { kind, item };
    currentCitationFormat = 'apa';
    renderCitationDialog();
    openDialog(document.getElementById('citationDialog'));
  }

  function renderCitationDialog() {
    if (!currentCitation) return;
    const { kind, item } = currentCitation;
    const tabs = Y.citationTabLabels().map(([key, label]) =>
      '<button class="citation-tab" type="button" role="tab" data-action="set-citation" data-format="' + key + '" aria-selected="false">' + esc(label) + '</button>'
    ).join('');
    document.getElementById('citationBody').innerHTML =
      '<div class="citation-inner"><h2>' + esc(t('citeThis')) + '</h2>' +
      '<p class="sub">' + esc(titleOf(item)) + ' · ' + esc(item.year || (item.date || '').slice(0, 4)) + '</p>' +
      '<div class="citation-tabs" role="tablist">' + tabs + '</div>' +
      '<div class="citation-box"><div class="citation-text" id="citationText"></div>' +
      '<button class="copy-btn" type="button" data-action="copy-citation">' + I.copy + '<span>' + esc(t('copy')) + '</span></button></div>' +
      '<div class="citation-foot"><span>' + esc(P.name_ar || '') + ' · ' + esc(t('accessed')) + ' ' + esc(formatDate(Y.isoToday())) + '</span>' +
      '<a href="' + esc(citationUrl(kind, item)) + '" target="_blank" rel="noopener">' + esc(t('originalSource')) + ' ' + I.external + '</a></div></div>';
    setCitationFormat('apa');
  }

  function setCitationFormat(format) {
    currentCitationFormat = format;
    const text = citationText(format);
    const box = document.getElementById('citationText');
    if (box) {
      box.textContent = text;
      box.classList.toggle('ar', format !== 'bibtex' && Y.lang === 'ar');
    }
    document.querySelectorAll('[data-action="set-citation"]').forEach((button) => {
      const active = button.dataset.format === format;
      button.classList.toggle('active', active);
      button.setAttribute('aria-selected', active ? 'true' : 'false');
    });
  }

  /* ------------------------------------------------------------
     Copy, share, toast
     ------------------------------------------------------------ */
  function copyText(text) {
    return new Promise((resolve) => {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(resolve).catch(() => resolve(fallbackCopy(text)));
      } else {
        resolve(fallbackCopy(text));
      }
    });
  }

  function fallbackCopy(text) {
    try {
      const area = document.createElement('textarea');
      area.value = text;
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand('copy');
      area.remove();
      return ok;
    } catch (e) {
      return false;
    }
  }

  function shareItem(kind, id) {
    let item = null;
    let url = '';
    if (kind === 'book') {
      item = Y.BOOKS.find((x) => x.id === id);
      url = absolute(bookUrl(id));
    } else if (kind === 'paper') {
      item = Y.PAPERS.find((x) => x.id === id);
      url = item && item.doi ? item.doi : absolute(paperUrl(id));
    } else {
      item = Y.INDEX.find((x) => x.id === id);
      url = absolute(articleUrl(id));
    }
    if (!item) return;
    const title = titleOf(item);
    if (navigator.share && window.isSecureContext) {
      navigator.share({ title, text: title, url }).catch(() => {});
      return;
    }
    copyText(url).then((ok) => toast(ok ? t('linkCopied') : t('copyFailed')));
  }

  /* ------------------------------------------------------------
     Global event handlers
     ------------------------------------------------------------ */
  function handleAction(event) {
    const el = event.target.closest('[data-action]');
    if (!el) return;
    const action = el.dataset.action;
    const modifier = event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;

    if (['open-book', 'open-paper', 'pdf-book', 'pdf-paper'].includes(action) && modifier) return;

    switch (action) {
      case 'toggle-nav':
        event.preventDefault();
        toggleNav();
        break;
      case 'set-lang':
        event.preventDefault();
        setLanguage(el.dataset.lang);
        break;
      case 'toggle-theme':
        event.preventDefault();
        toggleTheme();
        break;
      case 'open-book':
        event.preventDefault();
        openBook(el.dataset.id);
        break;
      case 'open-paper':
        event.preventDefault();
        openPaper(el.dataset.id);
        break;
      case 'pdf-book':
        event.preventDefault();
        openBookPdf(el.dataset.id);
        break;
      case 'pdf-paper':
        event.preventDefault();
        openPaperPdf(el.dataset.id);
        break;
      case 'pdf-cv':
        event.preventDefault();
        openCvPdf();
        break;
      case 'pdf-mode':
        event.preventDefault();
        switchPdfMode(el.dataset.mode);
        break;
      case 'toggle-flip-sound':
        event.preventDefault();
        toggleFlipSound();
        break;
      case 'flip-prev':
        event.preventDefault();
        flipbookTurn(-1);
        break;
      case 'flip-next':
        event.preventDefault();
        flipbookTurn(1);
        break;
      case 'flip-click-left':
        event.preventDefault();
        flipbookTurn(ar() ? 1 : -1);
        break;
      case 'flip-click-right':
        event.preventDefault();
        flipbookTurn(ar() ? -1 : 1);
        break;
      case 'pdf-prev':
        event.preventDefault();
        changePdfPage(-1);
        break;
      case 'pdf-next':
        event.preventDefault();
        changePdfPage(1);
        break;
      case 'pdf-zoom-in':
        event.preventDefault();
        zoomPdf(0.25);
        break;
      case 'pdf-zoom-out':
        event.preventDefault();
        zoomPdf(-0.25);
        break;
      case 'pdf-fit-width':
        event.preventDefault();
        zoomPdf('fit-width');
        break;
      case 'toggle-scroll-mode':
        event.preventDefault();
        toggleScrollMode();
        break;
      case 'cycle-theme':
        event.preventDefault();
        cycleReaderTheme();
        break;
      case 'reload-google':
        event.preventDefault();
        reloadGoogleViewer();
        break;
      case 'pdf-fullscreen':
        event.preventDefault();
        togglePdfFullscreen();
        break;
      case 'cite-book':
        event.preventDefault();
        openCitation('book', el.dataset.id);
        break;
      case 'cite-paper':
        event.preventDefault();
        openCitation('paper', el.dataset.id);
        break;
      case 'cite-article':
        event.preventDefault();
        openCitation('article', el.dataset.id);
        break;
      case 'share-book':
        event.preventDefault();
        shareItem('book', el.dataset.id);
        break;
      case 'share-paper':
        event.preventDefault();
        shareItem('paper', el.dataset.id);
        break;
      case 'share-article':
        event.preventDefault();
        shareItem('article', el.dataset.id);
        break;
      case 'copy-citation':
        event.preventDefault();
        copyText(citationText(currentCitationFormat)).then((ok) => {
          toast(ok ? t('copied') : t('copyFailed'));
          if (ok) {
            const span = el.querySelector('span');
            if (span) {
              const previous = span.textContent;
              span.textContent = t('copied');
              setTimeout(() => { span.textContent = previous; }, 1600);
            }
          }
        });
        break;
      case 'set-citation':
        event.preventDefault();
        setCitationFormat(el.dataset.format);
        break;
      case 'close-dialog':
        event.preventDefault();
        {
          const dialog = el.closest('dialog');
          if (dialog) dialog.close();
          syncModalState();
        }
        break;
      case 'print':
        event.preventDefault();
        window.print();
        break;
      case 'font-sm':
        event.preventDefault();
        adjustArticleFont(-1);
        break;
      case 'font-lg':
        event.preventDefault();
        adjustArticleFont(1);
        break;
      default:
        break;
    }
  }

  function adjustArticleFont(delta) {
    const current = Number(readPref('yahya-article-size', '19')) || 19;
    const next = Math.max(16, Math.min(26, current + delta));
    writePref('yahya-article-size', String(next));
    document.documentElement.style.setProperty('--article-size', next + 'px');
  }

  function applyArticleFont() {
    const size = Number(readPref('yahya-article-size', '19')) || 19;
    document.documentElement.style.setProperty('--article-size', Math.max(16, Math.min(26, size)) + 'px');
  }

  function bindEvents() {
    document.addEventListener('click', (event) => {
      if (event.defaultPrevented) return;
      handleAction(event);
    });

    document.addEventListener('click', (event) => {
      const link = event.target.closest('.mobile-nav a, .main-nav a');
      if (link) toggleNav(false);
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && navOpen) toggleNav(false);
      if (event.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) {
        const search = document.querySelector('[data-site-search]');
        if (search) {
          event.preventDefault();
          search.focus();
        }
      }
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 920 && navOpen) toggleNav(false);
    });
  }

  /* ------------------------------------------------------------
     Boot
     ------------------------------------------------------------ */
  function boot() {
    applyPreferences();
    document.documentElement.style.setProperty('--article-size', Math.max(16, Math.min(26, Number(readPref('yahya-article-size', '19')) || 19)) + 'px');
    renderChrome();
    ensureDialogs();
    bindEvents();
    setupScroll();
    setPageTitle();
    const render = Y.pages && Y.pages[Y.PAGE];
    if (typeof render === 'function') {
      Y.__pageRender = render;
      render();
    }
    updateThemeButtons();
    updateLangButtons();
    updateProgress();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  /* expose a few helpers pages may need */
  Y.ui = {
    renderChrome, openBook, openPaper, openPdf, openCitation, toast, setPageTitle,
    setLanguage, setTheme, toggleTheme, copyText, shareItem, openDialog, closeAllDialogs,
    applyArticleFont, adjustArticleFont, updateProgress, updateLangButtons, updateThemeButtons
  };
})();
