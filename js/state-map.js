// G1: tile-grid map (equal-sized tiles, no boundary data). Colour is share of cases or change over the chosen years.
const stateMap = { size: 84, gap: 6, mode: "share" };

const drawStateMap = () => {
  const s = stateMap;
  const step = s.size + s.gap;
  s.inner = createSvg("#chart-map", step * 4, step * 4, "Tile map of Australian states and territories").append("g");
  const tiles = s.inner.selectAll(".tile").data(stateOrder.map(state => ({ state }))).join("g")
    .attr("class", "tile")
    .attr("transform", d => `translate(${tileGrid[d.state][0] * step},${tileGrid[d.state][1] * step})`)
    .call(onActivate, d => setFilters({ state: toggleFilter("state", d.state) }));
  tiles.append("rect").attr("width", s.size).attr("height", s.size).attr("rx", 14);
  tiles.append("text").attr("class", "tile-name").attr("x", s.size / 2).attr("y", s.size / 2 - 6).attr("text-anchor", "middle").text(d => d.state);
  tiles.append("text").attr("class", "tile-value").attr("x", s.size / 2).attr("y", s.size / 2 + 16).attr("text-anchor", "middle");
  bindToggle("#map-toggle", "mode", mode => { s.mode = mode; updateStateMap(); });
};

const updateStateMap = () => {
  const s = stateMap;
  const [a, b] = filters.years;
  const scope = scopeFor({ roadUser: "road_user", age: "age" });
  const rows = data.states.filter(d => d.dim === scope.dim && d.category === scope.category);
  const sums = d3.rollup(rows.filter(inYears), v => v.some(d => Number.isNaN(d.cases)) ? NaN : d3.sum(v, d => d.cases), d => d.state);
  const at = (state, year) => rows.find(d => d.state === state && d.year === year)?.cases;
  const total = d3.sum([...sums.values()].filter(Number.isFinite));

  const values = stateOrder.map(state => {
    const v = s.mode === "share" ? sums.get(state) / total : (a === b ? NaN : at(state, b) / at(state, a) - 1);
    return { state, v, count: sums.get(state) };
  });
  const finite = values.map(d => d.v).filter(Number.isFinite);
  const color = s.mode === "share"
    ? d3.scaleSequential(d3.interpolateRgb("#eef0ff", indigo)).domain([0, d3.max(finite) || 1])
    : d3.scaleDiverging(d3.interpolateRgbBasis(["#0d9488", "#f3f4f6", coral])).domain([-0.6, 0, 0.6]).clamp(true);
  const fill = d => Number.isFinite(d.v) ? color(d.v) : "#f3f4f6";
  const text = d => !Number.isFinite(d.v) ? (s.mode === "change" && a === b ? "–" : "n.p.") : s.mode === "share" ? formatShare(d.v) : formatPct(d.v);

  const tiles = s.inner.selectAll(".tile").data(values, d => d.state);
  tiles.attr("opacity", d => filters.state && filters.state !== d.state ? 0.5 : 1)
    .attr("aria-label", d => `${d.state}: ${text(d)}. Click to select.`);
  tiles.select("rect").attr("fill", fill).attr("stroke", d => filters.state === d.state ? ink : "none").attr("stroke-width", 3);
  const textFill = d => Number.isFinite(d.v) && d3.lab(color(d.v)).l < 60 ? "#fff" : ink;
  tiles.select(".tile-name").attr("fill", textFill);
  tiles.select(".tile-value").attr("fill", textFill).text(text);
  tiles.call(bindTooltip, d => `<b>${d.state}</b><br>${Number.isFinite(d.count) ? formatCount(d.count) + " cases in range" : "Some cells not published"}<br>${text(d)}`);

  setText("#scope-map", scopeBadge(scope));
  setText("#map-note", s.mode === "change"
    ? (a === b ? "Choose two or more years to see change." : "Change from the first to the last year chosen. Vic (2012) and NSW (2017) changed how cases are counted.")
    : "Share of the eight jurisdictions' cases. Counts are not rates: bigger states have more people.");
};
