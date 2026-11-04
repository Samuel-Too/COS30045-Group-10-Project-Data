// F2: where First Nations and Non-Indigenous cases live (remoteness). Clicking a segment sets the area filter.
const remote = { w: 520, rowH: 64, labelW: 118, barW: 390 };

const drawRemote = () => {
  const r = remote;
  r.inner = createSvg("#chart-remote", r.w, fnStatus.length * r.rowH + 6, "Stacked bars of remoteness for First Nations and Non-Indigenous cases")
    .append("g").attr("transform", "translate(0,4)");
};

const updateRemote = () => {
  const r = remote;
  const rows = data.fn.filter(d => d.dim === "remoteness" && inYears(d));
  const items = fnStatus.map(status => ({
    key: status,
    label: status,
    values: remoteAreas.map(area => d3.sum(rows.filter(d => d.status === status && d.category === area), d => d.cases))
  }));
  renderStack(r.inner, items, remoteAreas, {
    rowH: r.rowH, labelW: r.labelW, barW: r.barW,
    picked: d => filters.remoteness === d.cat,
    onClick: d => setFilters({ remoteness: toggleFilter("remoteness", d.cat) })
  });
  renderLegend("#remote-legend", remoteAreas);
  setText("#scope-remote", scopeText([]));
};
