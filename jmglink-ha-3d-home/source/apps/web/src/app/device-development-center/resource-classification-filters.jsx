import {a as React} from '../../vendor/react.js';
import {classifyResource, matchesResource, resourceFilterOptions} from './resource-classification.js';
import './resource-classification-filters.css';

const physicalFields = [
  ['category', '用途分类', '全部用途', 'categories'],
  ['subcategory', '子分类', '全部子类', 'subcategories'],
  ['productType', '产品属性', '全部属性', 'productTypes'],
  ['brand', '厂家 / 品牌', '全部厂家', 'brands'],
  ['model', '产品型号', '全部型号', 'models'],
];
const controlFields = [
  ['attribute', '支持的设备属性', '全部属性', 'attributes'],
  ['access', '控件用途', '全部用途', 'accessModes'],
];
const emptyFilters = Object.freeze({});

export function useResourceClassification(resources, kind, query = '') {
  const library = typeof kind === 'string' ? kind : 'mixed';
  const fields = library === 'device-control' ? controlFields : physicalFields;
  const [selection, setSelection] = React.useState({library, filters: emptyFilters});
  const filters = selection.library === library ? selection.filters : emptyFilters;
  const records = React.useMemo(() => resources.map(item => ({
    item,
    facts: classifyResource(item, typeof kind === 'function' ? kind(item) : kind),
  })), [resources, kind]);
  const factList = React.useMemo(() => records.map(record => record.facts), [records]);
  const options = React.useMemo(() => resourceFilterOptions(factList, filters), [factList, filters]);
  const matching = React.useMemo(() => records.filter(record =>
    matchesResource(record.facts, {...filters, query})
  ), [records, filters, query]);
  const factsByItem = React.useMemo(() => new Map(records.map(record => [record.item, record.facts])), [records]);
  function setFilter(key, value) {
    setSelection(previous => {
      const next = {...(previous.library === library ? previous.filters : emptyFilters), [key]: value};
      if (key === 'category') delete next.subcategory;
      // Carry a valid selection across sibling categories, dropping only
      // descendants which the newly selected branch does not contain.
      for (const [child,,,optionKey] of fields.slice(fields.findIndex(field => field[0] === key) + 1)) {
        if (child !== 'model' && next[child] && !resourceFilterOptions(factList, next)[optionKey].includes(next[child])) {
          delete next[child];
        }
      }
      return {library, filters: next};
    });
  }
  return {
    items: matching.map(record => record.item), count: matching.length,
    total: resources.length, library, fields, factsByItem, options, filters, setFilter,
    active: Object.values(filters).some(Boolean), reset: () => setSelection({library, filters: emptyFilters}),
  };
}

export default function ResourceClassificationFilters({catalog}) {
  const {library, fields, options, filters, setFilter, reset, active, count} = catalog;
  return <section className="ddc-catalog-filter" aria-label={library === 'device-control' ? '控件适配筛选' : '资源分类筛选'}>
    <div className="ddc-catalog-fields">
      {fields.map(([key, label, allLabel, valuesKey]) => {
        const values = options[valuesKey] ?? [];
        const selected = filters[key] || '';
        if (key === 'subcategory' && !filters.category) return null;
        if (key === 'model') return <label key={key}><span>{label}</span>
          <input type="search" value={selected} placeholder="输入完整或部分型号"
            onChange={event => setFilter(key, event.target.value)} />
        </label>;
        if (!values.length && !selected && key !== 'category' && key !== 'attribute') return null;
        return <label key={key}>
          <span>{label}</span>
          <select value={selected} onChange={event => setFilter(key, event.target.value)}>
            <option value="">{allLabel}</option>
            {selected && !values.includes(selected) && <option value={selected}>{selected}</option>}
            {values.map(value => <option value={value} key={value}>{value}</option>)}
          </select>
        </label>;
      })}
    </div>
    <div className="ddc-catalog-result">
      {active && <button type="button" onClick={reset}>{library === 'device-control' ? '清除筛选' : '清除分类'}</button>}
      <span role="status" aria-live="polite">{count} 个结果</span>
    </div>
  </section>;
}
