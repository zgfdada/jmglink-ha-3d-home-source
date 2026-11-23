// The list contains only published manifests. Model assets load on selection.
export async function readCatalogPages(readPage, signal) {
  const resources = new Map();
  let offset = 0;
  while (true) {
    signal.throwIfAborted();
    const page = await readPage(offset, signal);
    signal.throwIfAborted();
    if (!Array.isArray(page?.items)) throw Error('在线目录数据格式有误，请重试。');
    for (const item of page.items) {
      const key = item.manifest?.resource;
      if (!key) throw Error('在线目录缺少资源信息，请重试。');
      if (!resources.has(key)) resources.set(key, item);
    }
    if (page.nextOffset === null) {
      if (Number.isSafeInteger(page.total) && page.total !== resources.size) {
        throw Error('在线目录已变更，请重新加载。');
      }
      return [...resources.values()];
    }
    if (!Number.isSafeInteger(page.nextOffset) || page.nextOffset <= offset || !page.items.length) {
      throw Error('在线目录分页异常，请刷新后重试。');
    }
    offset = page.nextOffset;
  }
}

// Only control definitions carry their supported data types. The published
// list provides release identity; the verified JSON entry provides the types.
export async function withControlEntries(items, readEntry, signal, cache) {
  const result = items.slice();
  let cursor = 0;
  async function readNext() {
    while (cursor < items.length) {
      signal.throwIfAborted();
      const index = cursor++;
      const row = items[index];
      const hash = row.manifestSha256;
      const cached = cache.get(hash);
      if (cached) {
        result[index] = {...row, entry:cached};
        continue;
      }
      try {
        const entry = await readEntry(row, signal);
        signal.throwIfAborted();
        if (entry?.kind !== 'control' || !entry.control) {
          result[index] = {...row, controlEntryUnavailable:true};
          continue;
        }
        if (hash) {
          if (cache.size >= 128) cache.delete(cache.keys().next().value);
          cache.set(hash, entry);
        }
        result[index] = {...row, entry};
      } catch (error) {
        if (signal.aborted) throw error;
        result[index] = {...row, controlEntryUnavailable:true};
      }
    }
  }
  await Promise.all(Array.from({length:Math.min(items.length, 3)}, readNext));
  return result;
}
