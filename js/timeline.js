// T1: hospitalisations per year with a brush that sets the year range for the whole dashboard.
const timeline = { w: 760, h: 430, m: { top: 20, right: 24, bottom: 30, left: 60 } };

const drawTimeline = () => {
  const t = timeline;
  t.pw = t.w - t.m.left - t.m.right;
  t.ph = t.h - t.m.top - t.m.bottom;
  t.x = d3.scaleLinear().domain(FULL_YEARS).range([0, t.pw]);
  t.y = d3.scaleLinear().range([t.ph, 0]);
  t.inner = createSvg("#chart-timeline", t.w, t.h, "Line chart of hospitalisations per year. Drag to choose a range of years.")
    .append("g").attr("transform", `translate(${t.m.left},${t.m.top})`);

  drawSeriesBreaks(t.inner, t.x, t.ph);
  t.gy = t.inner.append("g").attr("class", "axis");
  t.gx = t.inner.append("g").attr("class", "axis").attr("transform", `translate(0,${t.ph})`)
    .call(d3.axisBottom(t.x).ticks(11).tickFormat(d3.format("d")));
  t.inner.append("text").attr("class", "grid-label").attr("x", t.x(2016.6)).attr("y", 12).text("Series break (NSW 2017)");

  t.all = t.inner.append("path").attr("class", "all-line");
  t.line = t.inner.append("path").attr("class", "trend-line");

  // The dots sit under the brush, which stays on top so a drag can start anywhere in the plot
  t.dots = t.inner.append("g").attr("class", "layer");
  t.moveBrush = addYearBrush(t.inner, {
    x: t.x, pw: t.pw, ph: t.ph,
    tip: year => { const r = t.series.find(s => s.year === year); return `<b>${year}</b><br>${formatCount(r.value)} in current view<br>${formatCount(r.all)} all hospitalisations`; },
    onHover: year => t.dots.selectAll(".dot").classed("is-hover", d => d.year === year)
  });
};

const updateTimeline = () => {
  const t = timeline;
  const total = sumBy(data.national, "year");
  const picked = sumBy(filterNational([], false), "year");
  const series = d3.range(FULL_YEARS[0], FULL_YEARS[1] + 1)
    .map(year => ({ year, all: total.get(year) || 0, value: picked.get(year) || 0 }));
  const [a, b] = filters.years;

  t.y.domain([0, d3.max(series, d => d.all) * 1.1]);
  t.gy.call(d3.axisLeft(t.y).ticks(5).tickSize(-t.pw).tickFormat(formatCount));

  const line = key => d3.line().x(d => t.x(d.year)).y(d => t.y(d[key]));
  t.series = series;
  morphPath(t.all, line("all")(series));
  morphPath(t.line, line("value")(series));

  t.dots.selectAll(".dot").data(series, d => d.year)
    .join(enter => enter.append("circle").attr("class", "dot").attr("r", 5).attr("cx", d => t.x(d.year)).attr("cy", t.ph))
      .attr("tabindex", 0)
      .attr("aria-label", d => `${d.year}: ${formatCount(d.value)} hospitalisations`)
      .call(bindFocusTooltip, d => `<b>${d.year}</b><br>${formatCount(d.value)} in current view<br>${formatCount(d.all)} all hospitalisations`)
    .transition().duration(MOTION)
      .attr("cx", d => t.x(d.year)).attr("cy", d => t.y(d.value))
      .attr("fill", d => d.year >= a && d.year <= b ? indigo : "#9ca3af");
  t.moveBrush(a, b);
  setText("#scope-timeline", `${scopeText(["roadUser", "age", "sex", "remoteness"], false)} · drag to choose years`);
};
