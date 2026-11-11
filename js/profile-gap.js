// P1: how the First Nations and Non-Indigenous profiles differ, as a share of each group's own cases.
const gapChart = { w: 460, labelW: 150, plotW: 236, rowH: 20, headH: 25, top: 46 };
const gapGroups = [["remoteness", "Where cases live"], ["age", "Age"], ["road_user", "Road user"], ["crash_type", "Crash type"]];
const gapLabels = { "Car, pick-up truck or van": "Car, pick-up or van", "Non-collision transport accident": "Non-collision" };
const gapFilter = { remoteness: "remoteness", age: "age", road_user: "roadUser" };

const drawGap = () => {
  const g = gapChart;
  const crashTypes = new Set(data.fn.filter(d => d.dim === "crash_type").map(d => d.category)).size;   // counted from the data, not hard-coded
  g.h = g.top + (remoteAreas.length + ageBands.length + roadUsers.length + crashTypes) * g.rowH + gapGroups.length * g.headH + 8;
  g.x = d3.scaleLinear().range([0, g.plotW]);
  g.inner = createSvg("#chart-gap", g.w, g.h, "Dot plot comparing the profile of First Nations and Non-Indigenous cases").append("g");

  [["First Nations", coral], ["Non-Indigenous", grey]].forEach(([name, colour], i) => {
    const key = g.inner.append("g").attr("transform", `translate(${g.labelW + i * 112},12)`);
    key.append("circle").attr("r", 6).attr("cx", 6).attr("fill", colour);
    key.append("text").attr("class", "gap-text").attr("x", 18).attr("dy", "0.35em").text(name);
  });
  g.axis = g.inner.append("g").attr("class", "axis").attr("transform", `translate(${g.labelW},${g.top - 6})`);
  g.rows = g.inner.append("g").attr("transform", `translate(0,${g.top})`);
};

const updateGap = () => {
  const g = gapChart;
  const rows = data.fn.filter(inYears);
  const shareOf = (dim, status) => {
    const by = d3.rollup(rows.filter(d => d.dim === dim && d.status === status),
      v => d3.sum(v, d => Number.isNaN(d.cases) ? 0 : d.cases), d => d.category);
    const total = d3.sum(by.values());
    return cat => total ? (by.get(cat) || 0) / total : 0;
  };

  const items = [];
  let y = 0;
  gapGroups.forEach(([dim, title]) => {
    const cats = dim === "remoteness" ? remoteAreas
      : categoryOrder[dim] || [...new Set(rows.filter(d => d.dim === dim).map(d => d.category))];
    const fn = shareOf(dim, "First Nations"), ni = shareOf(dim, "Non-Indigenous");
    items.push({ key: `${dim}-head`, y, dim, label: title, head: true });
    y += g.headH;
    cats.forEach(cat => {
      items.push({ key: `${dim}-${cat}`, y, dim, cat, label: gapLabels[cat] || cat, fn: fn(cat), ni: ni(cat) });
      y += g.rowH;
    });
  });

  g.x.domain([0, (d3.max(items.filter(d => !d.head), d => Math.max(d.fn, d.ni)) || 1) * 1.05]);
  g.axis.call(d3.axisTop(g.x).ticks(4).tickFormat(formatShare).tickSize(-(g.h - g.top + 6)));

  const row = g.rows.selectAll(".gap-item").data(items, d => d.key)
    .join(enter => {
      const e = enter.append("g").attr("class", "gap-item");
      e.append("text").attr("class", "gap-text");
      e.append("line").attr("class", "gap-link");
      e.append("circle").attr("class", "gap-ni").attr("r", 6);
      e.append("circle").attr("class", "gap-fn").attr("r", 6);
      e.append("text").attr("class", "gap-delta");
      return e;
    })
    .attr("transform", d => `translate(0,${d.y})`);

  const picked = d => !d.head && filters[gapFilter[d.dim]] === d.cat;
  const cy = g.rowH / 2;
  row.select(".gap-text").attr("x", d => d.head ? 0 : g.labelW - 12).attr("y", d => d.head ? g.headH - 8 : cy)
    .attr("dy", d => d.head ? 0 : "0.35em").attr("text-anchor", d => d.head ? "start" : "end")
    .classed("is-strong", d => d.head || picked(d)).text(d => d.label);
  row.selectAll(".gap-link, .gap-ni, .gap-fn, .gap-delta").attr("display", d => d.head ? "none" : null);
  row.select(".gap-link").transition().duration(MOTION).attr("x1", d => g.labelW + g.x(Math.min(d.fn, d.ni) || 0)).attr("x2", d => g.labelW + g.x(Math.max(d.fn, d.ni) || 0)).attr("y1", cy).attr("y2", cy);
  row.select(".gap-ni").transition().duration(MOTION).attr("cx", d => g.labelW + g.x(d.ni || 0)).attr("cy", cy);
  row.select(".gap-fn").classed("is-picked", picked).transition().duration(MOTION).attr("cx", d => g.labelW + g.x(d.fn || 0)).attr("cy", cy);
  row.select(".gap-delta").attr("x", g.labelW + g.plotW + 10).attr("y", cy).attr("dy", "0.35em")
    .attr("fill", d => d.fn >= d.ni ? "#9a3412" : "#374151")
    .text(d => `${d.fn >= d.ni ? "+" : "−"}${Math.round(Math.abs(d.fn - d.ni) * 100)} pts`);

  const dataRows = row.filter(d => !d.head);
  dataRows.attr("aria-label", d => `${d.label}: First Nations ${formatShare(d.fn)}, Non-Indigenous ${formatShare(d.ni)}`)
    .call(bindTooltip, d => `<b>${d.label}</b><br>First Nations: ${formatShare(d.fn)}<br>Non-Indigenous: ${formatShare(d.ni)}`);
  dataRows.filter(d => gapFilter[d.dim])
    .call(onActivate, d => setFilters({ [gapFilter[d.dim]]: toggleFilter(gapFilter[d.dim], d.cat) }));

  const hasNp = rows.some(d => Number.isNaN(d.cases) && d.dim !== "total");
  setText("#gap-note", `Click a row to filter, except crash type.${hasNp ? " Shares use published cells only." : ""}`);
  setText("#scope-gap", scopeText([]));
};
