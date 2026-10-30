const BOOKMARK_KEY = 'beyond-earth-reels-v1';
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const videoPattern = /^[a-zA-Z0-9_-]{11}$/;
const idPattern = /^[a-z0-9-]{1,80}$/;
const sourceHosts = new Set(['www.youtube.com', 'www.ted.com', 'ed.ted.com', 'www.jpl.nasa.gov']);
let apiPromise, mountNumber = 0;

export function validateReels(data) {
  if (!data || data.version !== 1 || !Array.isArray(data.reels) || !data.reels.length || data.reels.length > 12) throw new Error('The reel collection is unavailable.');
  const ids = new Set();
  for (const reel of data.reels) {
    if (!reel || !idPattern.test(reel.id) || ids.has(reel.id) || !videoPattern.test(reel.youtubeId)) throw new Error('The reel collection contains an invalid entry.');
    ids.add(reel.id);
    for (const key of ['speaker', 'role', 'topic', 'headline', 'title', 'channel', 'takeaway', 'prompt']) if (typeof reel[key] !== 'string' || !reel[key].trim()) throw new Error('The reel collection is incomplete.');
    const source = new URL(reel.sourceUrl);
    if (source.protocol !== 'https:' || !sourceHosts.has(source.hostname)) throw new Error('A reel source could not be verified.');
    if (!Number.isFinite(reel.durationSeconds) || reel.durationSeconds <= 0 || !/^\d{4}-\d{2}-\d{2}$/.test(reel.published)) throw new Error('A reel has invalid source information.');
    if (!reel.excerpt || reel.excerpt.start !== 0 || reel.excerpt.end !== 90 || reel.excerpt.end > reel.durationSeconds) throw new Error('A reel has invalid excerpt boundaries.');
    for (const [key, prefix] of [['lesson', 'lesson'], ['project', 'projects']]) if (!reel[key] || typeof reel[key].title !== 'string' || !new RegExp(`^#${prefix}/[a-z0-9-]+$`).test(reel[key].href)) throw new Error('A learning connection is unavailable.');
  }
  return data.reels;
}

export function reelEmbedURL(videoId, origin = globalThis.location?.origin, standardPlayer = false) {
  if (!videoPattern.test(videoId)) throw new Error('Invalid video ID.');
  const host = standardPlayer ? 'www.youtube.com' : 'www.youtube-nocookie.com';
  const url = new URL(`https://${host}/embed/${videoId}`);
  const params = { autoplay: '0', controls: '1', playsinline: '1', cc_load_policy: '1', cc_lang_pref: 'en', rel: '0', enablejsapi: '1', start: '0', end: '90' };
  if (origin && /^https?:\/\//.test(origin)) params.origin = origin;
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  return url.href;
}

function youtubeAPI() {
  if (globalThis.YT?.Player) return Promise.resolve(globalThis.YT);
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve, reject) => {
    const previous = window.onYouTubeIframeAPIReady;
    const script = document.createElement('script');
    let settled = false;
    const finish = error => {
      if (settled) return;
      settled = true; clearTimeout(timer);
      if (window.onYouTubeIframeAPIReady === ready) window.onYouTubeIframeAPIReady = previous;
      if (error) { script.remove(); apiPromise = undefined; reject(error); }
      else resolve(globalThis.YT);
    };
    const ready = () => {
      try { if (typeof previous === 'function') previous(); } catch { /* Another embed's callback is independent. */ }
      finish(globalThis.YT?.Player ? null : new Error('The video player did not initialize.'));
    };
    const timer = setTimeout(() => finish(new Error('The video player took too long to load.')), 15000);
    window.onYouTubeIframeAPIReady = ready;
    script.src = 'https://www.youtube.com/iframe_api'; script.async = true;
    script.addEventListener('error', () => finish(new Error('The video player could not be reached.')), { once: true });
    document.head.append(script);
  });
  return apiPromise;
}

const duration = seconds => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
const bookmarkIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12v18l-6-4-6 4z"/></svg>';
const arrow = '<span aria-hidden="true">↗</span>';

export function mountReels(root, id) {
  const instance = ++mountNumber, controller = new AbortController(), handlers = [];
  let disposed = false, reels = [], cards = [], deck, active = -1, media = null, mediaSequence = 0, scrollFrame, resizeObserver;
  let bookmarks = new Set(), unsavedBookmarks = false;
  const reducedMotion = () => globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
  const readBookmarks = () => {
    try { const data = JSON.parse(localStorage.getItem(BOOKMARK_KEY) || '[]'); return new Set(Array.isArray(data) ? data.filter(value => typeof value === 'string' && idPattern.test(value)) : []); } catch { return null; }
  };
  bookmarks = readBookmarks() || new Set();
  const on = (node, event, handler, options) => { node.addEventListener(event, handler, options); handlers.push([node, event, handler, options]); };
  const find = selector => root.querySelector(selector);
  const status = message => { const node = find('[data-reel-status]'); if (node && !disposed) node.textContent = message; };
  const playerStatus = (index, message) => { const node = cards[index]?.querySelector('[data-player-status]'); if (node && !disposed) node.textContent = message; };

  function unloadPlayer(message = '') {
    mediaSequence++;
    if (!media) return;
    const old = media; media = null; clearTimeout(old.timer); clearInterval(old.boundaryTimer);
    try { old.player?.destroy(); } catch { /* Removing the iframe below also stops playback. */ }
    const card = cards[old.index];
    if (!card) return;
    const host = card.querySelector('[data-player-host]');
    host.replaceChildren(); host.hidden = true;
    card.querySelector('[data-poster]').hidden = false;
    const button = card.querySelector('[data-load-video]');
    button.disabled = false; button.querySelector('span').textContent = 'Load 90-second excerpt';
    card.querySelector('[data-standard-player]').hidden = true;
    card.querySelector('[data-standard-disclosure]').hidden = true;
    playerStatus(old.index, message);
  }

  function activate(index) {
    index = Math.max(0, Math.min(cards.length - 1, index));
    if (index === active) return;
    unloadPlayer(); active = index;
    cards.forEach((card, position) => { card.inert = position !== index; card.classList.toggle('reel-is-current', position === index); });
    find('[data-reel-position]').textContent = index < reels.length ? `${String(index + 1).padStart(2, '0')} / ${String(reels.length).padStart(2, '0')}` : 'YOUR NEXT STEP';
    find('[data-previous]').disabled = index === 0;
    find('[data-next]').disabled = index === cards.length - 1;
    find('[data-next]').setAttribute('aria-label', index === reels.length - 1 ? 'Finish the reel and choose a learning activity' : 'Next talk');
    find('[data-reel-jump]').value = index < reels.length ? reels[index].id : 'finish';
    root.querySelectorAll('[data-reel-dot]').forEach((dot, position) => { dot.classList.toggle('reel-dot-current', position === index); dot.setAttribute('aria-current', position === index ? 'step' : 'false'); });
    status(index < reels.length ? `${index + 1} of ${reels.length}: ${reels[index].speaker}.` : 'You have reached the end of the collection. Choose one idea to put to work.');
  }

  function goTo(index, smooth = true) {
    index = Math.max(0, Math.min(cards.length - 1, index));
    const top = cards[index].offsetTop;
    activate(index);
    deck.scrollTo({ top, behavior: smooth && !reducedMotion() ? 'smooth' : 'auto' });
  }

  function syncPosition() {
    scrollFrame = undefined;
    if (disposed || !deck) return;
    const target = deck.scrollTop + Math.min(deck.clientHeight * .42, 230);
    let index = 0;
    for (let position = 0; position < cards.length; position++) if (cards[position].offsetTop <= target) index = position;
    activate(index);
  }

  function renderBookmarks() {
    root.querySelectorAll('[data-bookmark]').forEach(button => {
      const saved = bookmarks.has(button.dataset.bookmark);
      button.setAttribute('aria-pressed', String(saved));
      button.setAttribute('aria-label', `${saved ? 'Remove bookmark for' : 'Bookmark'} ${reels.find(reel => reel.id === button.dataset.bookmark)?.speaker || 'this talk'}`);
      button.querySelector('span').textContent = saved ? 'Saved' : 'Save';
    });
    find('[data-saved-count]').textContent = String(reels.filter(reel => bookmarks.has(reel.id)).length);
  }

  function saveBookmark(reelId) {
    const latest = !unsavedBookmarks && readBookmarks();
    if (latest) bookmarks = latest;
    const wasSaved = bookmarks.has(reelId);
    if (wasSaved) bookmarks.delete(reelId); else bookmarks.add(reelId);
    unsavedBookmarks = true;
    try { localStorage.setItem(BOOKMARK_KEY, JSON.stringify([...bookmarks])); unsavedBookmarks = false; } catch { /* Keep the choice for this visit. */ }
    renderBookmarks();
    status(`${wasSaved ? 'Bookmark removed' : 'Talk bookmarked'}${unsavedBookmarks ? ' for this visit. Browser storage is unavailable.' : ' on this device.'}`);
  }

  async function loadVideo(index, standardPlayer = false) {
    if (disposed || index !== active || index >= reels.length) return;
    unloadPlayer();
    const token = ++mediaSequence, reel = reels[index], card = cards[index];
    const button = card.querySelector('[data-load-video]'), host = card.querySelector('[data-player-host]');
    const standardButton = card.querySelector('[data-standard-player]');
    const standardDisclosure = card.querySelector('[data-standard-disclosure]');
    standardButton.hidden = true; standardDisclosure.hidden = !standardPlayer;
    media = { index, token, player: null, timer: null, boundaryTimer: null, finished: false };
    card.classList.remove('reel-talk-finished');
    button.disabled = true; button.querySelector('span').textContent = 'Loading…';
    playerStatus(index, 'Loading the original YouTube player…');
    const valid = () => !disposed && active === index && media?.token === token;
    const fail = message => {
      if (!valid()) return;
      unloadPlayer(message);
      standardButton.hidden = false; standardDisclosure.hidden = false;
      standardButton.textContent = standardPlayer ? 'Retry standard YouTube player' : 'Try standard YouTube player';
    };
    const finishExcerpt = () => {
      if (!valid()) return;
      media.finished = true; clearInterval(media.boundaryTimer); media.boundaryTimer = null;
      playerStatus(index, 'Opening excerpt finished. Try a learning connection, or follow the full-talk link.');
      card.classList.add('reel-talk-finished');
    };
    const checkBoundary = () => {
      if (!valid()) return;
      try {
        if (media.player?.getCurrentTime() >= reel.excerpt.end) {
          finishExcerpt(); media.player.pauseVideo();
        }
      } catch { /* The documented embed end parameter also bounds playback. */ }
    };
    try {
      const YT = await youtubeAPI();
      if (!valid()) return;
      const frame = document.createElement('iframe');
      frame.id = `beyond-earth-reel-${instance}-${token}`;
      frame.title = `${reel.speaker}: ${reel.title}`;
      frame.referrerPolicy = 'strict-origin-when-cross-origin';
      frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      frame.setAttribute('allowfullscreen', '');
      frame.src = reelEmbedURL(reel.youtubeId, globalThis.location?.origin, standardPlayer);
      host.replaceChildren(frame); host.hidden = false; card.querySelector('[data-poster]').hidden = true;
      media.timer = setTimeout(() => fail('The embedded player did not respond. Try loading again, or use “Full talk on YouTube” below.'), 15000);
      media.player = new YT.Player(frame.id, { events: {
        onReady: event => {
          if (!valid()) { try { event.target.destroy(); } catch {} return; }
          clearTimeout(media.timer);
          event.target.getIframe().setAttribute('title', `${reel.speaker}: ${reel.title}`);
          playerStatus(index, 'Ready. Press Play for the opening 90 seconds. Captions are requested; use CC to adjust them.');
        },
        onStateChange: event => {
          if (!valid()) return;
          clearInterval(media.boundaryTimer); media.boundaryTimer = null;
          if (event.data === 1) {
            media.finished = false; card.classList.remove('reel-talk-finished');
            playerStatus(index, 'Playing the opening excerpt: 0:00–1:30.');
            media.boundaryTimer = setInterval(checkBoundary, 250); checkBoundary();
          }
          else if (event.data === 2 && !media.finished) playerStatus(index, 'Paused. Take the idea into a lesson whenever you are ready.');
          else if (event.data === 0) finishExcerpt();
        },
        onError: event => {
          const message = [100, 101, 150].includes(event.data) ? 'This video cannot play here right now. Use “Full talk on YouTube” below.' : event.data === 153 ? 'YouTube could not verify this embedded player. Use “Full talk on YouTube” below.' : 'The video could not play in this browser. Try loading again or watch on YouTube.';
          fail(message);
        }
      } });
    } catch { fail('The player could not load. Try again or use “Full talk on YouTube” below.'); }
  }

  function cardHTML(reel, index) {
    const accent = ['cyan', 'gold', 'lilac'].includes(reel.accent) ? reel.accent : 'cyan';
    return `<article class="reel-card reel-${accent}" data-reel-card tabindex="-1" aria-labelledby="reel-name-${instance}-${index}"><div class="reel-card-top"><span class="reel-eyebrow">${String(index + 1).padStart(2, '0')} / ${esc(reel.topic)}</span><button class="reel-bookmark" data-bookmark="${esc(reel.id)}" type="button" aria-pressed="false">${bookmarkIcon}<span>Save</span></button></div><div class="reel-card-body"><div class="reel-media-column"><div class="reel-video-stage"><div class="reel-poster" data-poster><img src="https://i.ytimg.com/vi/${reel.youtubeId}/hqdefault.jpg" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer"><div class="reel-poster-shade"></div><span class="reel-source-stamp">${esc(reel.channel)}<small>OPENING EXCERPT · 90 SECONDS</small></span><button class="reel-load" data-load-video="${index}" type="button" aria-label="Load a 90-second opening excerpt featuring ${esc(reel.speaker)}"><svg viewBox="0 0 28 28" aria-hidden="true"><path d="m10 6 13 8-13 8z"/></svg><span>Load 90-second excerpt</span></button><span class="reel-duration">0:00–1:30</span></div><div class="reel-player" data-player-host hidden></div></div><p class="reel-player-status" data-player-status role="status" aria-live="polite"></p><button class="reel-bookmark" data-standard-player="${index}" type="button" hidden>Try standard YouTube player</button><p class="reel-player-status" data-standard-disclosure hidden>This connects to standard YouTube.</p><div class="reel-original"><h3>${esc(reel.title)}</h3><span>Published ${esc(reel.published.slice(0, 4))} · Full talk ${duration(reel.durationSeconds)}</span></div><div class="reel-source-links"><a href="https://www.youtube.com/watch?v=${reel.youtubeId}" target="_blank" rel="noopener">Full talk on YouTube ${arrow}</a><a href="${esc(reel.sourceUrl)}" target="_blank" rel="noopener">Source ${arrow}</a></div></div><div class="reel-context"><span class="reel-role">${esc(reel.role)}</span><h2 id="reel-name-${instance}-${index}">${esc(reel.speaker)}</h2><h3 class="reel-headline">${esc(reel.headline)}</h3><p class="reel-takeaway">${esc(reel.takeaway)}</p><div class="reel-next-step"><span class="reel-eyebrow">TAKE IT INTO YOUR OWN WORK</span><p>${esc(reel.prompt)}</p><a class="reel-learning-link" href="${esc(reel.lesson.href)}"><span><small>LEARN THE IDEA</small>${esc(reel.lesson.title)}</span>${arrow}</a><a class="reel-learning-link reel-project-link" href="${esc(reel.project.href)}"><span><small>MAKE SOMETHING</small>${esc(reel.project.title)}</span>${arrow}</a></div></div></div></article>`;
  }

  async function initialize() {
    root.innerHTML = '<div class="reels-loading" role="status"><span class="reel-eyebrow">VOICES FROM THE FRONTIER</span><h1>Finding a little perspective…</h1></div>';
    try {
      const response = await fetch(new URL('./data/reels.json', import.meta.url), { signal: controller.signal });
      if (!response.ok) throw new Error('Collection unavailable.');
      const data = await response.json();
      if (disposed) return;
      reels = validateReels(data);
      root.innerHTML = `<div class="reels-page"><header class="reels-header"><div><span class="reel-eyebrow">VOICES FROM THE FRONTIER</span><h1>A little perspective.<br><em>A reason to begin.</em></h1></div><div class="reels-intro"><p>Real people. Real work. ${reels.length} opening excerpts, 90 seconds each. See where the learning can lead.</p><a href="#paths">Take me back to learning ${arrow}</a></div></header><div class="reels-toolbar"><label class="reels-jump"><span class="reel-sr-only">Choose a speaker or the final learning step</span><select data-reel-jump>${reels.map(reel => `<option value="${reel.id}">${esc(reel.speaker)}</option>`).join('')}<option value="finish">Your next step</option></select></label><span class="reels-saved">${bookmarkIcon}<span data-saved-count>0</span> saved</span><div class="reels-nav"><button data-previous type="button" aria-label="Previous talk">↑</button><span data-reel-position>01 / ${String(reels.length).padStart(2, '0')}</span><button data-next type="button" aria-label="Next talk">↓</button></div></div><div class="reels-deck" data-reel-deck tabindex="0" role="region" aria-label="A finite collection of ${reels.length} 90-second opening excerpts. Scroll or use up and down arrow keys to move between excerpts.">${reels.map(cardHTML).join('')}<article class="reel-card reel-end" data-reel-card tabindex="-1" aria-labelledby="reel-end-title-${instance}"><div class="reel-end-orbit" aria-hidden="true"><span>↗</span></div><span class="reel-eyebrow">THAT IS THE WHOLE COLLECTION</span><h2 id="reel-end-title-${instance}">Keep the spark.<br><em>Make the next move.</em></h2><p>Choose one idea. Give it twenty minutes, a page of working, or a small thing you can build.</p><div class="reel-end-actions"><a href="#paths">Choose a learning path ${arrow}</a><a href="#projects/paper-arm">Build a paper robot arm ${arrow}</a><a href="#journey">Open your mission control ${arrow}</a></div><button data-back-to-first type="button">Revisit the first talk ↑</button></article></div><footer class="reels-footer"><div class="reels-position-dots" aria-label="Talk navigation">${reels.map((reel, index) => `<button data-reel-dot="${index}" type="button" aria-label="Go to ${esc(reel.speaker)}" title="${esc(reel.speaker)}"></button>`).join('')}<button data-reel-dot="${reels.length}" type="button" aria-label="Go to the final learning step" title="Your next step"></button></div><span>Swipe or scroll · ↑ ↓ to move · ${reels.length} excerpts · 12 minutes in all</span><p data-reel-status class="reel-live-status" role="status" aria-live="polite"></p></footer><details class="reels-about"><summary>About the videos &amp; your bookmarks</summary><p>Each excerpt is the opening 90 seconds (0:00–1:30) of its publisher’s original video, not a selected highlight. The full talk is linked beneath it. The connections to lessons are Beyond Earth’s own reflections on the talk, not quotations. Speakers and publishers are not affiliated with this website.</p><p>Preview images come from YouTube. The privacy-enhanced YouTube player loads only after you choose a video, with autoplay off and captions requested. If it cannot connect, you can explicitly choose the standard YouTube player instead. Each video also has a direct watch link. Bookmarks stay in this browser.</p></details></div>`;
      deck = find('[data-reel-deck]'); cards = [...root.querySelectorAll('[data-reel-card]')];
      on(find('[data-previous]'), 'click', () => goTo(active - 1));
      on(find('[data-next]'), 'click', () => goTo(active + 1));
      on(find('[data-reel-jump]'), 'change', event => goTo(event.target.value === 'finish' ? reels.length : reels.findIndex(reel => reel.id === event.target.value), false));
      on(find('[data-back-to-first]'), 'click', () => { goTo(0, false); deck.focus({ preventScroll: true }); });
      for (const button of root.querySelectorAll('[data-reel-dot]')) on(button, 'click', () => goTo(Number(button.dataset.reelDot)));
      for (const button of root.querySelectorAll('[data-bookmark]')) on(button, 'click', () => saveBookmark(button.dataset.bookmark));
      for (const button of root.querySelectorAll('[data-load-video]')) on(button, 'click', () => loadVideo(Number(button.dataset.loadVideo)));
      for (const button of root.querySelectorAll('[data-standard-player]')) on(button, 'click', () => loadVideo(Number(button.dataset.standardPlayer), true));
      on(deck, 'scroll', () => { if (!scrollFrame) scrollFrame = requestAnimationFrame(syncPosition); }, { passive: true });
      on(deck, 'keydown', event => {
        if (event.altKey || event.ctrlKey || event.metaKey || event.target.closest('input,textarea,select,iframe')) return;
        const targets = { ArrowDown: active + 1, PageDown: active + 1, ArrowUp: active - 1, PageUp: active - 1, Home: 0, End: cards.length - 1 };
        if (!(event.key in targets)) return;
        event.preventDefault(); goTo(targets[event.key], false); deck.focus({ preventScroll: true });
      });
      on(document, 'visibilitychange', () => { if (document.hidden) { try { media?.player?.pauseVideo(); } catch {} } });
      on(window, 'storage', event => { if (event.key === BOOKMARK_KEY && !unsavedBookmarks) { bookmarks = readBookmarks() || bookmarks; renderBookmarks(); } });
      if (typeof ResizeObserver !== 'undefined') { resizeObserver = new ResizeObserver(() => { if (!disposed && active >= 0) goTo(active, false); }); resizeObserver.observe(deck); }
      renderBookmarks();
      const initial = id === 'finish' ? reels.length : reels.findIndex(reel => reel.id === id);
      goTo(initial < 0 ? 0 : initial, false);
      if (id && initial < 0) status('That talk is not in this collection. Here is the first one.');
    } catch (error) {
      if (disposed || error.name === 'AbortError') return;
      root.innerHTML = '<div class="reels-loading reels-error"><span class="reel-eyebrow">THE COLLECTION COULD NOT LOAD</span><h1>Let’s reconnect.</h1><p>The videos are not available here right now.</p><button data-retry-reels type="button">Try again</button><a href="#paths">Return to learning ↗</a></div>';
      on(find('[data-retry-reels]'), 'click', initialize);
    }
  }
  initialize();
  return () => {
    disposed = true; controller.abort(); unloadPlayer(); resizeObserver?.disconnect();
    if (scrollFrame) cancelAnimationFrame(scrollFrame);
    for (const [node, event, handler, options] of handlers) node.removeEventListener(event, handler, options);
  };
}
