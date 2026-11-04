// T1: hospitalisations per year with a brush that sets the year range for the whole dashboard.
const timeline = { w: 1100, h: 250, m: { top: 20, right: 24, bottom: 30, left: 60 } };

const drawTimeline = () => {
  const t = timeline;
  t.pw = t.w - t.m.left - t.m.right;
  t.ph = t.h - t.m.top - t.m.bottom;
  t.x = d3.scaleLinear().domain(FULL_YEARS).range([0, t.pw]);
  t.y = d3.scaleLinear().range([t.ph, 0]);
  t.inner = createSvg("#chart-timeline", t.w, t.h, "Line chart of hospitalisations per year. Drag to choose a range of years.")
    .append("g").attr("transform", `translate(${t.m.left},${t.m.top})`);

  [[2011, 2011.5], [2016.5, 2021]].forEach(([from, to]) => t.inner.append("rect")
    .attr("class", "series-break").attr("x", t.x(from)).attr("width", t.x(to) - t.x(from)).attr("height", t.ph));
  t.gy = t.inner.append("g").attr("class", "axis");
  t.gx = t.inner.append("g").attr("class", "axis").attr("transform", `translate(0,${t.ph})`)
    .call(d3.axisBottom(t.x).ticks(11).tickFormat(d3.format("d")));
  t.inner.append("text").attr("class", "grid-label").attr("x", t.x(2016.6)).attr("y", 12).text("Series break (NSW 2017)");

  t.all = t.inner.append("path").attr("class", "all-line");
  t.line = t.inner.append("path").attr("class", "trend-line");

  t.brush = d3.brushX().extent([[0, 0], [t.pw, t.ph]]).on("end", e => {
    if (!e.sourceEvent) return;
    if (!e.selection) return setFilters({ years: [...FULL_YEARS] });
    const [a, b] = e.selection.map(t.x.invert).map(Math.round);
    setFilters({ years: [Math.max(a, FULL_YEARS[0]), Math.min(b, FULL_YEARS[1])] });
  });
  t.brushG = t.inner.append("g").attr("class", "brush").call(t.brush);
};

const updateTimeline = () => {
  const t = timeline;
  const total = sumBy(data.national, "year");
  const picked = sumBy(filterNational([], false), "year");
  const series = d3.range(FULL_YEARS[0], FULL_YEARS[1] + 1)
    .map(year => ({ year, all: total.get(year) || 0, value: picked.get(year) || 0 }));
  const [a, b] = filters.years;
  const isFull = a === FULL_YEARS[0] && b === FULL_YEARS[1];

  t.y.domain([0, d3.max(series, d => d.all) * 1.1]);
  t.gy.call(d3.axisLeft(t.y).ticks(5).tickSize(-t.pw).tickFormat(formatCount));

  const line = key => d3.line().x(d => t.x(d.year)).y(d => t.y(d[key]));
  t.all.datum(series).attr("d", line("all"));
  t.line.datum(series).attr("d", line("value"));

  t.inner.selectAll(".dot").data(series, d => d.year)
    .join("circle")
      .attr("class", "dot")
      .attr("r", 5)
      .attr("cx", d => t.x(d.year))
      .attr("cy", d => t.y(d.value))
      .attr("fill", d => d.year >= a && d.year <= b ? indigo : "#9ca3af")
      .attr("tabindex", 0)
      .attr("aria-label", d => `${d.year}: ${formatCount(d.value)} hospitalisations`)
      .call(bindTooltip, d => `<b>${d.year}</b><br>${formatCount(d.value)} in current view<br>${formatCount(d.all)} all hospitalisations`);

  t.brushG.call(t.brush.move, isFull ? null : [Math.max(0, t.x(a - 0.4)), Math.min(t.pw, t.x(b + 0.4))]);
  setText("#scope-timeline", `${scopeText(["roadUser", "age", "sex", "remoteness"], false)} · drag to choose years`);
};
