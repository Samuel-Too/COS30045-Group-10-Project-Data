// F1: growth of First Nations and Non-Indigenous cases, indexed to 2011 = 100.
const fnChart = { w: 640, h: 300, m: { top: 20, right: 130, bottom: 30, left: 48 } };
const fnStatus = ["First Nations", "Non-Indigenous"];
const fnColors = { "First Nations": coral, "Non-Indigenous": grey };
const fnText = { "First Nations": "#9a3412", "Non-Indigenous": "#374151" };

const drawFn = () => {
  const f = fnChart;
  f.pw = f.w - f.m.left - f.m.right;
  f.ph = f.h - f.m.top - f.m.bottom;
  f.x = d3.scaleLinear().domain(FULL_YEARS).range([0, f.pw]);
  f.y = d3.scaleLinear().range([f.ph, 0]);
  f.inner = createSvg("#chart-fn", f.w, f.h, "Line chart of First Nations and Non-Indigenous hospitalisations indexed to 2011")
    .append("g").attr("transform", `translate(${f.m.left},${f.m.top})`);
  f.band = f.inner.append("rect").attr("class", "range-band").attr("height", f.ph);
  f.gy = f.inner.append("g").attr("class", "axis");
  f.inner.append("g").attr("class", "axis").attr("transform", `translate(0,${f.ph})`)
    .call(d3.axisBottom(f.x).ticks(6).tickFormat(d3.format("d")));
  f.base = f.inner.append("line").attr("class", "baseline").attr("x1", 0).attr("x2", f.pw);
};

const updateFn = () => {
  const f = fnChart;
  const scope = scopeFor({ roadUser: "road_user", age: "age", remoteness: "remoteness" });
  const rows = data.fn.filter(d => d.dim === scope.dim && d.category === scope.category);
  const series = fnStatus.map(status => {
    const points = d3.range(FULL_YEARS[0], FULL_YEARS[1] + 1).map(year => rows.find(d => d.status === status && d.year === year));
    const base = points[0]?.cases;
    return { status, pts: points.map((p, i) => ({
      status, year: FULL_YEARS[0] + i, cases: p?.cases,
      index: base && p && Number.isFinite(p.cases) ? (p.cases / base) * 100 : null
    })) };
  });
  const all = series.flatMap(s => s.pts.map(p => p.index)).filter(v => v !== null);
  const [a, b] = filters.years;

  f.y.domain([Math.min(80, d3.min(all) || 80), Math.max(120, (d3.max(all) || 120) * 1.08)]);
  f.gy.call(d3.axisLeft(f.y).ticks(5).tickSize(-f.pw));
  f.base.attr("y1", f.y(100)).attr("y2", f.y(100));
  f.band.attr("x", f.x(a - 0.4)).attr("width", f.x(Math.min(b + 0.4, FULL_YEARS[1] + 0.4)) - f.x(a - 0.4));

  const line = d3.line().defined(d => d.index !== null).x(d => f.x(d.year)).y(d => f.y(d.index));
  const g = f.inner.selectAll(".fn-series").data(series, d => d.status)
    .join(enter => {
      const s = enter.append("g").attr("class", "fn-series");
      s.append("path").attr("fill", "none").attr("stroke-width", 3);
      s.append("text").attr("class", "series-label");
      return s;
    });
  g.select("path").attr("stroke", d => fnColors[d.status]).attr("d", d => line(d.pts));
  g.select("text").each(function (d) {
    const last = [...d.pts].reverse().find(p => p.index !== null);
    d3.select(this).attr("fill", fnText[d.status]).attr("x", f.pw + 8).attr("y", last ? f.y(last.index) + 4 : 0)
      .text(last ? `${d.status} ${Math.round(last.index)}` : "");
  });
  g.selectAll("circle").data(d => d.pts.filter(p => p.index !== null), d => d.year)
    .join("circle")
      .attr("r", 4)
      .attr("cx", d => f.x(d.year))
      .attr("cy", d => f.y(d.index))
      .attr("fill", d => fnColors[d.status])
      .attr("tabindex", 0)
      .attr("aria-label", d => `${d.status}, ${d.year}: index ${Math.round(d.index)}`)
      .call(bindTooltip, d => `<b>${d.status}</b> · ${d.year}<br>${formatCount(d.cases)} cases<br>Index ${Math.round(d.index)} (2011 = 100)`);

  setText("#scope-fn", scopeBadge(scope));
  setText("#fn-note", all.length ? "" : "Not published for this selection.");
};
