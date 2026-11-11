// G1: map of the states and territories (ABS 2021 boundaries). Colour is share of cases or change over the chosen years.
// Hover or focus a state for a callout. Click to select it: the selected state keeps its callout.
const stateMap = { w: 600, h: 520, pad: 14, mode: "share", hover: null, values: new Map() };
// Too small to label in place, so these labels sit out to sea with a leader line
const mapLabelOffset = { ACT: [78, 22], Vic: [-74, 52], Tas: [72, 18] };

const drawStateMap = () => {
  const s = stateMap;
  const svg = createSvg("#chart-map", s.w, s.h, "Map of Australian states and territories");
  const projection = d3.geoConicEqualArea().parallels([-18, -36]).rotate([-134, 0])
    .fitExtent([[s.pad, s.pad], [s.w - s.pad, s.h - s.pad]], data.geo);
  s.path = d3.geoPath(projection);
  s.features = new Map(data.geo.features.map(f => [f.properties.state, f]));

  const setHover = state => { s.hover = state; renderMapCallout(); };
  const bindState = selection => selection
    .call(onActivate, d => setFilters({ state: toggleFilter("state", d.properties.state) }))
    .on("mouseenter focus", (e, d) => setHover(d.properties.state))
    .on("mouseleave blur", () => setHover(null));

  s.shapes = svg.append("g").selectAll(".state-shape")
    .data(data.geo.features, d => d.properties.state)
    .join("path")
      .attr("class", "state-shape")
      .attr("d", s.path)
      .call(bindState);

  // Outlines for the selected and hovered states sit on their own layer, so the shapes never move under the pointer
  s.pickedOutline = svg.append("path").attr("class", "state-outline is-picked");
  s.hoverOutline = svg.append("path").attr("class", "state-outline is-hover");

  const labels = svg.append("g").attr("class", "map-labels").selectAll("g")
    .data(data.geo.features, d => d.properties.state)
    .join("g");
  labels.each(function (d) {
    const [cx, cy] = s.path.centroid(d);
    const [dx, dy] = mapLabelOffset[d.properties.state] || [0, 0];
    const g = d3.select(this);
    if (dx || dy) {
      g.append("line").attr("class", "map-leader").attr("x1", cx).attr("y1", cy).attr("x2", cx + dx * 0.7).attr("y2", cy + dy * 0.7 - 6);
      // Small states are hard to point at, so their offshore label works as a target too (the shape keeps keyboard focus)
      g.append("rect").attr("class", "label-hit").attr("x", cx + dx - 30).attr("y", cy + dy - 26).attr("width", 60).attr("height", 50)
        .call(bindState).attr("tabindex", -1).attr("aria-hidden", true);
    }
    g.append("text").attr("class", "map-name").attr("x", cx + dx).attr("y", cy + dy - 5).attr("text-anchor", "middle").text(d.properties.state);
    g.append("text").attr("class", "map-value").attr("x", cx + dx).attr("y", cy + dy + 15).attr("text-anchor", "middle");
  });
  s.labels = labels;

  s.callout = svg.append("g").attr("class", "map-callout").attr("opacity", 0);
  s.callout.append("line").attr("class", "map-leader");
  s.callout.append("circle").attr("class", "callout-dot").attr("r", 4.5);
  s.callout.append("rect").attr("class", "callout-box").attr("rx", 12).attr("height", 78);
  ["callout-title", "callout-line", "callout-line"].forEach((cls, i) =>
    s.callout.append("text").attr("class", cls).attr("data-row", i));

  bindToggle("#map-toggle", "mode", mode => { s.mode = mode; updateStateMap(); });
};

// Callout for the hovered state, or the selected one when nothing is hovered
const renderMapCallout = () => {
  const s = stateMap;
  const key = s.hover || filters.state;
  s.hoverOutline.attr("d", s.hover ? s.path(s.features.get(s.hover)) : null);
  s.pickedOutline.attr("d", filters.state ? s.path(s.features.get(filters.state)) : null);
  if (!key || !s.values.has(key)) return s.callout.attr("opacity", 0);

  const value = s.values.get(key);
  const [cx, cy] = s.path.centroid(s.features.get(key));
  const [dx, dy] = mapLabelOffset[key] || [0, 0];
  const lines = [s.features.get(key).properties.name, value.text, value.countText];
  const boxW = d3.max(lines, (t, i) => t.length * (i ? 7.8 : 9.4)) + 28;
  const boxH = 78;
  const toLeft = cx + dx > s.w / 2;
  const boxX = toLeft ? Math.max(4, cx - 36 - boxW) : Math.min(s.w - boxW - 4, cx + 36);
  const boxY = Math.max(4, Math.min(s.h - boxH - 4, cy - boxH / 2 - 30));

  s.callout.attr("opacity", 1);
  s.callout.select("line").attr("x1", cx).attr("y1", cy).attr("x2", toLeft ? boxX + boxW : boxX).attr("y2", boxY + boxH / 2);
  s.callout.select("circle").attr("cx", cx).attr("cy", cy);
  s.callout.select("rect").attr("x", boxX).attr("y", boxY).attr("width", boxW);
  s.callout.selectAll("text").each(function (d, i) {
    d3.select(this).attr("x", boxX + 14).attr("y", boxY + 25 + i * 21).text(lines[i]);
  });
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
  const short = d => !Number.isFinite(d.v) ? (s.mode === "change" && a === b ? "–" : "n.p.") : s.mode === "share" ? formatShare(d.v) : formatPct(d.v);
  const long = d => !Number.isFinite(d.v) ? "Not published" : s.mode === "share" ? `${formatShare(d.v)} of cases` : `${formatPct(d.v)} from ${a} to ${b}`;
  const range = a === b ? `in ${a}` : `${a}–${b}`;
  values.forEach(d => s.values.set(d.state, {
    ...d, text: long(d), countText: Number.isFinite(d.count) ? `${formatCount(d.count)} cases ${range}` : "Some cells not published"
  }));

  const byState = new Map(values.map(d => [d.state, d]));
  s.shapes
    .attr("opacity", d => filters.state && filters.state !== d.properties.state ? 0.45 : 1)
    .attr("aria-label", d => `${d.properties.name}: ${long(byState.get(d.properties.state))}. Click to select.`)
    .transition().duration(MOTION)
    .attr("fill", d => fill(byState.get(d.properties.state)));

  const textFill = d => !mapLabelOffset[d.state] && Number.isFinite(d.v) && d3.lab(color(d.v)).l < 60 ? "#fff" : ink;
  s.labels.each(function (f) {
    const d = byState.get(f.properties.state);
    d3.select(this).selectAll("text").attr("fill", textFill(d));
    d3.select(this).select(".map-value").text(short(d));
  });
  renderMapCallout();

  setText("#scope-map", scopeBadge(scope));
  setText("#map-note", s.mode === "change"
    ? (a === b ? "Choose two or more years to see change." : "Change from the first to the last year chosen. Vic (2012) and NSW (2017) changed how cases are counted.")
    : "Share of the eight jurisdictions' cases. Counts are not rates: bigger states have more people.");
};
