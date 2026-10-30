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
      '<dialog id="pdfDialog" class="pdf-dialog"><div class="modal-shell">' +
      '<div class="pdf-head"><div class="pdf-head-info"><h3 id="pdfTitle"></h3><p id="pdfMeta"></p></div>' +
      '<div class="pdf-actions">' +
      '<a id="pdfDownload" class="btn btn-primary" href="#" download>' + I.download + '<span>' + esc(t('downloadPdf')) + '</span></a>' +
      '<a id="pdfOpen" class="btn btn-ghost" href="#" target="_blank" rel="noopener">' + I.external + '<span>' + esc(t('openTab')) + '</span></a>' +
      '<button class="icon-btn" type="button" data-action="pdf-fullscreen" aria-label="' + esc(t('fullscreen')) + '" title="' + esc(t('fullscreen')) + '">' + I.maximize + '</button>' +
      '<button class="icon-btn" type="button" data-action="close-dialog" aria-label="' + esc(t('close')) + '">' + I.close + '</button>' +
      '</div></div><div class="pdf-frame-wrap"><iframe id="pdfFrame" title="PDF" loading="lazy"></iframe></div></div></dialog>' +
      '<dialog id="citationDialog" class="citation-dialog"><div class="modal-shell">' + close + '<div id="citationBody"></div></div></dialog>' +
      '<div class="toast" id="toast" role="status" aria-live="polite"><div class="toast-inner"></div></div>'
    );

    const pdfDialog = document.getElementById('pdfDialog');
    pdfDialog.addEventListener('close', () => {
      const frame = document.getElementById('pdfFrame');
      if (frame) frame.src = 'about:blank';
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

  function openPdf(url, title, meta) {
    if (!url) return;
    document.getElementById('pdfTitle').textContent = title || 'PDF';
    document.getElementById('pdfMeta').textContent = meta || '';
    const frame = document.getElementById('pdfFrame');
    frame.src = url + '#toolbar=1&navpanes=1&view=FitH';
    const open = document.getElementById('pdfOpen');
    open.href = url;
    const download = document.getElementById('pdfDownload');
    download.href = url;
    download.setAttribute('download', url.split('/').pop() || 'document.pdf');
    openDialog(document.getElementById('pdfDialog'));
  }

  function openBookPdf(id) {
    const book = Y.BOOKS.find((item) => item.id === id);
    if (!book || !book.pdf) return;
    const meta = [book.year, bookTypeLabel(book.typ), book.pages ? book.pages + ' ' + t('pages') : '', publisherOf(book)].filter(Boolean).join(' · ');
    openPdf(book.pdf, titleOf(book), meta);
  }

  function openPaperPdf(id) {
    const paper = Y.PAPERS.find((item) => item.id === id);
    if (!paper || !paper.pdf) return;
    const meta = [paper.year, paperTypeLabel(paper.typ), venueOf(paper)].filter(Boolean).join(' · ');
    openPdf(paper.pdf, titleOf(paper), meta);
  }

  function togglePdfFullscreen() {
    const dialog = document.getElementById('pdfDialog');
    const shell = dialog && dialog.querySelector('.modal-shell');
    if (!shell) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else if (shell.requestFullscreen) {
      shell.requestFullscreen().catch(() => {});
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
