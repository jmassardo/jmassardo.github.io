(function () {
  'use strict';

  var overlay = document.getElementById('search-overlay');
  var modal = overlay ? overlay.querySelector('.search-modal') : null;
  var searchInput = document.getElementById('search-input');
  var searchResults = document.getElementById('search-results');
  var searchInfo = document.getElementById('search-info');
  var searchClear = document.getElementById('search-clear');
  var searchToggle = document.getElementById('search-toggle');
  var searchClose = document.getElementById('search-close');
  var posts = [];
  var indexLoaded = false;
  var debounceTimer = null;

  // Fetch the search index
  function loadIndex() {
    if (indexLoaded) return;
    var xhr = new XMLHttpRequest();
    xhr.open('GET', '/search.json');
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4 && xhr.status === 200) {
        posts = JSON.parse(xhr.responseText);
        indexLoaded = true;
      }
    };
    xhr.send();
  }

  // Open / close modal
  function openSearch() {
    loadIndex();
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    setTimeout(function () { searchInput.focus(); }, 60);
  }

  function closeSearch() {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
    searchInput.value = '';
    searchResults.innerHTML = '';
    searchInfo.textContent = '';
    searchClear.style.display = 'none';
  }

  // Scoring: title matches worth more than excerpt/tags
  function scorePost(post, terms) {
    var score = 0;
    var titleLower = post.title.toLowerCase();
    var excerptLower = post.excerpt.toLowerCase();
    var tagsLower = (post.tags || []).join(' ').toLowerCase();
    var categoryLower = (post.category || '').toLowerCase();

    for (var i = 0; i < terms.length; i++) {
      var term = terms[i];
      if (titleLower.indexOf(term) !== -1) score += 10;
      if (categoryLower.indexOf(term) !== -1) score += 5;
      if (tagsLower.indexOf(term) !== -1) score += 3;
      if (excerptLower.indexOf(term) !== -1) score += 1;
    }
    return score;
  }

  // Highlight matching terms
  function highlightTerms(text, terms) {
    if (!text) return '';
    var result = text;
    for (var i = 0; i < terms.length; i++) {
      var regex = new RegExp('(' + terms[i].replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
      result = result.replace(regex, '<mark>$1</mark>');
    }
    return result;
  }

  function search(query) {
    if (!query || query.trim().length < 2) {
      searchResults.innerHTML = '';
      searchInfo.textContent = '';
      searchClear.style.display = 'none';
      return;
    }

    searchClear.style.display = 'inline-block';

    var terms = query.toLowerCase().trim().split(/\s+/);
    var results = [];

    for (var i = 0; i < posts.length; i++) {
      var score = scorePost(posts[i], terms);
      if (score > 0) {
        results.push({ post: posts[i], score: score });
      }
    }

    results.sort(function (a, b) { return b.score - a.score; });
    displayResults(results, terms);
  }

  function displayResults(results, terms) {
    if (results.length === 0) {
      searchInfo.textContent = 'No results found.';
      searchResults.innerHTML = '';
      return;
    }

    searchInfo.textContent = results.length + ' result' + (results.length === 1 ? '' : 's') + ' found';

    var html = '';
    var max = Math.min(results.length, 8); // cap visible results for the modal
    for (var i = 0; i < max; i++) {
      var post = results[i].post;
      var tags = '';
      if (post.tags && post.tags.length > 0) {
        tags = '<span class="search-result-tags">';
        for (var t = 0; t < post.tags.length; t++) {
          tags += '<span class="search-result-tag">' + post.tags[t] + '</span>';
        }
        tags += '</span>';
      }

      html += '<a href="' + post.url + '" class="search-result">' +
        '<div class="search-result-title">' + highlightTerms(post.title, terms) + '</div>' +
        '<div class="search-result-meta">' +
          '<time>' + post.date + '</time>' +
          (post.category ? ' &middot; ' + post.category : '') +
        '</div>' +
        '<div class="search-result-excerpt">' + highlightTerms(post.excerpt, terms) + '</div>' +
        tags +
        '</a>';
    }

    if (results.length > max) {
      html += '<p class="search-more">' + (results.length - max) + ' more result' + (results.length - max === 1 ? '' : 's') + '&hellip;</p>';
    }

    searchResults.innerHTML = html;
  }

  // Debounced input
  function onInput() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(function () {
      search(searchInput.value);
    }, 150);
  }

  // Wire up events
  if (searchToggle) {
    searchToggle.addEventListener('click', function (e) {
      e.preventDefault();
      openSearch();
    });
  }

  if (searchClose) {
    searchClose.addEventListener('click', closeSearch);
  }

  if (overlay) {
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeSearch();
    });
  }

  if (searchClear) {
    searchClear.addEventListener('click', function () {
      searchInput.value = '';
      searchInput.focus();
      search('');
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', onInput);
  }

  // Keyboard shortcuts
  document.addEventListener('keydown', function (e) {
    // Cmd/Ctrl+K or / to open search (when not in an input)
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      if (overlay.classList.contains('active')) {
        closeSearch();
      } else {
        openSearch();
      }
    }
    if (e.key === '/' && !overlay.classList.contains('active')) {
      var tag = document.activeElement.tagName;
      if (tag !== 'INPUT' && tag !== 'TEXTAREA' && !document.activeElement.isContentEditable) {
        e.preventDefault();
        openSearch();
      }
    }
    // Escape to close
    if (e.key === 'Escape' && overlay.classList.contains('active')) {
      closeSearch();
    }
  });

  // Preload index on idle
  if ('requestIdleCallback' in window) {
    requestIdleCallback(loadIndex);
  }
})();
