// W1: which road users drove the change between the first and last year chosen.
const waterfall = { w: 540, h: 430, m: { top: 28, right: 12, bottom: 62, left: 62 } };
const signed = n => n === 0 ? "0" : d3.format("+,")(n);

const drawWaterfall = () => {
  const w = waterfall;
  w.pw = w.w - w.m.left - w.m.right;
  w.ph = w.h - w.m.top - w.m.bottom;
  w.x = d3.scaleBand().range([0, w.pw]).padding(0.25);
  w.y = d3.scaleLinear().range([w.ph, 0]);
  w.inner = createSvg("#chart-waterfall", w.w, w.h, "Waterfall chart of how each road user changed hospitalisations between the first and last year chosen")
    .append("g").attr("transform", `translate(${w.m.left},${w.m.top})`);
  w.gy = w.inner.append("g").attr("class", "axis");
  w.zero = w.inner.append("line").attr("class", "baseline").attr("x1", 0).attr("x2", w.pw);
  w.labels = w.inner.append("g").attr("transform", `translate(0,${w.ph + 8})`);
};

const updateWaterfall = () => {
  const w = waterfall;
  const [a, b] = filters.years;
  const sums = d3.rollup(filterNational(["roadUser"], false), v => d3.rollup(v, g => d3.sum(g, d => d.cases), d => d.year), d => d.roadUser);
  const at = (user, year) => sums.get(user)?.get(year) || 0;
  const deltas = roadUsers.map(label => ({ label, v: at(label, b) - at(label, a) })).sort((p, q) => q.v - p.v);
  let run = 0;
  const bars = a === b ? [] : [
    ...deltas.map(d => { const from = run; run += d.v; return { ...d, from, to: run, kind: "delta" }; }),
    { label: "Net change", v: run, from: 0, to: run, kind: "net" }
  ];
  const [lo = 0, hi = 1] = d3.extent(bars.flatMap(d => [d.from, d.to, 0]));
  const pad = ((hi - lo) || 1) * 0.12;

  w.x.domain(bars.map(d => d.label));
  w.y.domain([lo - (lo < 0 ? pad : 0), hi + pad]);
  w.gy.call(d3.axisLeft(w.y).ticks(5).tickSize(-w.pw).tickFormat(signed));
  w.zero.attr("y1", w.y(0)).attr("y2", w.y(0));

  // Two-line labels so the longer road user names fit under narrow bars
  w.labels.selectAll("text").data(bars, d => d.label).join("text")
    .attr("class", "wf-label")
    .each(function (d) {
      const cx = w.x(d.label) + w.x.bandwidth() / 2;
      const [first, ...rest] = d.label.split(" ");
      const text = d3.select(this).attr("text-anchor", "middle").text(null);
      text.append("tspan").attr("x", cx).attr("dy", "1em").text(first);
      if (rest.length) text.append("tspan").attr("x", cx).attr("dy", "1.15em").text(rest.join(" "));
    });

  const fill = d => d.kind === "net" ? ink : d.v >= 0 ? coral : "#0d9488";
  w.inner.selectAll(".wf-bar").data(bars, d => d.label).join(enter => enter.append("rect").attr("y", w.ph).attr("height", 0))
    .attr("class", d => d.kind === "net" ? "wf-bar is-net" : "wf-bar")
    .attr("x", d => w.x(d.label)).attr("width", w.x.bandwidth())
    
    .attr("rx", 4).attr("fill", fill)
    .attr("stroke", d => filters.roadUser === d.label ? ink : "none").attr("stroke-width", 3)
    .attr("opacity", d => filters.roadUser && d.kind === "delta" && filters.roadUser !== d.label ? DIM : 1)
    .attr("aria-label", d => `${d.label}: ${signed(d.v)} cases`)
    .each(function (d) { if (d.kind === "delta") d3.select(this).call(onActivate, p => setFilters({ roadUser: toggleFilter("roadUser", p.label) })); })
    .call(bindTooltip, d => `<b>${d.label}</b><br>${signed(d.v)} cases, ${a} to ${b}`)
    .transition().duration(MOTION)
    .attr("y", d => w.y(Math.max(d.from, d.to))).attr("height", d => Math.max(1, Math.abs(w.y(d.from) - w.y(d.to))));

  w.inner.selectAll(".wf-val").data(bars, d => d.label).join("text")
    .attr("class", "wf-val")
    .attr("x", d => w.x(d.label) + w.x.bandwidth() / 2)
    .attr("y", d => d.v >= 0 ? w.y(Math.max(d.from, d.to)) - 7 : w.y(Math.min(d.from, d.to)) + 17)
    .text(d => signed(d.v));

  w.inner.selectAll(".wf-link").data(bars.slice(0, -1), d => d.label).join("line")
    .attr("class", "wf-link")
    .attr("x1", d => w.x(d.label) + w.x.bandwidth())
    .attr("x2", (d, i) => w.x(bars[i + 1].label))
    .attr("y1", d => w.y(d.to)).attr("y2", d => w.y(d.to));

  const total = year => d3.sum(roadUsers, u => at(u, year));
  setText("#waterfall-sub", a === b ? "Choose two or more years on the timeline." : `${formatCount(total(a))} in ${a} to ${formatCount(total(b))} in ${b}`);
  setText("#scope-waterfall", scopeText(["age", "sex", "remoteness"]));
};
