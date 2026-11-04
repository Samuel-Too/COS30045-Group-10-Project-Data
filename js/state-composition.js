// G2: what makes up each state's cases (road user, age, sex or crash type). Years filter applies.
const comp = { w: 700, rowH: 38, labelW: 52, barW: 640, dim: "road_user" };

const drawComp = () => {
  const c = comp;
  c.inner = createSvg("#chart-comp", c.w, stateOrder.length * c.rowH + 6, "Stacked bars of the mix of cases in each state")
    .append("g").attr("transform", "translate(0,4)");
  bindToggle("#comp-tabs", "dim", dim => { c.dim = dim; updateComp(); });
};

const updateComp = () => {
  const c = comp;
  const rows = data.states.filter(d => d.dim === c.dim && inYears(d));
  const cats = categoryOrder[c.dim] || [...new Set(rows.map(d => d.category))];
  const items = stateOrder.map(state => ({
    key: state,
    label: state,
    values: cats.map(cat => d3.sum(rows.filter(d => d.state === state && d.category === cat), d => Number.isNaN(d.cases) ? 0 : d.cases))
  }));
  const pickedCategory = { road_user: filters.roadUser, age: filters.age }[c.dim];

  renderStack(c.inner, items, cats, {
    rowH: c.rowH, labelW: c.labelW, barW: c.barW,
    dim: d => filters.state && filters.state !== d.key,
    picked: d => pickedCategory === d.cat,
    onClick: d => setFilters({ state: toggleFilter("state", d.key) })
  });
  renderLegend("#comp-legend", cats);
  setText("#comp-note", rows.some(d => Number.isNaN(d.cases)) ? "Some small cells are not published (n.p.), so shares use published cells only." : "");
  setText("#scope-comp", "Showing: years only (the tab chooses the mix)");
};
