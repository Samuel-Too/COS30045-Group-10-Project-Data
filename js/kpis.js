// K1: four headline numbers for the current filters.
const updateKpis = () => {
  const rows = filterNational();
  const [a, b] = filters.years;
  const cases = d3.sum(rows, d => d.cases);
  const bedDays = d3.sum(rows, d => d.bedDays);
  const byYear = sumBy(rows, "year");
  const male = d3.sum(rows.filter(d => d.sex === "Male"), d => d.cases);
  const female = d3.sum(rows.filter(d => d.sex === "Female"), d => d.cases);
  const first = byYear.get(a);
  const last = byYear.get(b);

  animateNumber("#kpi-total", cases, n => formatCount(Math.round(n)));
  setText("#kpi-range", a === b ? `in ${a}` : `${a}–${b}, all years combined`);
  animateNumber("#kpi-change", a === b || !first ? NaN : last / first - 1, formatPct);
  setText("#kpi-change-note", a === b ? "Choose two or more years" : `${a} to ${b}`);
  animateNumber("#kpi-bpc", cases ? bedDays / cases : NaN, d3.format(".1f"));
  setText("#kpi-bpc-note", a < 2016 ? "Bed days per case (coding changed in 2015)" : "Bed days per case");
  animateNumber("#kpi-male", male + female ? male / (male + female) : NaN, formatShare);
  setText("#scope-kpi", scopeText(["roadUser", "age", "sex", "remoteness"]));
};
