// S1: do the groups with the most cases also have the longest stays? One dot per road user and age band.
const severity = { w: 600, h: 262, m: { top: 38, right: 16, bottom: 44, left: 52 }, minCases: 20 };

const drawSeverity = () => {
  const s = severity;
  s.pw = s.w - s.m.left - s.m.right;
  s.ph = s.h - s.m.top - s.m.bottom;
  s.x = d3.scaleLog().range([0, s.pw]);
  s.y = d3.scaleLinear().range([s.ph, 0]);
  s.inner = createSvg("#chart-severity", s.w, s.h, "Scatter plot of hospitalisations against average stay for each road user and age group")
    .append("g").attr("transform", `translate(${s.m.left},${s.m.top})`);
  s.gy = s.inner.append("g").attr("class", "axis");
  s.gx = s.inner.append("g").attr("class", "axis").attr("transform", `translate(0,${s.ph})`);
  s.inner.append("text").attr("class", "axis-label").attr("x", s.pw).attr("y", s.ph + 38).attr("text-anchor", "end").text("Hospitalisations (log scale)");
  s.inner.append("text").attr("class", "axis-label").attr("x", 0).attr("y", -8).attr("text-anchor", "start").text("Average stay (bed days per case)");

  // The legend lives inside the SVG so the card does not need an extra row
  const legend = s.inner.append("g").attr("transform", "translate(0,-30)");
  roadUsers.forEach((user, i) => {
    const item = legend.append("g").attr("transform", `translate(${i * 108},0)`);
    item.append("circle").attr("r", 5).attr("cx", 5).attr("fill", palette[i]);
    item.append("text").attr("class", "sev-legend").attr("x", 15).attr("dy", "0.35em").text(user);
  });
};

const updateSeverity = () => {
  const s = severity;
  const from = Math.max(filters.years[0], 2016);
  const rows = filterNational(["roadUser", "age"]).filter(d => d.year >= from);
  const sums = d3.rollup(rows, v => ({ cases: d3.sum(v, d => d.cases), bed: d3.sum(v, d => d.bedDays) }), d => d.roadUser, d => d.age);
  const points = roadUsers.flatMap(ru => ageBands.map(age => {
    const t = sums.get(ru)?.get(age);
    return t && t.cases >= s.minCases ? { ru, age, cases: t.cases, stay: t.bed / t.cases } : null;
  })).filter(Boolean);

  s.x.domain(points.length ? d3.extent(points, d => d.cases) : [10, 1000]).nice();
  s.y.domain([0, (d3.max(points, d => d.stay) || 10) * 1.1]);
  s.gx.call(d3.axisBottom(s.x).ticks(5, "~s"));
  s.gy.call(d3.axisLeft(s.y).ticks(4).tickSize(-s.pw));

  const picked = filters.roadUser;
  const isPicked = d => filters.roadUser === d.ru && filters.age === d.age;
  s.inner.selectAll(".sev-dot").data(points, d => d.ru + d.age).join(enter => enter.append("circle").attr("r", 0).attr("cx", d => s.x(d.cases)).attr("cy", d => s.y(d.stay)))
    .attr("class", "sev-dot")
    .attr("fill", d => palette[roadUsers.indexOf(d.ru)])
    .attr("opacity", d => picked && picked !== d.ru ? DIM : 0.85)
    .classed("is-picked", isPicked)
    .attr("aria-label", d => `${d.ru}, ages ${d.age}: ${formatCount(d.cases)} cases, ${d.stay.toFixed(1)} bed days per case. Click to filter.`)
    .call(onActivate, selectCell)
    .call(bindTooltip, d => `<b>${d.ru}</b> · ages ${d.age}<br>${formatCount(d.cases)} cases<br>${d.stay.toFixed(1)} bed days per case`)
    .transition().duration(MOTION)
    .attr("r", 7).attr("cx", d => s.x(d.cases)).attr("cy", d => s.y(d.stay));

  setText("#severity-note", filters.years[1] < 2016
    ? "Choose a range that reaches 2016 or later: bed days are counted differently before 2016."
    : `Uses ${from} onward (bed days were counted differently before 2016). Groups under ${s.minCases} cases are left out.`);
  setText("#scope-severity", scopeText(["sex", "remoteness"]));
};
