/* ============================================================
   Page modules: home, about, library, research and writing archive
   ============================================================ */
(function () {
  'use strict';

  const Y = window.YAHYA;
  if (!Y) return;

  const { P, I, t, esc, truncate, formatDate, titleOf, subOf, summaryOf, publisherOf,
    collectionLabel, collectionFor, articleCard, bookCard, paperRow, statItem, chip,
    pageHero, emptyState, sortArticles, sortBooks, sortPapers, matchQuery, normalize,
    sourceLabel, bookTypeLabel, paperTypeLabel, cleanYear, cleanPeriod, absolute,
    abstractOf, venueOf } = Y;

  const pages = {};
  const ar = () => Y.lang === 'ar';

  function root() { return document.getElementById('pageRoot'); }
  function setTitle(arTitle, enTitle) { document.title = ar() ? arTitle : enTitle; }

  function sectionHead(title, lead, href, label) {
    const arrow = '<span class="' + (ar() ? 'arrow-flip' : '') + '">' + I.arrow + '</span>';
    return '<div class="section-head"><div><h2 class="section-title">' + esc(title) + '</h2><p class="section-lead">' + esc(lead) + '</p></div>' +
      (href ? '<a class="link-arrow" href="' + href + '">' + esc(label) + arrow + '</a>' : '') + '</div>';
  }

  function countLabel(count, singular, plural) {
    return count + ' ' + (count === 1 ? singular : plural);
  }

  function resultsLine(shown, total, noun) {
    if (ar()) return '<span><strong>' + shown + '</strong> ' + esc(noun) + '</span><span>' + esc(t('showing')) + ' ' + (shown ? 1 : 0) + '–' + shown + ' ' + esc(t('of')) + ' ' + total + '</span>';
    return '<span><strong>' + shown + '</strong> ' + esc(noun) + '</span><span>' + esc(t('showing')) + ' ' + (shown ? 1 : 0) + '–' + shown + ' ' + esc(t('of')) + ' ' + total + '</span>';
  }

  function loadMoreButton() {
    return '<button class="btn btn-ghost" type="button" data-load-more>' + I.chevronDown + esc(t('loadMore')) + '</button>';
  }

  function miniItem(year, title, meta) {
    return '<div class="mini-item"><div class="mini-year">' + esc(year) + '</div><div><strong>' + esc(title) + '</strong><span>' + esc(meta) + '</span></div></div>';
  }

  function interestItem(text) {
    return '<div class="interest-item">' + I.sparkle + '<span>' + esc(text) + '</span></div>';
  }

  function currentStats() {
    return Y.SITE.stats || {};
  }

  /* ============================================================
     Home
     ============================================================ */
  pages.index = function homePage() {
    setTitle('د. يحيى أحمد المرهبي — أكاديمي وباحث ومفكّر تربوي', 'Dr. Yahya Ahmed Al-Marhabi — Academic, Researcher & Writer');

    const latest = sortArticles(Y.INDEX, 'newest')[0];
    const latestBook = sortBooks(Y.BOOKS, 'newest')[0];
    const selectedBooks = sortBooks(Y.BOOKS, 'newest').filter((b) => latestBook && b.id !== latestBook.id).slice(0, 6);
    const papers = sortPapers(Y.PAPERS, 'newest').slice(0, 4);
    const picks = ['fb-4130068727127210', 'fb-4124138437720239', 'hk-01', 'aj-01', 'hk-05', 'series-tabashir']
      .map((id) => Y.INDEX.find((a) => a.id === id)).filter(Boolean);
    if (picks.length < 6) {
      sortArticles(Y.INDEX, 'newest').forEach((a) => { if (picks.length < 6 && !picks.includes(a)) picks.push(a); });
    }
    const stats = currentStats();
    const quoteArticle = Y.INDEX.find((a) => a.id === 'fb-4130068727127210') || latest;

    const bio = ar()
      ? 'أستاذ أصول التربية في جامعة عمران، وباحث وكاتب في الفكر التربوي والإسلامي. تمتد مسيرته أكثر من ثلاثة عقود بين التدريس الجامعي والبحث الميداني والتأليف، ومشروعه الفكري في بناء الإنسان والنهوض الحضاري.'
      : 'Assistant Professor of Educational Foundations at Amran University, Yemen — a researcher and writer working across education, Islamic thought and civilisational renewal, with more than three decades of university teaching, field research and authorship.';

    const heroSocial = [
      [P.scholar, 'Google Scholar', I.cap],
      [P.aljazeera, ar() ? 'الجزيرة نت' : 'Al Jazeera', I.globe],
      [P.hekmah, ar() ? 'حكمة يمانية' : 'Hekmah Yamaniya', I.pen],
      ['mailto:' + P.email, P.email, I.mail]
    ].filter((x) => x[0]).map(([href, label, icon]) =>
      '<a href="' + esc(href) + '" target="_blank" rel="noopener">' + icon + esc(label) + '</a>'
    ).join('');

    const statsHTML =
      statItem(stats.books || Y.BOOKS.length, ar() ? 'كتابًا ورسالة' : 'books & theses', ar() ? 'نصوص كاملة' : 'full texts') +
      statItem(stats.papers || Y.PAPERS.length, ar() ? 'بحثًا محكّمًا' : 'research papers', ar() ? 'ومؤتمرات' : 'and conferences') +
      statItem(stats.articles || Y.INDEX.length, ar() ? 'مقالة وخاطرة' : 'essays & reflections', ar() ? 'من مصادر موثقة' : 'from three sources') +
      statItem(stats.years || '30+', ar() ? 'سنة عطاء' : 'years of work', ar() ? 'في التعليم والبحث' : 'in teaching & research');

    const featureHTML = latestBook ? '<section class="section"><div class="container"><div class="feature-panel">' +
      '<div class="feature-cover">' + Y.bookCover(latestBook, true) + '</div>' +
      '<div class="feature-copy"><div class="eyebrow">' + esc(t('latestBook')) + '</div>' +
      '<h2 class="' + (Y.titleIsArabicOnly(latestBook) ? 'ar-text' : '') + '">' + esc(titleOf(latestBook)) + '</h2>' +
      '<div class="feature-sub">' + esc(subOf(latestBook)) + '</div>' +
      '<p class="feature-desc">' + esc(summaryOf(latestBook)) + '</p>' +
      Y.featureMeta(latestBook) +
      '<div class="feature-actions">' +
      (latestBook.pdf ? '<button class="btn btn-light" type="button" data-action="pdf-book" data-id="' + esc(latestBook.id) + '">' + I.bookOpen + esc(t('readNow')) + '</button>' : '') +
      (latestBook.pdf ? '<a class="btn btn-ghost btn-download" href="' + esc(latestBook.pdf) + '" download>' + I.download + esc(t('downloadPdf')) + '</a>' : '') +
      '<button class="btn btn-ghost" type="button" data-action="open-book" data-id="' + esc(latestBook.id) + '">' + esc(t('details')) + '</button>' +
      '<button class="btn btn-brass" type="button" data-action="cite-book" data-id="' + esc(latestBook.id) + '">' + I.quote + esc(t('cite')) + '</button>' +
      '</div></div></div></div></section>' : '';

    const latestTitle = latest ? titleOf(latest) : '';

    root().innerHTML =
      '<section class="hero"><div class="container"><div class="hero-grid">' +
      '<div class="hero-copy"><div class="hero-kicker"><span class="line"></span>' + (ar() ? 'أكاديمي · باحث · كاتب' : 'Academic · Researcher · Writer') + '</div>' +
      '<h1>' + (ar() ? 'يحيى أحمد <span class="accent">المرهبي</span>' : 'Yahya Ahmed <span class="accent">Al-Marhabi</span>') + '</h1>' +
      '<div class="hero-role"><span class="hero-role-title">' + esc(ar() ? P.title_ar : P.title_en) + '</span><span class="hero-role-aff">' + esc(ar() ? P.affiliation_ar : P.affiliation_en) + '</span></div>' +
      '<p class="hero-lead">' + esc(bio) + '</p>' +
      '<div class="hero-actions"><a class="btn btn-primary" href="books.html">' + I.bookOpen + esc(t('exploreLibrary')) + '</a>' +
      '<a class="btn btn-ghost" href="about.html">' + esc(t('aboutCta')) + '<span class="' + (ar() ? 'arrow-flip' : '') + '">' + I.arrow + '</span></a></div>' +
      '<div class="hero-links">' + heroSocial + '</div></div>' +
      '<div class="hero-visual"><span class="hero-pattern">' + I.sparkle + '</span>' +
      '<div class="portrait-frame"><div class="portrait-inner">' + Y.portrait() + '</div></div>' +
      '</div></div>' +
      '<div class="stats-strip">' + statsHTML + '</div></div></section>' +
      featureHTML +
      '<section class="section"><div class="container">' +
      sectionHead(t('selectedLibrary'), t('selectedLibraryLead'), 'books.html', t('browseAll')) +
      '<div class="book-grid">' + selectedBooks.map(bookCard).join('') + '</div></div></section>' +
      '<section class="section-tight"><div class="container">' +
      sectionHead(t('peerReviewed'), t('peerReviewedLead'), 'research.html', t('allResearch')) +
      '<div class="paper-list">' + papers.map((paper, index) => paperRow(paper, index)).join('') + '</div></div></section>' +
      '<section class="section"><div class="container">' +
      sectionHead(t('recentWriting'), t('recentWritingLead'), 'articles.html', t('allWriting')) +
      '<div class="article-grid">' + picks.map((article) => articleCard(article)).join('') + '</div></div></section>' +
      '<section class="quote-section"><div class="container"><div class="quote-inner">' +
      '<div><div class="quote-mark">“</div><p class="quote-text">' + (ar()
        ? 'ما طال عمر باطل إلا حين ارتدى ثوب الحق، وما استمرأ ظالم ظلمه إلا حين أقنع ضحاياه أنه جاء ليخلصهم.'
        : 'No falsehood has lasted long except when it wore the robe of truth; no tyrant has grown comfortable in injustice except by convincing his victims that he came to save them.') + '</p>' +
      '<p class="quote-source">' + (ar() ? 'من مقال «وهم يحسبون أنهم يحسنون صنعا» — 2026' : 'From “They Think They Are Doing Well” — 2026') + '</p></div>' +
      '<div class="quote-side"><p>' + (ar()
        ? 'الكتابة عنده ليست زخرفة فوق المعرفة، بل عملٌ تربويٌّ يوقظ الضمير ويعيد للإنسان قدرته على التمييز.'
        : 'For him, writing is not ornament added to knowledge. It is educational work: waking the conscience and restoring the human capacity to distinguish.') + '</p>' +
      '<a class="btn btn-light" href="' + (quoteArticle ? Y.articleHref(quoteArticle) : 'articles.html') + '">' + esc(t('readMore')) + '</a></div>' +
      '</div></div></section>' +
      '<section class="section"><div class="container"><div class="contact-strip"><div><div class="eyebrow">' + (ar() ? 'تواصل' : 'Contact') + '</div>' +
      '<h2>' + esc(t('contactTitle')) + '</h2><p>' + esc(t('contactLead')) + '</p></div>' +
      '<div class="contact-actions"><a class="btn btn-primary" href="mailto:' + esc(P.email) + '">' + I.mail + esc(t('emailMe')) + '</a>' +
      '<a class="btn btn-ghost" href="' + esc(P.scholar) + '" target="_blank" rel="noopener">' + I.cap + 'Google Scholar</a>' +
      '<a class="btn btn-ghost" href="' + Y.CV_PDF + '" target="_blank" rel="noopener">' + I.download + esc(t('cv')) + '</a></div></div></div></section>';
  };

  /* ============================================================
     About
     ============================================================ */
  pages.about = function aboutPage() {
    setTitle('السيرة الأكاديمية — د. يحيى أحمد المرهبي', 'Academic Profile — Dr. Yahya Ahmed Al-Marhabi');
    const bio = ar()
      ? [
          P.bio_ar,
          'تتوزع أعماله بين التأليف والبحث الميداني والكتابة العامة. في الجانب الأكاديمي، اشتغل على سياسات التعليم وتربية المواطنة والتخطيط التربوي؛ وفي الجانب الفكري، أنجز «رباعية الذات الإنسانية» وعددًا من الكتب التي تعيد قراءة العبادات والقيم بوصفها مشاريع لبناء الإنسان.',
          'إلى جانب عمله الجامعي، يكتب بانتظام في «حكمة يمانية» و«الجزيرة نت» وصفحته العامة، حيث يصل بين التحليل التربوي والهمّ الحضاري، وبين النص التراثي وأسئلة الواقع.'
        ]
      : [
          P.bio_en,
          'His work moves between authorship, field research and public writing. On the academic side he has worked on education policy, citizenship education and educational planning; on the intellectual side he has completed the Human Self quartet and a series of books that read worship and values as projects of human formation.',
          'Alongside his university work he writes regularly for Hekmah Yamaniya, Al Jazeera and his public page, connecting educational analysis with civilisational concern, and inherited texts with the questions of the present.'
        ];

    const timeline = (Y.SITE.timeline || []).map((item) =>
      '<div class="tl-item"><div class="tl-year">' + esc(item.year) + '</div><div class="tl-body"><h3>' + esc(ar() ? item.ar : item.en) + '</h3></div></div>'
    ).join('');

    const quals = (Y.SITE.qualifications || []).map((q) => {
      const degree = ar() ? q.degree : q.degree_en || q.degree;
      const major = ar() ? q.major : q.major_en || q.major;
      const university = ar() ? q.university : q.university_en || q.university;
      const location = ar() ? q.location : q.location_en || q.location;
      const dissertation = ar() ? q.dissertation : q.dissertation_en || q.dissertation;
      return '<div class="mini-item"><div class="mini-year">' + esc(cleanYear(q.year)) + '</div><div><strong>' + esc(degree + ' · ' + major) + '</strong>' +
        '<span>' + esc(university + ' — ' + location) + '</span><span>' + esc(dissertation) + '</span></div></div>';
    }).join('');

    const experiences = (Y.SITE.experiences || []).map((item) => {
      const role = ar() ? item.role : item.role_en || item.role;
      const rank = ar() ? item.rank : item.rank_en || item.rank;
      const institution = ar() ? item.institution : item.institution_en || item.institution;
      const location = ar() ? item.location : item.location_en || item.location;
      const end = !ar() && /الآن/.test(item.end) ? 'Present' : item.end;
      return '<div class="mini-item"><div class="mini-year">' + esc(item.start) + '</div><div><strong>' + esc(role + ' · ' + rank) + '</strong>' +
        '<span>' + esc(item.start + ' – ' + end + ' · ' + institution + ' · ' + location) + '</span></div></div>';
    }).join('');

    const positions = (Y.SITE.positions || []).map((item) => {
      const title = ar() ? item.title : item.title_en || item.title;
      const dept = ar() ? item.dept : item.dept_en || item.dept;
      const college = ar() ? item.college : item.college_en || item.college;
      return '<div class="mini-item"><div class="mini-year">' + esc(cleanPeriod(item.period)) + '</div><div><strong>' + esc(title) + '</strong><span>' + esc(dept + ' · ' + college) + '</span></div></div>';
    }).join('');

    const courses = (Y.SITE.courses || []).map((item) => {
      const course = ar() ? item.course : item.course_en || item.course;
      const degree = ar() ? item.degree : item.degree_en || item.degree;
      const college = ar() ? item.college : item.college_en || item.college;
      return '<div class="mini-item"><div class="mini-year">' + esc(cleanPeriod(item.period)) + '</div><div><strong>' + esc(course) + '</strong><span>' + esc(degree + ' · ' + college) + '</span></div></div>';
    }).join('');

    const activities = (Y.SITE.activities || []).map((item) => {
      const activity = ar() ? item.activity : item.activity_en || item.activity;
      const org = ar() ? item.org : item.org;
      return '<div class="mini-item"><div class="mini-year">' + esc(cleanYear(item.year)) + '</div><div><strong>' + esc(activity) + '</strong><span>' + esc(org) + '</span></div></div>';
    }).join('');

    const training = (Y.SITE.training || []).map((item) => {
      const course = ar() ? item.course : item.course_en || item.course;
      const venue = ar() ? item.venue : item.venue_en || item.venue;
      return '<div class="mini-item"><div class="mini-year">' + esc(cleanYear(item.year)) + '</div><div><strong>' + esc(course) + '</strong><span>' + esc(venue) + '</span></div></div>';
    }).join('');

    const interests = (ar() ? P.interests_ar : P.interests_en) || [];

    root().innerHTML = pageHero({
      crumbs: [{ label: t('about') }],
      eyebrow: t('academicProfile'),
      title: t('bioTitle'),
      lead: t('bioLead'),
      chips: '<span class="chip"><strong>2016</strong> ' + esc(t('phd')) + '</span>' +
        '<span class="chip"><strong>35+</strong> ' + esc(t('yearsExp')) + '</span>' +
        '<span class="chip"><strong>' + (currentStats().books || Y.BOOKS.length) + '</strong> ' + esc(t('booksCount')) + '</span>' +
        '<span class="chip"><strong>' + (currentStats().papers || Y.PAPERS.length) + '</strong> ' + esc(ar() ? 'بحث ودراسة' : 'papers') + '</span>'
    }) +
      '<section class="section"><div class="container"><div class="about-grid">' +
      '<div class="about-photo"><div class="frame"><div class="frame-inner">' + Y.portrait() + '</div></div>' +
      '<p class="caption">' + esc(ar() ? P.name_ar : P.name_en) + ' · ' + esc(ar() ? P.residence_ar : P.residence_en) + '</p></div>' +
      '<div class="about-content"><h2>' + esc(t('biography')) + '</h2>' +
      bio.map((paragraph, index) => '<p class="' + (index === 0 ? 'lead' : '') + '">' + esc(paragraph) + '</p>').join('') +
      '<h2 style="margin-top:42px">' + esc(t('interests')) + '</h2><div class="interest-grid">' + interests.map(interestItem).join('') + '</div>' +
      '<div class="cv-box"><div><h3>' + esc(t('cv')) + '</h3><p>' + esc(t('downloadCvNote')) + '</p></div>' +
      '<div class="cv-actions"><button class="btn btn-primary" type="button" data-action="pdf-cv">' + I.bookOpen + esc(t('readCv')) + '</button>' +
      '<a class="btn btn-ghost" href="' + Y.CV_PDF + '" download>' + I.download + esc(t('downloadCv')) + '</a></div></div>' +
      '</div></div></div></section>' +
      '<section class="section-tight"><div class="container"><div class="section-head"><div><h2 class="section-title">' + esc(t('milestones')) + '</h2></div></div>' +
      '<div class="timeline">' + timeline + '</div></div></section>' +
      '<section class="section"><div class="container"><div class="about-lists">' +
      '<div class="list-block"><h3>' + esc(t('qualifications')) + '</h3><div class="mini-list">' + quals + '</div></div>' +
      '<div class="list-block"><h3>' + esc(t('experience')) + '</h3><div class="mini-list">' + experiences + '</div></div>' +
      '</div></div></section>' +
      '<section class="section-tight"><div class="container"><div class="about-lists">' +
      '<div class="list-block"><h3>' + esc(t('positions')) + '</h3><div class="mini-list">' + positions + '</div></div>' +
      '<div class="list-block"><h3>' + esc(t('teaching')) + '</h3><div class="mini-list">' + courses + '</div></div>' +
      '</div></div></section>' +
      '<section class="section"><div class="container"><div class="about-lists">' +
      '<div class="list-block"><h3>' + esc(t('activities')) + '</h3><div class="mini-list">' + activities + '</div></div>' +
      '<div class="list-block"><h3>' + esc(t('training')) + '</h3><div class="mini-list">' + training + '</div></div>' +
      '</div></div></section>' +
      '<section class="section-tight"><div class="container"><div class="section-head"><div><h2 class="section-title"><span class="t-ar">أبحاث ومؤلفات قيد النشر والتحكيم</span><span class="t-en">Forthcoming Works & Research</span></h2></div></div>' +
      '<div class="forthcoming-grid">' + (((Y.SITE && Y.SITE.forthcoming) || (typeof SITE !== "undefined" && SITE.forthcoming) || []).map(f => '<div class="card" style="padding:20px;border:1px solid var(--line);border-radius:12px;background:var(--surface)"><div class="eyebrow" style="color:var(--brass);font-weight:600">' + esc(ar() ? f.field_ar : f.field_en) + '</div><h3 style="margin:8px 0;font-size:16px">' + esc(ar() ? f.title_ar : f.title_en) + '</h3><p class="meta" style="color:var(--muted);font-size:13.5px">' + esc(ar() ? f.type_ar : f.type_en) + '</p></div>').join('')) + '</div></div></section>' +
      '<section class="section"><div class="container"><div class="section-head"><div><h2 class="section-title"><span class="t-ar">المعرفون الأكاديميون</span><span class="t-en">Academic References</span></h2></div></div>' +
      '<div class="references-grid">' + (((Y.SITE && Y.SITE.references) || (typeof SITE !== "undefined" && SITE.references) || []).map(r => '<div class="card" style="padding:22px;border:1px solid var(--line);border-radius:12px;background:var(--surface)"><h3 style="margin:0 0 6px 0;font-size:17px;color:var(--green)">' + esc(ar() ? r.name_ar : r.name_en) + '</h3><p class="role" style="color:var(--ink-2);font-weight:500;margin-bottom:12px">' + esc(ar() ? r.title_ar : r.title_en) + '</p><div class="ref-contact"><span>' + I.phone + ' <a href="tel:' + (r.phone ? r.phone.replace(/\\s+/g,"") : "") + '" dir="ltr">' + esc(r.phone) + '</a></span><span>' + I.mail + ' <a href="mailto:' + esc(r.email) + '">' + esc(r.email) + '</a></span></div></div>').join('')) + '</div></div></section>';
  };

  /* ============================================================
     Books
     ============================================================ */
  const bookState = { cat: 'all', q: '', sort: 'newest' };
  let bookStateReady = false;

  pages.books = function booksPage() {
    if (!bookStateReady) {
      const params = new URLSearchParams(window.location.search);
      const cat = params.get('cat');
      if (cat && (cat === 'all' || collectionFor(cat))) bookState.cat = cat;
      bookStateReady = true;
    }
    setTitle('الكتب والرسائل — د. يحيى أحمد المرهبي', 'Books & Theses — Dr. Yahya Ahmed Al-Marhabi');

    const collectionButtons = '<button class="filter-btn' + (bookState.cat === 'all' ? ' active' : '') + '" type="button" data-book-cat="all">' + esc(t('allBooks')) + '</button>' +
      Y.COLLECTIONS.map((c) => '<button class="filter-btn' + (bookState.cat === c.id ? ' active' : '') + '" type="button" data-book-cat="' + esc(c.id) + '">' + esc(ar() ? c.ar : c.en) + '</button>').join('');

    root().innerHTML = pageHero({
      crumbs: [{ label: t('books') }],
      eyebrow: ar() ? 'المكتبة الرقمية' : 'Digital library',
      title: ar() ? 'الكتب والرسائل' : 'Books & Theses',
      lead: t('libraryLead'),
      chips: '<span class="chip"><strong>' + Y.BOOKS.length + '</strong> ' + esc(t('booksCount')) + '</span>' +
        '<span class="chip"><strong>' + Y.COLLECTIONS.length + '</strong> ' + (ar() ? 'مجموعات' : 'collections') + '</span>' +
        '<span class="chip"><strong>' + Y.BOOKS.filter((b) => b.pdf).length + '</strong> PDF</span>'
    }) +
      '<section class="section"><div class="container">' +
      '<div class="toolbar"><div class="filters" role="group" aria-label="' + esc(t('filter')) + '">' + collectionButtons + '</div>' +
      '<div class="toolbar-right"><div class="search-wrap">' + I.search + '<label class="sr-only" for="bookSearch">' + esc(t('search')) + '</label>' +
      '<input class="search-input" id="bookSearch" data-site-search type="search" value="' + esc(bookState.q) + '" placeholder="' + esc(t('search')) + '"></div>' +
      '<div class="select-wrap"><label class="sr-only" for="bookSort">' + esc(t('sort')) + '</label><select id="bookSort">' +
      '<option value="newest"' + (bookState.sort === 'newest' ? ' selected' : '') + '>' + esc(t('newest')) + '</option>' +
      '<option value="oldest"' + (bookState.sort === 'oldest' ? ' selected' : '') + '>' + esc(t('oldest')) + '</option>' +
      '<option value="title"' + (bookState.sort === 'title' ? ' selected' : '') + '>' + esc(t('titleSort')) + '</option>' +
      '</select></div></div></div><div id="bookResults"></div></div></section>';

    const results = document.getElementById('bookResults');
    const search = document.getElementById('bookSearch');
    const sort = document.getElementById('bookSort');

    function filtered() {
      const q = normalize(bookState.q);
      return sortBooks(Y.BOOKS, bookState.sort).filter((book) => {
        if (bookState.cat !== 'all' && book.cat !== bookState.cat) return false;
        if (!q) return true;
        return matchQuery([titleOf(book), book.title_ar, book.title_en, subOf(book), summaryOf(book), publisherOf(book), collectionLabel(book.cat)].join(' '), q);
      });
    }

    function paint() {
      const list = filtered();
      results.innerHTML = '<div class="results-meta">' + resultsLine(list.length, Y.BOOKS.length, ar() ? 'كتاب ورسالة' : 'books & theses') + '</div>' +
        (list.length ? '<div class="book-grid">' + list.map(bookCard).join('') + '</div>' : emptyState(t('noResults'), t('noResultsText')));
    }

    root().querySelectorAll('[data-book-cat]').forEach((button) => {
      button.addEventListener('click', () => {
        bookState.cat = button.dataset.bookCat;
        root().querySelectorAll('[data-book-cat]').forEach((b) => b.classList.toggle('active', b === button));
        paint();
      });
    });
    search.addEventListener('input', () => { bookState.q = search.value; paint(); });
    sort.addEventListener('change', () => { bookState.sort = sort.value; paint(); });
    paint();

    const wanted = new URLSearchParams(window.location.search).get('book');
    if (wanted) setTimeout(() => Y.ui.openBook(wanted), 80);
  };

  /* ============================================================
     Research
     ============================================================ */
  const paperState = { typ: 'all', q: '', sort: 'newest' };
  let paperStateReady = false;

  pages.research = function researchPage() {
    if (!paperStateReady) {
      const params = new URLSearchParams(window.location.search);
      const typ = params.get('type');
      if (['journal', 'conference', 'study'].includes(typ)) paperState.typ = typ;
      paperStateReady = true;
    }
    setTitle('الأبحاث العلمية — د. يحيى أحمد المرهبي', 'Research — Dr. Yahya Ahmed Al-Marhabi');

    const types = [
      ['all', t('allResearch')],
      ['journal', ar() ? 'دوريات محكّمة' : 'Journal articles'],
      ['conference', ar() ? 'أوراق مؤتمرات' : 'Conference papers'],
      ['study', ar() ? 'دراسات' : 'Studies']
    ];
    const typeButtons = types.map(([key, label]) =>
      '<button class="filter-btn' + (paperState.typ === key ? ' active' : '') + '" type="button" data-paper-type="' + key + '">' + esc(label) + '</button>'
    ).join('');

    root().innerHTML = pageHero({
      crumbs: [{ label: t('research') }],
      eyebrow: ar() ? 'الإنتاج العلمي' : 'Scholarly work',
      title: ar() ? 'الأبحاث والدراسات' : 'Research & Studies',
      lead: t('researchLead'),
      chips: '<span class="chip"><strong>' + Y.PAPERS.length + '</strong> ' + esc(ar() ? 'بحثًا ودراسة' : 'papers & studies') + '</span>' +
        '<span class="chip"><strong>' + Y.PAPERS.filter((p) => p.doi).length + '</strong> DOI</span>' +
        '<span class="chip"><strong>' + Y.PAPERS.filter((p) => p.pdf).length + '</strong> PDF</span>'
    }) +
      '<section class="section"><div class="container">' +
      '<div class="toolbar"><div class="filters" role="group" aria-label="' + esc(t('filter')) + '">' + typeButtons + '</div>' +
      '<div class="toolbar-right"><div class="search-wrap">' + I.search + '<label class="sr-only" for="paperSearch">' + esc(t('search')) + '</label>' +
      '<input class="search-input" id="paperSearch" data-site-search type="search" value="' + esc(paperState.q) + '" placeholder="' + esc(t('search')) + '"></div>' +
      '<div class="select-wrap"><label class="sr-only" for="paperSort">' + esc(t('sort')) + '</label><select id="paperSort">' +
      '<option value="newest"' + (paperState.sort === 'newest' ? ' selected' : '') + '>' + esc(t('newest')) + '</option>' +
      '<option value="oldest"' + (paperState.sort === 'oldest' ? ' selected' : '') + '>' + esc(t('oldest')) + '</option>' +
      '<option value="title"' + (paperState.sort === 'title' ? ' selected' : '') + '>' + esc(t('titleSort')) + '</option>' +
      '</select></div></div></div><div id="paperResults"></div></div></section>';

    const results = document.getElementById('paperResults');
    const search = document.getElementById('paperSearch');
    const sort = document.getElementById('paperSort');

    function filtered() {
      const q = normalize(paperState.q);
      return sortPapers(Y.PAPERS, paperState.sort).filter((paper) => {
        if (paperState.typ !== 'all' && paper.typ !== paperState.typ) return false;
        if (!q) return true;
        return matchQuery([titleOf(paper), paper.title_ar, paper.title_en, abstractOf(paper), venueOf(paper), paper.place_ar, paper.place_en].join(' '), q);
      });
    }

    function paint() {
      const list = filtered();
      results.innerHTML = '<div class="results-meta">' + resultsLine(list.length, Y.PAPERS.length, ar() ? 'بحث ودراسة' : 'papers & studies') + '</div>' +
        (list.length ? '<div class="paper-list">' + list.map((paper, index) => paperRow(paper, index)).join('') + '</div>' : emptyState(t('noResults'), t('noResultsText')));
    }

    root().querySelectorAll('[data-paper-type]').forEach((button) => {
      button.addEventListener('click', () => {
        paperState.typ = button.dataset.paperType;
        root().querySelectorAll('[data-paper-type]').forEach((b) => b.classList.toggle('active', b === button));
        paint();
      });
    });
    search.addEventListener('input', () => { paperState.q = search.value; paint(); });
    sort.addEventListener('change', () => { paperState.sort = sort.value; paint(); });
    paint();

    const wanted = new URLSearchParams(window.location.search).get('paper');
    if (wanted) setTimeout(() => Y.ui.openPaper(wanted), 80);
  };

  /* ============================================================
     Articles archive
     ============================================================ */
  const articleState = { source: 'all', category: 'all', q: '', sort: 'newest', limit: 9 };
  let articleStateReady = false;

  pages.articles = function articlesPage() {
    if (!articleStateReady) {
      const params = new URLSearchParams(window.location.search);
      const source = params.get('source');
      if (['facebook', 'hekmah', 'aljazeera'].includes(source)) articleState.source = source;
      const q = params.get('q');
      if (q) articleState.q = q;
      articleStateReady = true;
    }
    setTitle('المقالات والكتابات — د. يحيى أحمد المرهبي', 'Writing Archive — Dr. Yahya Ahmed Al-Marhabi');

    const sources = [
      ['all', t('allSources')],
      ['facebook', t('facebook')],
      ['hekmah', t('hekmah')],
      ['aljazeera', t('aljazeera')]
    ];
    const sourceButtons = sources.map(([key, label]) =>
      '<button class="filter-btn' + (articleState.source === key ? ' active' : '') + '" type="button" data-article-source="' + key + '">' + esc(label) + '</button>'
    ).join('');

    const categories = Array.from(new Set(Y.INDEX.map((a) => a.category_ar).filter(Boolean)));
    const categoryOptions = '<option value="all">' + esc(ar() ? 'كل التصنيفات' : 'All categories') + '</option>' +
      categories.map((cat) => {
        const item = Y.INDEX.find((a) => a.category_ar === cat);
        const label = ar() ? cat : item.category_en || cat;
        return '<option value="' + esc(cat) + '"' + (articleState.category === cat ? ' selected' : '') + '>' + esc(label) + '</option>';
      }).join('');

    root().innerHTML = pageHero({
      crumbs: [{ label: t('articles') }],
      eyebrow: ar() ? 'أرشيف الكتابة' : 'The writing archive',
      title: ar() ? 'المقالات والكتابات' : 'Essays & Writing',
      lead: t('articlesLead'),
      chips: '<span class="chip"><strong>' + Y.INDEX.length + '</strong> ' + esc(ar() ? 'مقالة وخاطرة' : 'essays & reflections') + '</span>' +
        '<span class="chip"><strong>3</strong> ' + esc(ar() ? 'مصادر موثقة' : 'verified sources') + '</span>' +
        '<span class="chip"><strong>50</strong> ' + esc(ar() ? 'جزءًا في سلسلة' : 'part series') + '</span>'
    }) +
      '<section class="section"><div class="container">' +
      '<div class="toolbar"><div class="filters" role="group" aria-label="' + esc(t('filter')) + '">' + sourceButtons + '</div>' +
      '<div class="toolbar-right"><div class="search-wrap">' + I.search + '<label class="sr-only" for="articleSearch">' + esc(t('search')) + '</label>' +
      '<input class="search-input" id="articleSearch" data-site-search type="search" value="' + esc(articleState.q) + '" placeholder="' + esc(t('search')) + '"></div>' +
      '<div class="select-wrap"><label class="sr-only" for="articleCategory">' + esc(t('category')) + '</label><select id="articleCategory">' + categoryOptions + '</select></div>' +
      '<div class="select-wrap"><label class="sr-only" for="articleSort">' + esc(t('sort')) + '</label><select id="articleSort">' +
      '<option value="newest"' + (articleState.sort === 'newest' ? ' selected' : '') + '>' + esc(t('newest')) + '</option>' +
      '<option value="oldest"' + (articleState.sort === 'oldest' ? ' selected' : '') + '>' + esc(t('oldest')) + '</option>' +
      '</select></div></div></div><div id="articleResults"></div></div></section>';

    const results = document.getElementById('articleResults');
    const search = document.getElementById('articleSearch');
    const category = document.getElementById('articleCategory');
    const sort = document.getElementById('articleSort');

    function filtered() {
      const q = normalize(articleState.q);
      return sortArticles(Y.INDEX, articleState.sort).filter((article) => {
        if (articleState.source !== 'all' && article.source !== articleState.source) return false;
        if (articleState.category !== 'all' && article.category_ar !== articleState.category) return false;
        if (!q) return true;
        return matchQuery([
          article.title_ar, article.title_en, article.excerpt_ar, article.excerpt_en,
          article.category_ar, article.category_en, article.source,
          (article.tags_ar || []).join(' '), (article.tags_en || []).join(' '),
          article.series_ar, article.series_en
        ].join(' '), q);
      });
    }

    function paint() {
      const list = filtered();
      const visible = list.slice(0, articleState.limit);
      results.innerHTML = '<div class="results-meta">' + resultsLine(visible.length, list.length, ar() ? 'مقالة' : 'essays') + '</div>' +
        (visible.length ? '<div class="article-grid">' + visible.map((article) => articleCard(article)).join('') + '</div>' : emptyState(t('noResults'), t('noResultsText'))) +
        (list.length > articleState.limit ? '<div class="load-more-wrap">' + loadMoreButton() + '</div>' : '');
    }

    root().querySelectorAll('[data-article-source]').forEach((button) => {
      button.addEventListener('click', () => {
        articleState.source = button.dataset.articleSource;
        articleState.limit = 9;
        root().querySelectorAll('[data-article-source]').forEach((b) => b.classList.toggle('active', b === button));
        paint();
      });
    });
    search.addEventListener('input', () => { articleState.q = search.value; articleState.limit = 9; paint(); });
    category.addEventListener('change', () => { articleState.category = category.value; articleState.limit = 9; paint(); });
    sort.addEventListener('change', () => { articleState.sort = sort.value; paint(); });
    results.addEventListener('click', (event) => {
      if (event.target.closest('[data-load-more]')) {
        articleState.limit += 9;
        paint();
        const meta = results.querySelector('.results-meta');
        if (meta) meta.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
    paint();
  };

  Y.pages = pages;
})();
