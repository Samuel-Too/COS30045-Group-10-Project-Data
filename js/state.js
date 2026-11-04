// The single filter model. Charts read `filters` and register an update function in `updaters`.
const filters = { years: [...FULL_YEARS], roadUser: null, age: null, sex: null, remoteness: null, state: null };
const scopeKeys = ["roadUser", "age", "remoteness"];
const updaters = [];
let lastSet = null;

const toggleFilter = (key, value) => filters[key] === value ? null : value;

const setFilters = (patch) => {
  Object.assign(filters, patch);
  const touched = scopeKeys.filter(k => k in patch && patch[k] !== null);
  if (touched.length) lastSet = touched[touched.length - 1];
  if (lastSet && filters[lastSet] === null) lastSet = scopeKeys.find(k => filters[k] !== null) || null;
  updateAll();
};

const resetFilters = () => setFilters({ years: [...FULL_YEARS], roadUser: null, age: null, sex: null, remoteness: null, state: null });

const updateAll = () => {
  hideTooltip();
  updaters.forEach(update => update());
  renderChips();
};

// State and First Nations files hold one dimension at a time, so they use the latest filter their file supports.
const scopeFor = (supported) => {
  const key = [lastSet, ...scopeKeys].find(k => k && filters[k] !== null && supported[k]);
  return key ? { key, dim: supported[key], category: filters[key] } : { key: null, dim: "total", category: "All" };
};

const scopeText = (keys, withYears = true) => {
  const parts = [];
  const [a, b] = filters.years;
  if (withYears && (a !== FULL_YEARS[0] || b !== FULL_YEARS[1])) parts.push(`${a}–${b}`);
  keys.filter(k => filters[k] !== null).forEach(k => parts.push(`${filterLabels[k]}: ${filters[k]}`));
  return parts.length ? `Showing: ${parts.join(" · ")}` : "Showing: all data";
};

const scopeBadge = (scope) => {
  const other = scopeKeys.some(k => filters[k] !== null && k !== scope.key);
  const base = scope.key ? `Showing: years + ${filterLabels[scope.key]}: ${scope.category}` : "Showing: years only";
  return other ? `${base} (other filters not in this file)` : base;
};
