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

  setText("#kpi-total", formatCount(cases));
  setText("#kpi-range", a === b ? `in ${a}` : `${a}–${b}, all years combined`);
  setText("#kpi-change", a === b || !first ? "–" : formatPct(last / first - 1));
  setText("#kpi-change-note", a === b ? "Choose two or more years" : `${a} to ${b}`);
  setText("#kpi-bpc", cases ? d3.format(".1f")(bedDays / cases) : "–");
  setText("#kpi-bpc-note", a < 2016 ? "Bed days per case (coding changed in 2015)" : "Bed days per case");
  setText("#kpi-male", male + female ? formatShare(male / (male + female)) : "–");
  setText("#scope-kpi", scopeText(["roadUser", "age", "sex", "remoteness"]));
};
