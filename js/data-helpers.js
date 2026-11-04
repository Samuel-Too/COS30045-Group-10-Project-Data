// Filtering and totals over the three cubes.
const data = { national: [], states: [], fn: [] };

const inYears = d => d.year >= filters.years[0] && d.year <= filters.years[1];

// National rows that match every active filter except the ones in `skip`.
const filterNational = (skip = [], limitYears = true) => data.national.filter(d =>
  (!limitYears || inYears(d)) &&
  ["roadUser", "age", "sex", "remoteness"].every(k => skip.includes(k) || filters[k] === null || d[k] === filters[k]));

const sumBy = (rows, key) => d3.rollup(rows, v => d3.sum(v, d => d.cases), d => d[key]);
