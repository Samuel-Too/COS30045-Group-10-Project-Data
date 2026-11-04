// H1: road user by age band. Cells show each road user's age profile; clicking a cell sets both filters.
const heat = { w: 640, h: 290, m: { top: 34, left: 112 }, rowH: 46, mode: "share" };

const drawHeat = () => {
  const h = heat;
  h.cellW = (h.w - h.m.left) / ageBands.length;
  h.inner = createSvg("#chart-heat", h.w, h.h, "Heatmap of hospitalisations by road user and age group")
    .append("g").attr("transform", `translate(${h.m.left},${h.m.top})`);
  h.inner.selectAll(".age-label").data(ageBands).join("text").attr("class", "cat-label")
    .attr("x", (d, i) => (i + 0.5) * h.cellW).attr("y", -12).attr("text-anchor", "middle").text(d => d);
  h.inner.selectAll(".ru-label").data(roadUsers).join("text").attr("class", "cat-label")
    .attr("x", -12).attr("y", (d, i) => (i + 0.5) * h.rowH).attr("dy", "0.35em").attr("text-anchor", "end").text(d => d);
  bindToggle("#heat-toggle", "mode", mode => { h.mode = mode; updateHeat(); });
};

const selectCell = d => {
  const same = filters.roadUser === d.ru && filters.age === d.age;
  setFilters({ roadUser: same ? null : d.ru, age: same ? null : d.age });
};

const updateHeat = () => {
  const h = heat;
  const sums = d3.rollup(filterNational(["roadUser", "age"]), v => d3.sum(v, d => d.cases), d => d.roadUser, d => d.age);
  const cells = roadUsers.flatMap((ru, r) => {
    const rowTotal = d3.sum(ageBands, a => sums.get(ru)?.get(a) || 0);
    return ageBands.map((age, c) => {
      const v = sums.get(ru)?.get(age) || 0;
      return { ru, age, r, c, v, share: rowTotal ? v / rowTotal : 0 };
    });
  });
  const key = h.mode === "share" ? "share" : "v";
  const color = d3.scaleSequential(d3.interpolateRgb("#eef0ff", indigo)).domain([0, d3.max(cells, d => d[key]) || 1]);

  const cell = h.inner.selectAll(".cell").data(cells, d => d.ru + d.age)
    .join(enter => {
      const g = enter.append("g").attr("class", "cell").call(onActivate, selectCell);
      g.append("rect").attr("rx", 6);
      g.append("text").attr("text-anchor", "middle").attr("dy", "0.35em");
      return g;
    })
    .attr("transform", d => `translate(${d.c * h.cellW},${d.r * h.rowH})`)
    .attr("aria-label", d => `${d.ru}, ages ${d.age}: ${formatCount(d.v)} cases, ${formatShare(d.share)} of this road user. Click to filter.`);

  cell.select("rect").attr("width", h.cellW - 3).attr("height", h.rowH - 3).attr("fill", d => color(d[key]))
    .attr("stroke", d => filters.roadUser === d.ru && filters.age === d.age ? ink : "none").attr("stroke-width", 3);
  cell.select("text").attr("x", (h.cellW - 3) / 2).attr("y", (h.rowH - 3) / 2)
    .attr("fill", d => d3.lab(color(d[key])).l < 60 ? "#fff" : ink)
    .text(d => h.mode === "share" ? formatShare(d.share) : formatCount(d.v));
  cell.call(bindTooltip, d => `<b>${d.ru}</b> · ages ${d.age}<br>${formatCount(d.v)} cases<br>${formatShare(d.share)} of this road user's cases`);
  setText("#scope-heat", scopeText(["sex", "remoteness"]));
};
