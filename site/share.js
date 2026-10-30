// All posts, descriptions and the visual transcript live in the public HTML.
// without JavaScript. This enhancement never publishes or uploads anything.
export function mountShare(root = document, clipboard = globalThis.navigator?.clipboard) {
  const listeners = [];
  const mediaListeners = [];
  let disposed = false;
  const byId = id => root.querySelector(`[id="${id}"]`);
  function announce(button, message) {
    const status = byId(button.dataset.status);
    if (status) status.textContent = message;
  }
  function selectText(field, button, automaticFallback = false) {
    const disclosure = field.closest?.('details');
    if (disclosure) disclosure.open = true;
    field.focus();
    field.select();
    field.setSelectionRange?.(0, field.value.length);
    announce(button, automaticFallback
      ? 'Clipboard access is unavailable. Text selected: use Ctrl+C, Command+C, or your device’s Copy command.'
      : 'Text selected. Use Ctrl+C, Command+C, or your device’s Copy command.');
  }
  for (const button of root.querySelectorAll('[data-copy], [data-select]')) {
    const handler = async () => {
      const field = byId(button.dataset.copy || button.dataset.select);
      if (!field || disposed) return;
      if (button.dataset.select) { selectText(field, button); return; }
      button.disabled = true;
      try {
        if (!clipboard || typeof clipboard.writeText !== 'function') throw new Error('Clipboard unavailable');
        await clipboard.writeText(field.value);
        if (!disposed) announce(button, button.dataset.copy.startsWith('alt-') ? (button.dataset.description === 'video' ? 'Video description copied. Add it as accompanying text where your platform supports it.' : 'Image description copied. Add it as alt text when you attach the image.') : button.dataset.copy === 'site-link' ? 'Website link copied.' : 'Post copied. Paste it into your composer and make it your own.');
      } catch {
        if (!disposed) selectText(field, button, true);
      } finally { if (!disposed) button.disabled = false; }
    };
    button.addEventListener('click', handler);
    listeners.push([button, handler]);
  }
  const video = root.querySelector('[data-launch-video]');
  if (video) {
    const videoStatus = root.querySelector('[data-video-status]');
    const onError = () => { if (!disposed && videoStatus) videoStatus.textContent = 'The preview could not load. You can download the MP4, or read the visual transcript below.'; };
    const onReady = () => { if (!disposed && videoStatus) videoStatus.textContent = ''; };
    for (const [event, handler] of [['error', onError], ['loadedmetadata', onReady]]) { video.addEventListener(event, handler); mediaListeners.push([video, event, handler]); }
    const owner = video.ownerDocument;
    if (owner) {
      const pauseWhenHidden = () => { if (owner.hidden) video.pause(); };
      owner.addEventListener('visibilitychange', pauseWhenHidden);
      mediaListeners.push([owner, 'visibilitychange', pauseWhenHidden]);
    }
  }
  return () => {
    disposed = true;
    for (const [button, handler] of listeners) { button.removeEventListener('click', handler); button.disabled = false; }
    for (const [node, event, handler] of mediaListeners) node.removeEventListener(event, handler);
    video?.pause();
  };
}

if (typeof document !== 'undefined') mountShare(document);
