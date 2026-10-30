/* ============================================================
   Article reader: essays, source preservation and the 50-part series
   ============================================================ */
(function () {
  'use strict';

  const Y = window.YAHYA;
  if (!Y) return;

  const { P, I, t, esc, formatDate, titleOf, excerptOf, sourceLabel, articleRead,
    portrait, articleCard, sortArticles, articleUrl, absolute } = Y;

  const ar = () => Y.lang === 'ar';

  function setMeta(selector, attr, content) {
    let element = document.head.querySelector(selector);
    if (!element) {
      element = document.createElement('meta');
      const match = selector.match(/\[(name|property)="([^"]+)"\]/);
      if (match) element.setAttribute(match[1], match[2]);
      document.head.appendChild(element);
    }
    element.setAttribute(attr, content);
  }

  function setCanonical(href) {
    let link = document.head.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = href;
  }

  function applyArticleMeta(article, title, description, url) {
    document.title = title + ' — ' + (ar() ? 'د. يحيى أحمد المرهبي' : 'Dr. Yahya Ahmed Al-Marhabi');
    setMeta('meta[name="description"]', 'content', description);
    setMeta('meta[property="og:title"]', 'content', title);
    setMeta('meta[property="og:description"]', 'content', description);
    setMeta('meta[property="og:type"]', 'content', 'article');
    setMeta('meta[property="og:url"]', 'content', url);
    setMeta('meta[property="og:image"]', 'content', absolute(Y.PORTRAIT));
    setMeta('meta[name="twitter:card"]', 'content', 'summary_large_image');
    setMeta('meta[name="twitter:title"]', 'content', title);
    setMeta('meta[name="twitter:description"]', 'content', description);
    setCanonical(url);

    let schema = document.getElementById('articleSchema');
    if (!schema) {
      schema = document.createElement('script');
      schema.type = 'application/ld+json';
      schema.id = 'articleSchema';
      document.head.appendChild(schema);
    }
    schema.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: article.title_en || article.title_ar,
      name: title,
      description: description,
      datePublished: article.date,
      dateModified: article.date,
      inLanguage: 'ar',
      url: url,
      mainEntityOfPage: url,
      image: absolute(Y.PORTRAIT),
      author: {
        '@type': 'Person',
        name: P.name_en || 'Dr. Yahya Ahmed Al-Marhabi',
        alternateName: P.name_ar,
        url: Y.SITE_URL
      },
      publisher: {
        '@type': 'Organization',
        name: 'Dr. Yahya Ahmed Al-Marhabi — Academic Portfolio',
        url: Y.SITE_URL
      },
      isPartOf: article.parts_count ? {
        '@type': 'CreativeWorkSeries',
        name: article.series_ar || article.title_ar,
        numberOfItems: article.parts_count
      } : undefined
    });
  }

  function notFound() {
    document.title = ar() ? 'المقال غير موجود — د. يحيى أحمد المرهبي' : 'Essay not found — Dr. Yahya Ahmed Al-Marhabi';
    const schema = document.getElementById('articleSchema');
    if (schema) schema.remove();
    document.getElementById('pageRoot').innerHTML =
      '<section class="page-hero"><div class="container">' +
      Y.breadcrumb([{ label: t('articles'), href: 'articles.html' }, { label: t('articleNotFound') }]) +
      '<div class="eyebrow">' + (ar() ? 'خطأ 404' : 'Error 404') + '</div>' +
      '<h1 class="page-title">' + esc(t('articleNotFound')) + '</h1>' +
      '<p class="page-lead">' + esc(t('articleNotFoundText')) + '</p>' +
      '<div class="hero-actions" style="margin-top:24px"><a class="btn btn-primary" href="articles.html">' + I.bookOpen + esc(t('backToArticles')) + '</a>' +
      '<a class="btn btn-ghost" href="index.html">' + esc(t('backHome')) + '</a></div></div></section>';
  }

  function renderItems(items) {
    if (!Array.isArray(items) || !items.length) return '';
    return items.map((item) => {
      if (item && typeof item === 'object' && item.h) {
        return '<h2>' + esc(item.h) + '</h2>';
      }
      const text = String(item == null ? '' : item);
      return text.split(/\n{2,}/).map((block) => {
        const clean = block.trim();
        if (!clean) return '';
        return '<p>' + esc(clean).replace(/\n/g, '<br>') + '</p>';
      }).join('');
    }).join('');
  }

  function seriesBody(article) {
    const parts = (Y.PARTS && Y.PARTS[article.id]) || [];
    return parts.map((part) => {
      return '<section class="series-part" id="part-' + part.part + '">' +
        '<h2 class="part-heading"><small>' + esc(t('part')) + ' ' + esc(part.part) + ' · ' + esc(formatDate(part.date)) + '</small>' + esc(part.title_ar || part.title_en || '') + '</h2>' +
        renderItems(part.paras || []) + '</section>';
    }).join('');
  }

  function articleBody(article) {
    if (article.parts_count) return seriesBody(article);
    const content = (Y.CONTENT && Y.CONTENT[article.id]) || [];
    if (content.length) return renderItems(content);
    return '<p>' + esc(article.excerpt_ar || article.excerpt_en || '') + '</p>';
  }

  function relatedFor(article) {
    const pool = Y.INDEX.filter((item) => item.id !== article.id);
    const sameCategory = pool.filter((item) => item.category_ar === article.category_ar);
    const sameSource = pool.filter((item) => item.source === article.source);
    const merged = [];
    [...sameCategory, ...sameSource, ...sortArticles(pool, 'newest')].forEach((item) => {
      if (merged.length < 3 && !merged.some((x) => x.id === item.id)) merged.push(item);
    });
    return merged;
  }

  function sourceLinks(article) {
    const links = [];
    if (article.source_url) links.push('<a href="' + esc(article.source_url) + '" target="_blank" rel="noopener">' + I.external + esc(t('readOriginal')) + '</a>');
    if (article.source === 'hekmah' && P.hekmah) links.push('<a href="' + esc(P.hekmah) + '" target="_blank" rel="noopener">' + I.pen + esc(t('hekmah')) + '</a>');
    if (article.source === 'aljazeera' && P.aljazeera) links.push('<a href="' + esc(P.aljazeera) + '" target="_blank" rel="noopener">' + I.globe + esc(t('aljazeera')) + '</a>');
    return links.join('');
  }

  function asideHTML(article) {
    const title = titleOf(article);
    const read = articleRead(article);
    const parts = (article.parts_count && Y.PARTS[article.id]) || [];
    const more = relatedFor(article).slice(0, 3);
    return '<aside class="article-aside">' +
      '<div class="aside-card aside-author"><img src="' + Y.PORTRAIT + '" alt="' + esc(P.name_ar || '') + '" width="52" height="52">' +
      '<div><h4>' + esc(t('aboutAuthor')) + '</h4><strong>' + esc(ar() ? P.name_ar : P.name_en) + '</strong><p>' + esc(ar() ? P.title_ar : P.title_en) + '</p></div></div>' +
      '<div class="aside-card"><h4>' + esc(t('published')) + '</h4><div class="aside-meta">' +
      '<span>' + I.calendar + esc(formatDate(article.date, true)) + '</span>' +
      '<span>' + I.bookOpen + esc(sourceLabel(article.source)) + '</span>' +
      '<span>' + I.clock + esc(Y.readingTime(read)) + '</span>' +
      '<span>' + I.file + esc(ar() ? article.category_ar : article.category_en || article.category_ar) + '</span>' +
      '</div></div>' +
      (parts.length ? '<div class="aside-card"><h4>' + esc(t('inThisSeries')) + ' · ' + parts.length + '</h4><nav class="series-nav">' +
        parts.map((part) => '<a href="#part-' + part.part + '">' + esc(part.part) + '. ' + esc(Y.truncate(part.title_ar || part.title_en || '', 58)) + '</a>').join('') +
        '</nav></div>' : '') +
      '<div class="aside-card"><h4>' + esc(t('related')) + '</h4><div class="aside-links">' +
        more.map((item) => '<a href="' + articleUrl(item.id) + '">' + I.chevron + esc(Y.truncate(titleOf(item), 54)) + '</a>').join('') +
        '</div><div class="aside-links" style="margin-top:13px"><button class="btn btn-ghost btn-sm" type="button" data-action="cite-article" data-id="' + esc(article.id) + '">' + I.quote + esc(t('cite')) + '</button>' +
        '<button class="btn btn-ghost btn-sm" type="button" data-action="share-article" data-id="' + esc(article.id) + '">' + I.share + esc(t('share')) + '</button></div></div>' +
      '</aside>';
  }

  function articlePage() {
    const id = new URLSearchParams(window.location.search).get('id');
    const article = id ? Y.INDEX.find((item) => item.id === id) : null;
    if (!article) {
      notFound();
      return;
    }

    const title = titleOf(article);
    const excerpt = excerptOf(article);
    const read = articleRead(article);
    const preferredTags = ar() ? article.tags_ar : article.tags_en;
    const tags = (Array.isArray(preferredTags) && preferredTags.length ? preferredTags : article.tags_ar) || [];
    const url = absolute(articleUrl(article.id));
    const category = ar() ? article.category_ar : article.category_en || article.category_ar;
    const note = t('readingNote') + (article.parts_count ? ' ' + t('seriesNote') : '');
    const related = relatedFor(article);
    const titleClass = Y.titleIsArabicOnly(article) ? ' ar-title' : '';

    applyArticleMeta(article, title, excerpt || title, url);

    if (Y.ui && Y.ui.applyArticleFont) Y.ui.applyArticleFont();

    document.getElementById('pageRoot').innerHTML =
      '<div class="reading-progress" aria-hidden="true"><span id="readingBar"></span></div>' +
      '<article class="article-page"><div class="container">' +
      Y.breadcrumb([{ label: t('articles'), href: 'articles.html' }, { label: Y.truncate(title, 44) }]) +
      '<header class="article-header">' + Y.sourceBadge(article.source) +
      '<h1 class="' + titleClass + '">' + esc(title) + '</h1>' +
      (excerpt ? '<p class="article-dek' + (Y.excerptIsArabicOnly(article) ? ' ar-text' : '') + '">' + esc(excerpt) + '</p>' : '') +
      '<div class="article-byline"><span>' + I.calendar + esc(formatDate(article.date, true)) + '</span><span class="dot"></span>' +
      '<span>' + I.bookOpen + esc(sourceLabel(article.source)) + '</span><span class="dot"></span>' +
      '<span>' + I.clock + esc(Y.readingTime(read)) + '</span>' +
      (article.parts_count ? '<span class="dot"></span><span>' + esc(article.parts_count) + ' ' + esc(t('parts')) + '</span>' : '') + '</div>' +
      '<div class="article-tools">' +
      '<div class="font-controls" role="group" aria-label="' + esc(t('fontSize')) + '"><button type="button" data-action="font-sm" title="' + esc(t('smaller')) + '" aria-label="' + esc(t('smaller')) + '">A−</button><button type="button" data-action="font-lg" title="' + esc(t('larger')) + '" aria-label="' + esc(t('larger')) + '">A+</button></div>' +
      '<button class="btn btn-ghost" type="button" data-action="print">' + I.print + esc(t('print')) + '</button>' +
      '<button class="btn btn-ghost" type="button" data-action="cite-article" data-id="' + esc(article.id) + '">' + I.quote + esc(t('cite')) + '</button>' +
      '<button class="btn btn-ghost" type="button" data-action="share-article" data-id="' + esc(article.id) + '">' + I.share + esc(t('share')) + '</button>' +
      (article.source_url ? '<a class="btn btn-ghost" href="' + esc(article.source_url) + '" target="_blank" rel="noopener">' + I.external + esc(t('originalSource')) + '</a>' : '') +
      '</div></header>' +
      '<div class="article-layout"><div class="article-main">' +
      '<div class="article-note">' + I.info + '<span>' + esc(note) + '</span></div>' +
      '<div class="article-body" dir="rtl" lang="ar">' + articleBody(article) + '</div>' +
      (tags.length ? '<div class="article-tags">' + tags.map((tag) => '<span class="chip" dir="auto">' + esc(tag) + '</span>').join('') + '</div>' : '') +
      '<div class="article-source-box"><span>' + esc(t('originalSource')) + ': ' + esc(sourceLabel(article.source)) + ' · ' + esc(formatDate(article.date)) + '</span>' +
      '<div class="modal-links" style="margin:0">' + sourceLinks(article) + '</div></div>' +
      '</div>' + asideHTML(article) + '</div>' +
      '<section class="related-section"><h2>' + esc(t('related')) + '</h2><div class="related-grid">' + related.map((item) => articleCard(item)).join('') + '</div></section>' +
      '</div></article>';

    if (Y.ui && Y.ui.updateProgress) setTimeout(Y.ui.updateProgress, 30);
    if (window.location.hash) {
      setTimeout(() => {
        const target = document.getElementById(window.location.hash.slice(1));
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 80);
    }
  }

  Y.pages.article = articlePage;
})();
