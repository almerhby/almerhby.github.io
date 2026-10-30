/* ============================================================
   Dr. Yahya Ahmed Al-Marhabi
   Academic portfolio & digital library — shared application core
   ============================================================ */
(function () {
  'use strict';

  /* ------------------------------------------------------------
     Data & state
     ------------------------------------------------------------ */
  const SITE = window.SITE || {};
  const INDEX = Array.isArray(window.ARTICLE_INDEX) ? window.ARTICLE_INDEX : [];
  const CONTENT = window.ARTICLE_CONTENT || {};
  const PARTS = window.ARTICLE_PARTS || {};
  const P = SITE.profile || {};
  const BOOKS = Array.isArray(SITE.books) ? SITE.books : [];
  const PAPERS = Array.isArray(SITE.papers) ? SITE.papers : [];
  const COLLECTIONS = Array.isArray(SITE.collections) ? SITE.collections : [];
  const PAGE = document.body ? document.body.dataset.page || '' : '';
  const SITE_URL = 'https://almerhby.github.io/';
  const PORTRAIT = 'assets/images/portrait-photo.jpg';
  const CV_PDF = 'assets/pdfs/السيرة الذاتية - د. يحيى أحمد المرهبي 2025.pdf';
  const PAGE_NAMES = ['index', 'about', 'books', 'research', 'articles'];

  let lang = readPref('yahya-lang', 'ar');
  let theme = readPref('yahya-theme', 'light');
  let currentCitation = null;
  let currentCitationFormat = 'apa';
  let lastFocused = null;
  let toastTimer = null;

  function readPref(key, fallback) {
    try { return localStorage.getItem(key) || fallback; } catch (e) { return fallback; }
  }
  function writePref(key, value) {
    try { localStorage.setItem(key, value); } catch (e) { /* ignore */ }
  }

  /* ------------------------------------------------------------
     Tiny helpers
     ------------------------------------------------------------ */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function truncate(value, max) {
    const text = String(value || '').trim();
    return text.length > max ? text.slice(0, max - 1).trimEnd() + '…' : text;
  }

  function normalize(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/[\u064B-\u0652\u0670\u0640]/g, '')
      .replace(/[أإآٱ]/g, 'ا')
      .replace(/ى/g, 'ي')
      .replace(/ة/g, 'ه')
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  const AR_MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  const EN_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const EN_MONTHS_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  function dateObj(value) {
    if (!value) return null;
    const d = new Date(String(value) + 'T12:00:00');
    return isNaN(d.getTime()) ? null : d;
  }

  function formatDate(value, full) {
    const d = dateObj(value);
    if (!d) return String(value || '');
    const day = d.getDate();
    const month = d.getMonth();
    const year = d.getFullYear();
    if (lang === 'ar') return day + ' ' + AR_MONTHS[month] + ' ' + year;
    return full ? EN_MONTHS_FULL[month] + ' ' + day + ', ' + year : day + ' ' + EN_MONTHS[month] + ' ' + year;
  }

  function isoToday() {
    return new Date().toISOString().slice(0, 10);
  }

  function cleanYear(value) {
    return String(value || '').replace(/[م\s]/g, '').replace(/–/g, '–');
  }

  function cleanPeriod(value) {
    return String(value || '').replace(/م(?=\s|$)/g, '').replace(/\s+/g, ' ').trim();
  }

  function readMinutes(n) {
    const value = Number(n) || 1;
    if (lang === 'ar') {
      if (value === 1) return 'دقيقة واحدة';
      if (value === 2) return 'دقيقتان';
      if (value <= 10) return value + ' دقائق';
      return value + ' دقيقة';
    }
    return value + ' min read';
  }

  function readingTime(n) {
    const value = Number(n) || 1;
    return lang === 'ar' ? readMinutes(value) : readMinutes(value);
  }

  function absolute(path) {
    try { return new URL(path, window.location.href).href; } catch (e) { return path; }
  }

  function articleUrl(id) { return 'article.html?id=' + encodeURIComponent(id); }
  function bookUrl(id) { return 'books.html?book=' + encodeURIComponent(id); }
  function paperUrl(id) { return 'research.html?paper=' + encodeURIComponent(id); }

  function stripDir(value) { return value === 'rtl' || value === 'ltr' ? value : 'auto'; }

  /* ------------------------------------------------------------
     Interface copy
     ------------------------------------------------------------ */
  const COPY = {
    ar: {
      skip: 'انتقل إلى المحتوى',
      home: 'الرئيسية', about: 'السيرة', books: 'الكتب', research: 'الأبحاث', articles: 'المقالات',
      brandSub: 'أستاذ أصول التربية', navLabel: 'التنقل الرئيسي',
      themeLight: 'الوضع النهاري', themeDark: 'الوضع الليلي', language: 'اللغة', menu: 'القائمة',
      latestBook: 'أحدث إصدار', readNow: 'اقرأ الآن', details: 'تفاصيل الكتاب', cite: 'استشهد',
      exploreLibrary: 'استكشف المكتبة', aboutCta: 'السيرة الأكاديمية', latestWriting: 'أحدث كتابة',
      selectedLibrary: 'مختارات من المكتبة', selectedLibraryLead: 'كتب ورسائل ودراسات في الإنسان والتربية والفكر، مع نصوصها الكاملة للقراءة والتحميل.',
      browseAll: 'تصفح جميع الكتب', booksCount: 'كتابًا ورسالة', peerReviewed: 'البحث العلمي', peerReviewedLead: 'أبحاث محكّمة ودراسات ميدانية في أصول التربية والسياسات التعليمية وتربية المواطنة.',
      allResearch: 'جميع الأبحاث', recentWriting: 'أحدث الكتابات', recentWritingLead: 'مقالات وخواطر من صفحة الكاتب، ومن «حكمة يمانية» و«الجزيرة نت»، محفوظة بلغتها الأصلية.',
      allWriting: 'جميع المقالات', years: 'سنة عطاء', book: 'كتاب', paper: 'بحث', article: 'مقال',
      fromPage: 'من صفحة الكاتب', readMore: 'اقرأ المقال', source: 'المصدر', published: 'نُشر', category: 'التصنيف',
      search: 'ابحث…', all: 'الكل', filter: 'تصفية', sort: 'ترتيب', newest: 'الأحدث', oldest: 'الأقدم', titleSort: 'العنوان',
      results: 'نتيجة', showing: 'عرض', of: 'من', loadMore: 'عرض المزيد', noResults: 'لا توجد نتائج مطابقة', noResultsText: 'جرّب كلمة بحث أخرى أو أعد ضبط المرشّحات.',
      allBooks: 'كل الكتب', allPapers: 'كل الأبحاث', allArticles: 'كل المقالات', pdf: 'PDF', pages: 'صفحة',
      bookType: 'نوع الإصدار', publisher: 'الناشر', year: 'السنة', collection: 'المجموعة', summary: 'عن هذا الإصدار',
      contents: 'المحتويات', readPdf: 'قراءة PDF', downloadPdf: 'تحميل', openTab: 'فتح في تبويب', fullscreen: 'ملء الشاشة',
      close: 'إغلاق', share: 'مشاركة', copy: 'نسخ', copied: 'تم النسخ', linkCopied: 'تم نسخ الرابط', copyFailed: 'تعذّر النسخ، يمكنك تحديد النص يدويًا.',
      citeThis: 'استشهد بهذا العمل', citationLead: 'اختر صيغة التوثيق ثم انسخها.', apa: 'APA', mla: 'MLA', bibtex: 'BibTeX',
      accessed: 'تاريخ الوصول', originalSource: 'المصدر الأصلي', readOriginal: 'قراءة النص الأصلي', author: 'المؤلف',
      aboutAuthor: 'عن المؤلف', inThisSeries: 'فهرس السلسلة', part: 'الجزء', parts: 'جزءًا', related: 'اقرأ أيضًا',
      backToArticles: 'العودة إلى المقالات', articleNotFound: 'لم نعثر على هذا المقال', articleNotFoundText: 'قد يكون الرابط قديمًا أو غير مكتمل. يمكنك العودة إلى أرشيف المقالات واختيار نص آخر.',
      backHome: 'العودة إلى الرئيسية', print: 'طباعة', fontSize: 'حجم الخط', smaller: 'تصغير الخط', larger: 'تكبير الخط',
      readingNote: 'هذا النص محفوظ كما نُشر في مصدره، مع الحفاظ على لغته العربية. واجهة الموقع ثنائية اللغة، أما نصوص المقالات فتُعرض بلغتها الأصلية.',
      seriesNote: 'سلسلة من خمسين جزءًا، جُمعت هنا في نص واحد متصل مع فهرس للتنقل بين الأجزاء.',
      minuteRead: 'قراءة', tags: 'الوسوم', updated: 'آخر تحديث', allRights: 'جميع الحقوق محفوظة',
      footerAbout: 'أكاديمي وباحث في أصول التربية والسياسات التعليمية، يكتب في الفكر الإسلامي وقضايا الإنسان والنهوض الحضاري.',
      footerExplore: 'استكشف', footerLibrary: 'المكتبة', footerConnect: 'تواصل',
      contactTitle: 'لنتواصل', contactLead: 'للتواصل العلمي والمشاركات الفكرية والاستشارات التربوية، يسعدني أن أسمع منك.',
      emailMe: 'راسلني', cv: 'السيرة الذاتية', downloadCv: 'تحميل السيرة الذاتية PDF',
      bioTitle: 'سيرة أكاديمية', bioLead: 'أكاديمي يمني وباحث في أصول التربية والسياسات التعليمية، يجمع بين العمل الجامعي الميداني والكتابة في الفكر الإسلامي وقضايا النهوض الحضاري.',
      interests: 'مجالات البحث والاهتمام', milestones: 'محطات المسيرة', qualifications: 'المؤهلات العلمية',
      experience: 'الخبرة الأكاديمية', teaching: 'التدريس والإشراف', positions: 'المناصب الإدارية',
      development: 'التطوير المهني', activities: 'الأنشطة العلمية', training: 'الدورات التدريبية',
      phd: 'دكتوراه', yearsExp: 'سنة خبرة', downloadCvNote: 'نسخة محدّثة 2025 — بالعربية والإنجليزية',
      academicProfile: 'الملف الأكاديمي', biography: 'نبذة', researchInterests: 'الاهتمامات البحثية',
      allSources: 'كل المصادر', facebook: 'فيسبوك', hekmah: 'حكمة يمانية', aljazeera: 'الجزيرة نت',
      latestFrom: 'أحدث ما نُشر', series: 'سلسلة', partOf: 'من سلسلة', viewSeries: 'تصفح السلسلة',
      libraryLead: 'مكتبة رقمية تضم الكتب والرسائل والدراسات، مع أغلفة مولّدة ونصوص كاملة للقراءة داخل الموقع.',
      researchLead: 'أبحاث محكّمة ودراسات ميدانية وأوراق مؤتمرات في التربية والسياسات وتربية المواطنة، مع الملخصات وروابط التوثيق.',
      articlesLead: 'أرشيف كتابة الدكتور يحيى المرهبي: مقالات وخواطر وقراءات نُشرت في فيسبوك وحكمة يمانية والجزيرة نت، محفوظة بلغتها الأصلية.',
      type: 'النوع', venue: 'المجلة / المنبر', place: 'المكان', doi: 'DOI', abstract: 'الملخص',
      openDoi: 'فتح DOI', external: 'رابط خارجي', pdfAvailable: 'النص الكامل PDF', noPdf: 'لا يتوفر ملف PDF لهذا العمل.',
      journals: 'دوريات محكّمة', conferences: 'مؤتمرات', studies: 'دراسات', page: 'صفحة',
      allYears: 'كل السنوات', errorTitle: 'الصفحة غير موجودة', errorText: 'قد يكون الرابط قديمًا أو تمت إعادة تسمية الصفحة. يمكنك العودة إلى الرئيسية أو تصفح المكتبة.',
      seconds: 'ثوانٍ', read: 'قراءة'
    },
    en: {
      skip: 'Skip to content',
      home: 'Home', about: 'About', books: 'Books', research: 'Research', articles: 'Writing',
      brandSub: 'Educational Foundations', navLabel: 'Main navigation',
      themeLight: 'Light mode', themeDark: 'Dark mode', language: 'Language', menu: 'Menu',
      latestBook: 'Latest release', readNow: 'Read now', details: 'Book details', cite: 'Cite',
      exploreLibrary: 'Explore the library', aboutCta: 'Academic profile', latestWriting: 'Latest writing',
      selectedLibrary: 'Selected library', selectedLibraryLead: 'Books, theses and studies on the human being, education and ideas — with full texts to read or download.',
      browseAll: 'Browse all books', booksCount: 'books & theses', peerReviewed: 'Research', peerReviewedLead: 'Peer-reviewed studies and field research in educational foundations, policy and citizenship education.',
      allResearch: 'All research', recentWriting: 'Recent writing', recentWritingLead: 'Essays and reflections from the author’s page, Hekmah Yamaniya and Al Jazeera — preserved in their original Arabic.',
      allWriting: 'All writing', years: 'years of work', book: 'book', paper: 'paper', article: 'article',
      fromPage: 'From the author’s page', readMore: 'Read essay', source: 'Source', published: 'Published', category: 'Category',
      search: 'Search…', all: 'All', filter: 'Filter', sort: 'Sort', newest: 'Newest', oldest: 'Oldest', titleSort: 'Title',
      results: 'results', showing: 'Showing', of: 'of', loadMore: 'Load more', noResults: 'No matching results', noResultsText: 'Try another search term or reset the filters.',
      allBooks: 'All books', allPapers: 'All research', allArticles: 'All writing', pdf: 'PDF', pages: 'pages',
      bookType: 'Publication type', publisher: 'Publisher', year: 'Year', collection: 'Collection', summary: 'About this work',
      contents: 'Contents', readPdf: 'Read PDF', downloadPdf: 'Download', openTab: 'Open in new tab', fullscreen: 'Fullscreen',
      close: 'Close', share: 'Share', copy: 'Copy', copied: 'Copied', linkCopied: 'Link copied', copyFailed: 'Copy failed — select the text manually.',
      citeThis: 'Cite this work', citationLead: 'Choose a citation style, then copy it.', apa: 'APA', mla: 'MLA', bibtex: 'BibTeX',
      accessed: 'Accessed', originalSource: 'Original source', readOriginal: 'Read the original', author: 'Author',
      aboutAuthor: 'About the author', inThisSeries: 'Series index', part: 'Part', parts: 'parts', related: 'Read next',
      backToArticles: 'Back to writing', articleNotFound: 'This essay could not be found', articleNotFoundText: 'The link may be old or incomplete. Return to the archive and choose another text.',
      backHome: 'Back to home', print: 'Print', fontSize: 'Text size', smaller: 'Decrease text size', larger: 'Increase text size',
      readingNote: 'This text is preserved as originally published, in Arabic. The site interface is bilingual; the essays themselves are presented in their original language.',
      seriesNote: 'A fifty-part series, collected here as one continuous text with an index for navigation between parts.',
      minuteRead: 'read', tags: 'Tags', updated: 'Last updated', allRights: 'All rights reserved',
      footerAbout: 'An academic and writer in educational foundations and policy, working on Islamic thought, the human being and civilisational renewal.',
      footerExplore: 'Explore', footerLibrary: 'Library', footerConnect: 'Connect',
      contactTitle: 'Let us connect', contactLead: 'For academic correspondence, public writing and educational consultancy, I would be glad to hear from you.',
      emailMe: 'Email me', cv: 'CV', downloadCv: 'Download CV (PDF)',
      bioTitle: 'Academic profile', bioLead: 'A Yemeni academic and researcher in educational foundations and policy, bringing field-based university work into conversation with Islamic thought and public reflection on civilisational renewal.',
      interests: 'Research interests', milestones: 'Milestones', qualifications: 'Qualifications',
      experience: 'Academic experience', teaching: 'Teaching & supervision', positions: 'Administrative positions',
      development: 'Professional development', activities: 'Academic activities', training: 'Training courses',
      phd: 'PhD', yearsExp: 'years of experience', downloadCvNote: 'Updated 2025 edition — Arabic and English',
      academicProfile: 'Academic profile', biography: 'Biography', researchInterests: 'Research interests',
      allSources: 'All sources', facebook: 'Facebook', hekmah: 'Hekmah Yamaniya', aljazeera: 'Al Jazeera',
      latestFrom: 'Latest publication', series: 'Series', partOf: 'From the series', viewSeries: 'View the series',
      libraryLead: 'A digital library of books, theses and studies, with typographic covers and full texts to read inside the site.',
      researchLead: 'Peer-reviewed research, field studies and conference papers on education, policy and citizenship, with abstracts and citation tools.',
      articlesLead: 'The writing archive of Dr. Yahya Al-Marhabi: essays, reflections and readings published on Facebook, Hekmah Yamaniya and Al Jazeera — preserved in the original Arabic.',
      type: 'Type', venue: 'Journal / venue', place: 'Place', doi: 'DOI', abstract: 'Abstract',
      openDoi: 'Open DOI', external: 'External link', pdfAvailable: 'Full text PDF', noPdf: 'No PDF is available for this work.',
      journals: 'Journal articles', conferences: 'Conference papers', studies: 'Studies', page: 'page',
      allYears: 'All years', errorTitle: 'Page not found', errorText: 'The link may be old or the page may have moved. Return home or browse the library.',
      seconds: 'seconds', read: 'read'
    }
  };

  const t = (key) => (COPY[lang] && COPY[lang][key]) || COPY.ar[key] || key;

  /* ------------------------------------------------------------
     Icons
     ------------------------------------------------------------ */
  const svg = (body, extra) => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"' + (extra || '') + '>' + body + '</svg>';

  const I = {
    menu: svg('<path d="M4 7h16M4 12h16M4 17h16"/>'),
    close: svg('<path d="M6 6l12 12M18 6L6 18"/>'),
    sun: svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41"/>'),
    moon: svg('<path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/>'),
    search: svg('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
    arrow: svg('<path d="M5 12h14M13 5l7 7-7 7"/>'),
    arrowUp: svg('<path d="M12 19V5M5 12l7-7 7 7"/>'),
    arrowUpRight: svg('<path d="M7 17 17 7M8 7h9v9"/>'),
    chevronDown: svg('<path d="m6 9 6 6 6-6"/>'),
    chevron: svg('<path d="m9 18 6-6-6-6"/>'),
    download: svg('<path d="M12 3v12M7 11l5 5 5-5M5 21h14"/>'),
    external: svg('<path d="M14 3h7v7M10 14 21 3M21 14v7H3V3h7"/>'),
    book: svg('<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/>'),
    bookOpen: svg('<path d="M2 4h6a4 4 0 0 1 4 4v12a3 3 0 0 0-3-3H2zM22 4h-6a4 4 0 0 0-4 4v12a3 3 0 0 1 3-3h7z"/>'),
    file: svg('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h6"/>'),
    layers: svg('<path d="m12 2 9 5-9 5-9-5z"/><path d="m3 12 9 5 9-5M3 17l9 5 9-5"/>'),
    quote: svg('<path d="M3 21c3 0 7-1 7-8V5H4v8h3c0 1-1 2-4 2zM14 21c3 0 7-1 7-8V5h-6v8h3c0 1-1 2-4 2z"/>', ' style="fill:currentColor;stroke:none"'),
    mail: svg('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>'),
    cap: svg('<path d="m2 9 10-5 10 5-10 5z"/><path d="M6 11v5c3 2 9 2 12 0v-5M22 9v6"/>'),
    facebook: svg('<path fill="currentColor" stroke="none" d="M14 9h3V6h-3c-2.2 0-4 1.8-4 4v2H7v3h3v6h3v-6h3l1-3h-4v-2c0-.6.4-1 1-1z"/>'),
    youtube: svg('<rect x="2.5" y="6" width="19" height="12" rx="4"/><path fill="currentColor" stroke="none" d="m10 9 5 3-5 3z"/>'),
    whatsapp: svg('<path d="M20.5 11.6a8.4 8.4 0 0 1-12.4 7.4L3 21l2.1-5a8.4 8.4 0 1 1 15.4-4.4z"/><path d="M8.7 8.2c.2 2.5 2.1 4.7 4.6 5.4l1.2-1.3 2.1.9c-.2 1.1-1.2 1.9-2.3 1.8-3.2-.3-5.8-2.9-6.1-6.1-.1-1.1.7-2.1 1.8-2.3l.9 2.1z"/>'),
    globe: svg('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/>'),
    copy: svg('<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/>'),
    check: svg('<path d="m4 12 5 5L20 6"/>'),
    share: svg('<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.8 7.6-4.4M8.2 13.2l7.6 4.4"/>'),
    link: svg('<path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.2 1.2"/><path d="M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.2-1.2"/>'),
    print: svg('<path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="7"/>'),
    calendar: svg('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>'),
    clock: svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
    eye: svg('<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z"/><circle cx="12" cy="12" r="2.5"/>'),
    user: svg('<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6 8-6s8 2 8 6"/>'),
    briefcase: svg('<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18"/>'),
    award: svg('<circle cx="12" cy="9" r="5"/><path d="m8.5 13-1.5 8 5-3 5 3-1.5-8"/>'),
    pin: svg('<path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0z"/><circle cx="12" cy="10" r="2.5"/>'),
    info: svg('<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>'),
    sparkle: svg('<path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z"/>'),
    maximize: svg('<path d="M8 3H3v5M16 3h5v5M8 21H3v-5M21 16v5h-5"/>'),
    star: svg('<path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 9.4l6.1-.9z"/>'),
    pen: svg('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4z"/>'),
    filter: svg('<path d="M4 5h16l-6 7v5l-4 2v-7z"/>'),
    grid: svg('<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>')
  };

  const brandMark = '<svg viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" rx="16" fill="currentColor"/><g fill="none" stroke="#f7f0df" stroke-width="1.25" opacity=".55"><path d="M32 6l6.5 11.5L51 20l-8.5 8.7L44.5 41 32 35.5 19.5 41l2-12.3L13 20l12.5-2.5z"/><circle cx="32" cy="32" r="19"/></g><text x="32" y="43" text-anchor="middle" font-family="Amiri, serif" font-size="30" font-weight="700" fill="#f7f0df">ي</text></svg>';

  /* ------------------------------------------------------------
     Labels & data helpers
     ------------------------------------------------------------ */
  const SOURCES = {
    facebook: { key: 'facebook', short: 'FB', cls: 'fb' },
    hekmah: { key: 'hekmah', short: 'HKM', cls: 'hk' },
    aljazeera: { key: 'aljazeera', short: 'AJ', cls: 'aj' }
  };

  function sourceLabel(src) {
    const info = SOURCES[src] || SOURCES.facebook;
    return t(info.key);
  }

  function sourceBadge(src) {
    const info = SOURCES[src] || SOURCES.facebook;
    return '<span class="source-badge ' + info.cls + '">' + esc(sourceLabel(src)) + '</span>';
  }

  function bookTypeLabel(typ) {
    const map = {
      book: ['كتاب', 'Book'],
      thesis: ['رسالة علمية', 'Thesis'],
      course: ['مادة تدريسية', 'Course material']
    };
    const item = map[typ] || map.book;
    return lang === 'ar' ? item[0] : item[1];
  }

  function paperTypeLabel(typ) {
    const map = {
      journal: ['بحث محكّم', 'Journal article'],
      conference: ['ورقة مؤتمر', 'Conference paper'],
      study: ['دراسة', 'Study']
    };
    const item = map[typ] || map.journal;
    return lang === 'ar' ? item[0] : item[1];
  }

  function articleKindLabel(kind) {
    const map = {
      essay: ['مقال', 'Essay'],
      reflection: ['خاطرة', 'Reflection'],
      opinion: ['رأي', 'Opinion'],
      series: ['سلسلة', 'Series']
    };
    const item = map[kind] || map.essay;
    return lang === 'ar' ? item[0] : item[1];
  }

  function collectionFor(cat) {
    return COLLECTIONS.find((c) => c.id === cat) || null;
  }

  function collectionLabel(cat) {
    const c = collectionFor(cat);
    if (!c) return cat || '';
    return lang === 'ar' ? c.ar : c.en;
  }

  function titleOf(item) {
    if (!item) return '';
    return (lang === 'ar' ? item.title_ar || item.title_en : item.title_en || item.title_ar) || '';
  }

  function titleIsArabicOnly(item) {
    return lang === 'en' && !item.title_en && !!item.title_ar;
  }

  function excerptOf(item) {
    if (!item) return '';
    return (lang === 'ar' ? item.excerpt_ar || item.excerpt_en : item.excerpt_en || item.excerpt_ar) || '';
  }

  function excerptIsArabicOnly(item) {
    return lang === 'en' && !item.excerpt_en && !!item.excerpt_ar;
  }

  function textDirectionClass(item) {
    return titleIsArabicOnly(item) ? ' ar-text' : '';
  }

  function subOf(item) {
    return lang === 'ar' ? item.sub_ar || item.sub_en || '' : item.sub_en || item.sub_ar || '';
  }

  function summaryOf(item) {
    return lang === 'ar' ? item.summary_ar || item.summary_en || '' : item.summary_en || item.summary_ar || '';
  }

  function venueOf(item) {
    return lang === 'ar' ? item.venue_ar || item.venue_en || '' : item.venue_en || item.venue_ar || '';
  }

  function placeOf(item) {
    return lang === 'ar' ? item.place_ar || item.place_en || '' : item.place_en || item.place_ar || '';
  }

  function publisherOf(item) {
    return lang === 'ar' ? item.pub_ar || item.pub_en || '' : item.pub_en || item.pub_ar || '';
  }

  function abstractOf(item) {
    return lang === 'ar' ? item.abs_ar || item.abs_en || '' : item.abs_en || item.abs_ar || '';
  }

  function articleRead(item) {
    if (item.parts_count) return Math.max(1, Number(item.read) || 1);
    return Math.max(1, Number(item.read) || 3);
  }

  function articleHref(item) { return articleUrl(item.id); }

  function sortArticles(list, mode) {
    const copy = list.slice();
    if (mode === 'oldest') copy.sort((a, b) => String(a.date).localeCompare(String(b.date)));
    else copy.sort((a, b) => String(b.date).localeCompare(String(a.date)));
    return copy;
  }

  function sortBooks(list, mode) {
    const copy = list.slice();
    if (mode === 'oldest') copy.sort((a, b) => Number(a.year) - Number(b.year));
    else if (mode === 'title') copy.sort((a, b) => titleOf(a).localeCompare(titleOf(b), lang === 'ar' ? 'ar' : 'en'));
    else copy.sort((a, b) => Number(b.year) - Number(a.year));
    return copy;
  }

  function sortPapers(list, mode) {
    const copy = list.slice();
    if (mode === 'oldest') copy.sort((a, b) => Number(a.year) - Number(b.year));
    else if (mode === 'title') copy.sort((a, b) => titleOf(a).localeCompare(titleOf(b), lang === 'ar' ? 'ar' : 'en'));
    else copy.sort((a, b) => Number(b.year) - Number(a.year));
    return copy;
  }

  function matchQuery(haystack, needle) {
    if (!needle) return true;
    return normalize(haystack).includes(needle);
  }

  /* ------------------------------------------------------------
     Shared components
     ------------------------------------------------------------ */
  function portrait(size) {
    return '<img src="' + PORTRAIT + '" alt="' + esc(t('author')) + ' ' + esc(P.name_ar || '') + '" loading="lazy" ' + (size ? 'width="' + size + '" height="' + size + '"' : '') + '>';
  }

  function socialLinks(compact) {
    const items = [
      ['facebook', P.facebook, I.facebook],
      ['scholar', P.scholar, I.cap],
      ['aljazeera', P.aljazeera, I.globe],
      ['hekmah', P.hekmah, I.pen],
      ['youtube', P.youtube, I.youtube],
      ['whatsapp', P.whatsapp, I.whatsapp],
      ['mail', 'mailto:' + P.email, I.mail]
    ];
    return items.filter((x) => x[1]).map((x) =>
      '<a href="' + esc(x[1]) + '" target="_blank" rel="noopener" aria-label="' + esc(x[0]) + '" title="' + esc(x[0]) + '">' + x[2] + '</a>'
    ).join('');
  }

  function bookCover(book, eager) {
    const title = titleOf(book);
    const cls = title.length > 42 ? ' cover--xlong' : title.length > 28 ? ' cover--long' : '';
    if (book.cover) {
      const docCls = book.typ === 'thesis' || book.typ === 'course' ? ' book-cover--doc' : '';
      return '<div class="book-cover book-cover--photo' + docCls + cls + '" aria-hidden="true">' +
        '<img src="' + esc(book.cover) + '" alt="" loading="' + (eager ? 'eager' : 'lazy') + '" decoding="async">' +
        '</div>';
    }
    const coll = collectionFor(book.cat);
    const series = coll ? (lang === 'ar' ? coll.ar : coll.en) : '';
    return '<div class="book-cover' + cls + '" style="--c1:' + esc(book.c1) + ';--c2:' + esc(book.c2) + ';--accent:' + esc(book.accent) + '" aria-hidden="true">' +
      '<div class="cover-top"><span class="cover-series">' + esc(series) + '</span><span class="cover-mark">' + I.star + '</span></div>' +
      '<div><h3' + (titleIsArabicOnly({ title_en: book.title_en, title_ar: book.title_ar }) ? ' class="ar-text"' : '') + '>' + esc(title) + '</h3>' +
      (subOf(book) ? '<p class="cover-sub">' + esc(truncate(subOf(book), 92)) + '</p>' : '') + '</div>' +
      '<div class="cover-foot"><span class="cover-author">' + esc(P.short_ar && lang === 'ar' ? P.short_ar : P.short_en || P.name_en) + '</span><span class="cover-year">' + esc(book.year) + '</span></div>' +
      '<span class="seal">' + I.star + '</span></div>';
  }

  function bookCard(book) {
    return '<a class="book-card" href="' + bookUrl(book.id) + '" data-action="open-book" data-id="' + esc(book.id) + '" aria-label="' + esc(titleOf(book)) + '">' +
      '<div class="cover-wrap">' + bookCover(book) + '</div>' +
      '<div class="book-info"><h3 class="book-title' + textDirectionClass(book) + '">' + esc(titleOf(book)) + '</h3>' +
      '<div class="book-meta"><span>' + esc(book.year) + '</span><span class="dot"></span><span>' + esc(bookTypeLabel(book.typ)) + '</span>' +
      (book.pages ? '<span class="dot"></span><span>' + esc(book.pages) + ' ' + esc(t('pages')) + '</span>' : '') +
      '</div></div></a>';
  }

  function articleCard(article, featured) {
    const href = articleHref(article);
    const title = titleOf(article);
    const excerpt = excerptOf(article);
    const read = articleRead(article);
    const series = article.parts_count ? '<span class="chip chip--green">' + esc(article.parts_count) + ' ' + esc(t('parts')) + '</span>' : '';
    return '<article class="article-card' + (featured || article.featured ? ' featured' : '') + '">' +
      '<div class="article-top">' + sourceBadge(article.source) + '<time class="article-date" datetime="' + esc(article.date) + '">' + esc(formatDate(article.date)) + '</time></div>' +
      '<h3 class="' + (titleIsArabicOnly(article) ? 'ar-text' : '') + '"><a href="' + href + '">' + esc(title) + '</a></h3>' +
      (excerpt ? '<p class="article-excerpt' + (excerptIsArabicOnly(article) ? ' ar-text' : '') + '">' + esc(excerpt) + '</p>' : '') +
      '<div class="article-foot"><span class="article-kind">' + I.clock + esc(article.category_ar && lang === 'ar' ? article.category_ar : article.category_en || article.category_ar) + series + '</span>' +
      '<span>' + esc(readingTime(read)) + '</span></div>' +
      '<div class="article-foot" style="border-top:0;padding-top:2px;margin-top:4px"><span class="article-kind">' + I.file + esc(articleKindLabel(article.kind)) + '</span><a class="read-more" href="' + href + '">' + esc(t('readMore')) + ' ' + I.arrow + '</a></div>' +
      '</article>';
  }

  function paperRow(paper, index) {
    const title = titleOf(paper);
    const abs = abstractOf(paper);
    return '<div class="paper-row">' +
      '<div class="paper-num">' + String(index + 1).padStart(2, '0') + '</div>' +
      '<div class="paper-body"><h3><a href="' + paperUrl(paper.id) + '" data-action="open-paper" data-id="' + esc(paper.id) + '" class="' + (titleIsArabicOnly(paper) ? 'ar-text' : '') + '">' + esc(title) + '</a></h3>' +
      '<div class="paper-venue"><span>' + I.calendar + esc(paper.year) + '</span><span>' + I.bookOpen + esc(venueOf(paper)) + '</span>' + (placeOf(paper) ? '<span>' + I.pin + esc(placeOf(paper)) + '</span>' : '') + '</div>' +
      (abs ? '<p class="paper-abs' + (lang === 'en' && !paper.abs_en ? ' ar-text' : '') + '">' + esc(abs) + '</p>' : '') + '</div>' +
      '<div class="paper-actions">' +
      (paper.pdf ? '<a class="icon-btn" href="' + esc(paper.pdf) + '" target="_blank" rel="noopener" data-action="pdf-paper" data-id="' + esc(paper.id) + '" aria-label="' + esc(t('readPdf')) + '" title="' + esc(t('readPdf')) + '">' + I.bookOpen + '</a>' : '') +
      '<button class="icon-btn" type="button" data-action="cite-paper" data-id="' + esc(paper.id) + '" aria-label="' + esc(t('cite')) + '" title="' + esc(t('cite')) + '">' + I.quote + '</button>' +
      (paper.doi ? '<a class="icon-btn" href="' + esc(paper.doi) + '" target="_blank" rel="noopener" aria-label="' + esc(t('openDoi')) + '" title="' + esc(t('openDoi')) + '">' + I.link + '</a>' : '') +
      '</div></div>';
  }

  function statItem(value, label, sub) {
    return '<div class="stat"><div class="stat-number">' + esc(value) + '</div><div class="stat-label">' + esc(label) + (sub ? '<span>' + esc(sub) + '</span>' : '') + '</div></div>';
  }

  function emptyState(title, text) {
    return '<div class="empty-state">' + I.search + '<h3>' + esc(title) + '</h3><p>' + esc(text) + '</p></div>';
  }

  function resultsMeta(shown, total) {
    if (lang === 'ar') return '<span><strong>' + shown + '</strong> ' + esc(t('results')) + '</span><span>' + esc(t('showing')) + ' ' + (shown ? 1 : 0) + '–' + shown + ' ' + esc(t('of')) + ' ' + total + '</span>';
    return '<span><strong>' + shown + '</strong> ' + esc(t('results')) + '</span><span>' + esc(t('showing')) + ' ' + (shown ? 1 : 0) + '–' + shown + ' ' + esc(t('of')) + ' ' + total + '</span>';
  }

  function breadcrumb(items) {
    return '<nav class="breadcrumb" aria-label="breadcrumb"><a href="index.html">' + esc(t('home')) + '</a>' +
      items.map((item) => I.chevron + (item.href ? '<a href="' + esc(item.href) + '">' + esc(item.label) + '</a>' : '<span>' + esc(item.label) + '</span>')).join('') + '</nav>';
  }

  function pageHero(opts) {
    return '<section class="page-hero"><div class="container">' + breadcrumb(opts.crumbs || []) +
      (opts.eyebrow ? '<div class="eyebrow">' + esc(opts.eyebrow) + '</div>' : '') +
      '<h1 class="page-title">' + esc(opts.title) + '</h1>' +
      '<p class="page-lead">' + esc(opts.lead) + '</p>' +
      (opts.chips ? '<div class="page-stats">' + opts.chips + '</div>' : '') +
      '</div></section>';
  }

  function chip(text, strong) {
    return '<span class="chip">' + (strong ? '<strong>' + esc(strong) + '</strong> ' : '') + esc(text) + '</span>';
  }

  function featureMeta(book) {
    return '<div class="feature-meta">' + chip(String(book.year)) + chip(bookTypeLabel(book.typ)) +
      (book.pages ? chip(book.pages + ' ' + t('pages')) : '') + chip(collectionLabel(book.cat)) + '</div>';
  }

  function citationTabLabels() {
    return [['apa', t('apa')], ['mla', t('mla')], ['bibtex', t('bibtex')]];
  }

  function currentYear() { return new Date().getFullYear(); }

  /* ------------------------------------------------------------
     Expose core to the page module
     ------------------------------------------------------------ */
  window.YAHYA = {
    SITE, INDEX, CONTENT, PARTS, P, BOOKS, PAPERS, COLLECTIONS, PAGE, SITE_URL,
    PORTRAIT, CV_PDF, PAGE_NAMES, I, COPY, brandMark,
    get lang() { return lang; },
    get theme() { return theme; },
    setLang(value) { lang = value === 'en' ? 'en' : 'ar'; },
    setTheme(value) { theme = value === 'dark' ? 'dark' : 'light'; },
    t, esc, truncate, normalize, formatDate, dateObj, isoToday, cleanYear, cleanPeriod,
    readMinutes, readingTime, absolute, articleUrl, bookUrl, paperUrl, stripDir,
    sourceLabel, sourceBadge, bookTypeLabel, paperTypeLabel, articleKindLabel,
    collectionFor, collectionLabel, titleOf, titleIsArabicOnly, excerptOf, excerptIsArabicOnly,
    textDirectionClass, subOf, summaryOf, venueOf, placeOf, publisherOf, abstractOf,
    articleRead, articleHref, sortArticles, sortBooks, sortPapers, matchQuery,
    portrait, socialLinks, bookCover, bookCard, articleCard, paperRow, statItem,
    emptyState, resultsMeta, breadcrumb, pageHero, chip, featureMeta, citationTabLabels, currentYear,
    readPref, writePref
  };
})();
