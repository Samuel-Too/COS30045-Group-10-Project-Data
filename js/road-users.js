// R1: road user ranking with a sparkline per row. Clicking a row sets the road user filter.
const users = { w: 760, h: 560, rowH: 110, barH: 40, barX: 120, barW: 330, sparkX: 600, sparkW: 150 };

const drawUsers = () => {
  const u = users;
  u.inner = createSvg("#chart-users", u.w, u.h, "Hospitalisations by road user with a trend sparkline for each")
    .append("g").attr("transform", "translate(0,6)");
  u.x = d3.scaleLinear().range([0, u.barW]);

  const rows = u.inner.selectAll(".ru-row").data(roadUsers).join("g")
    .attr("class", "ru-row")
    .attr("transform", (d, i) => `translate(0,${i * u.rowH})`)
    .call(onActivate, d => setFilters({ roadUser: toggleFilter("roadUser", d) }));
  const mid = u.rowH / 2;
  rows.append("text").attr("class", "cat-label").attr("y", mid).attr("dy", "0.35em").text(d => d);
  rows.append("rect").attr("class", "bar").attr("x", u.barX).attr("y", mid - u.barH / 2).attr("height", u.barH).attr("rx", 10);
  rows.append("text").attr("class", "value-label").attr("y", mid).attr("dy", "0.35em");
  rows.append("text").attr("class", "change-label").attr("x", u.barX).attr("y", mid + u.barH / 2 + 22);
  rows.append("path").attr("class", "spark");
};

const updateUsers = () => {
  const u = users;
  const now = sumBy(filterNational(["roadUser"]), "roadUser");
  const total = d3.sum(now.values());
  const history = d3.group(filterNational(["roadUser"], false), d => d.roadUser, d => d.year);
  const years = d3.range(FULL_YEARS[0], FULL_YEARS[1] + 1);
  const sx = d3.scaleLinear().domain(FULL_YEARS).range([u.sparkX, u.sparkX + u.sparkW]);
  u.x.domain([0, d3.max(now.values()) || 1]);

  const rows = u.inner.selectAll(".ru-row");
  rows.each(function (d) {
    const row = d3.select(this);
    const value = now.get(d) || 0;
    const picked = filters.roadUser;
    const series = years.map(year => ({ year, v: d3.sum(history.get(d)?.get(year) || [], r => r.cases) }));
    const sy = d3.scaleLinear().domain([0, d3.max(series, s => s.v) || 1]).range([u.rowH / 2 + 30, u.rowH / 2 - 30]);
    const width = Math.max(2, u.x(value));

    row.attr("opacity", picked && picked !== d ? DIM : 1)
      .attr("aria-label", `${d}: ${formatCount(value)} cases, ${formatShare(total ? value / total : 0)}. Click to filter.`);
    row.select(".bar").transition().duration(MOTION).attr("width", width).attr("fill", picked === d ? indigo : ink);
    row.select(".value-label").attr("x", u.barX + width + 8).text(`${formatCount(value)} · ${formatShare(total ? value / total : 0)}`);
    const [a, b] = filters.years;
    const first = series.find(s => s.year === a)?.v, last = series.find(s => s.year === b)?.v;
    row.select(".change-label").text(a !== b && first ? `${formatPct(last / first - 1)} from ${a} to ${b}` : "");
    row.select(".spark").attr("stroke", picked === d ? indigo : grey)
      .each(function () { morphPath(d3.select(this), d3.line().x(s => sx(s.year)).y(s => sy(s.v))(series)); });
  });
  rows.call(bindTooltip, d => `<b>${d}</b><br>${formatCount(now.get(d) || 0)} cases in view<br>Sparkline: 2011–2021 trend`);
  setText("#scope-users", scopeText(["age", "sex", "remoteness"]));
};
