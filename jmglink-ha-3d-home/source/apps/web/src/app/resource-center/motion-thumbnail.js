// The motion JSON can be shared even when the browser cannot render its preview.
export async function captureMotionThumbnail(render, page = document, timeoutMs = 4000) {
  if (page.hidden) return;
  let finish;
  const result = new Promise(resolve => { finish = resolve; });
  const onVisibility = () => { if (page.hidden) finish(); };
  page.addEventListener('visibilitychange', onVisibility);
  const timer = setTimeout(finish, timeoutMs);
  let unmount;
  try {
    unmount = render(finish);
    const image = await result;
    const prefix = 'data:image/png;base64,';
    if (typeof image !== 'string' || !image.startsWith(prefix)) return;
    const padding = image.endsWith('==') ? 2 : image.endsWith('=') ? 1 : 0;
    const bytes = (image.length - prefix.length) * 3 / 4 - padding;
    if (bytes > 0 && bytes <= 512 * 1024) return image;
  } catch {
    // A WebGL/DOM setup failure affects only the optional image.
  } finally {
    clearTimeout(timer);
    page.removeEventListener('visibilitychange', onVisibility);
    unmount?.();
  }
}
