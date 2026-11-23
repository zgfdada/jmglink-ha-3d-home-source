import assert from 'node:assert/strict';
import test from 'node:test';
import {readCatalogPages, withControlEntries} from '../apps/web/src/app/resource-center/discovery-pages.js';

const item = (resource, name = resource) => ({manifest: {resource, name}});

test('filters can find a release past the first page and moving rows are deduplicated', async () => {
  const first = Array.from({length: 50}, (_, index) => item('test/item-' + index));
  const second = [first[49], item('test/final', '明室灯')];
  const offsets = [];
  const all = await readCatalogPages(async offset => {
    offsets.push(offset);
    return offset === 0 ? {items:first, nextOffset:50} : {items:second, nextOffset:null};
  }, new AbortController().signal);
  assert.deepEqual(offsets, [0, 50]);
  assert.equal(all.length, 51);
  assert.equal(all.find(row => row.manifest.name === '明室灯').manifest.resource, 'test/final');
});

test('a cancelled, failing or invalid later page cannot publish a partial catalog', async () => {
  const controller = new AbortController();
  let calls = 0;
  await assert.rejects(readCatalogPages(async () => {
    calls++;
    controller.abort();
    return {items:[item('test/first')], nextOffset:50};
  }, controller.signal), {name:'AbortError'});
  assert.equal(calls, 1);
  await assert.rejects(readCatalogPages(async () => ({
    items:[item('test/first')], nextOffset:null, total:2
  }), new AbortController().signal), /目录已变更/);
  for (const cursor of [0, undefined, -1, '50']) {
    await assert.rejects(readCatalogPages(async () => ({
      items:[item('test/first')], nextOffset:cursor
    }), new AbortController().signal), /分页异常/);
  }
  await assert.rejects(readCatalogPages(async offset => {
    if (offset) throw Error('读取失败');
    return {items:[item('test/first')], nextOffset:50};
  }, new AbortController().signal), /读取失败/);
});

test('online controls use verified entries, limit concurrent reads, and retry unavailable declarations', async () => {
  const signal=new AbortController().signal;
  const cache=new Map();
  const rows=Array.from({length:8}, (_,i)=>({...item('test/resource-'+i,'温度开关'),manifestSha256:'digest-'+i}));
  let active=0, peak=0;
  const calls=[];
  const read=async row=>{
    calls.push(row.manifestSha256);
    active++;
    peak=Math.max(active,peak);
    try {
      await Promise.resolve();
      if(row===rows[1])throw Error('temporarily unavailable');
      return {kind:'control',control:{type:'status',dataTypes:['string']}};
    } finally {active--;}
  };
  const enriched=await withControlEntries(rows,read,signal,cache);
  assert.equal(peak,3);
  assert.deepEqual(enriched[0].entry.control.dataTypes,['string']);
  assert.equal(enriched[1].controlEntryUnavailable,true);
  assert.equal(enriched[1].entry,undefined);
  calls.length=0;
  await withControlEntries(rows,read,signal,cache);
  assert.deepEqual(calls,[rows[1].manifestSha256]);
  const cancelled=new AbortController();
  await assert.rejects(withControlEntries([rows[1]],async()=>{
    cancelled.abort();
    return {kind:'control',control:{type:'toggle',dataTypes:['boolean']}};
  },cancelled.signal,cache),{name:'AbortError'});
  assert.equal(cache.has(rows[1].manifestSha256),false);
});
