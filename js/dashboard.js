// RoadWatch dashboard: loads the BITRE CSVs and draws every chart with D3.
const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 650;
const baseYear = 2011;

const formatCount = d3.format(",");
const formatShort = d => d >= 10000 ? `${d3.format(".1f")(d / 1000)}k` : formatCount(d);
const formatPct = d3.format("+.1%");
const formatShare = d3.format(".1%");

const userOrder = ["Car occupant", "Motorcyclist", "Pedal cyclist", "Pedestrian", "Other"];
const userLabels = {
  "Car occupant": "Occupant",
  "Motorcyclist": "Motorcycle",
  "Pedal cyclist": "Cyclist",
  "Pedestrian": "Pedestrian",
  "Other": "Other"
};
const userColors = {
  "Car occupant": "#111827",
  "Motorcyclist": "#e1e2e4",
  "Pedal cyclist": "#4648d4",
  "Pedestrian": "#e1e2e4",
  "Other": "#eef0f2"
};
const gaugeColors = ["#ea580c", "#370e00", "#4648d4", "#c6c6cd"];

const stateNames = {
  ACT: "Australian Capital Territory", NSW: "New South Wales", NT: "Northern Territory",
  Qld: "Queensland", SA: "South Australia", Tas: "Tasmania", Vic: "Victoria", WA: "Western Australia"
};

const view = { year: 2021, metric: "count" };
let data;

// ---------- Tooltip ----------
const tooltip = d3.select("#tooltip");

const showTooltip = (x, y, html) => {
  tooltip.html(html).attr("hidden", null);
  const boxWidth = tooltip.node().offsetWidth;
  const left = x + 14 + boxWidth > document.documentElement.clientWidth - 8 ? x - boxWidth - 14 : x + 14;
  tooltip.style("left", `${left}px`).style("top", `${y + 14}px`);
};

const showTooltipAtElement = (element, html) => {
  const box = element.getBoundingClientRect();
  showTooltip(box.left + window.scrollX + box.width / 2, box.top + window.scrollY, html);
};

const hideTooltip = () => tooltip.attr("hidden", true);

const bindTooltip = (selection, html) => selection
  .on("mousemove", (e, d) => showTooltip(e.pageX, e.pageY, html(d)))
  .on("focus", (e, d) => showTooltipAtElement(e.currentTarget, html(d)))
  .on("mouseleave blur", hideTooltip);

// ---------- Helpers ----------
const createSvg = (selector, width, height, label) => d3.select(selector)
  .append("svg")
  .attr("viewBox", `0 0 ${width} ${height}`)
  .attr("role", "img")
  .attr("aria-label", label);

// Bar path with rounded top corners only
const topRoundedBar = (x, y, w, h, r) => {
  r = Math.max(0, Math.min(r, h, w / 2));
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
};

const change = (current, previous) => previous ? (current - previous) / previous : null;

const national = year => data.national.find(d => d.year === year);
const usersFor = year => userOrder.map(group => data.users.find(d => d.year === year && d.group === group));
const statesFor = year => data.states.filter(d => d.year === year);

// ---------- KPIs ----------
const updateKpis = () => {
  const { year } = view;
  const row = national(year);
  const prev = national(year - 1);
  const first = national(baseYear);
  const ranked = data.national.slice().sort((a, b) => b.hospitalisations - a.hospitalisations);
  const peak = ranked[0];

  d3.selectAll("#hero-year, #record-year, #surv-year-pill").text(year);
  d3.select("#kpi-total").text(formatCount(row.hospitalisations));
  d3.select("#kpi-since").text(year === baseYear ? "Baseline year" : `${formatPct(change(row.hospitalisations, first.hospitalisations))} since ${baseYear}`);
  d3.select("#kpi-yoy").text(prev ? `${formatPct(change(row.hospitalisations, prev.hospitalisations))} vs ${year - 1}` : "No prior year");
  d3.select("#kpi-beddays").text(`${formatCount(row.bedDays)} days`);
  d3.select("#kpi-alos").text(`${d3.format(".1f")(row.bedDays / row.hospitalisations)} days`);
  d3.select("#kpi-died").text(row.diedCases > 0 ? `${formatCount(row.diedCases)} cases` : "Not yet reported");
  d3.select("#kpi-peak").text(`${peak.year} · ${formatCount(peak.hospitalisations)}`);
  d3.select("#kpi-rank").text(`#${ranked.indexOf(row) + 1} highest`);

  const trendChange = change(row.hospitalisations, prev && prev.hospitalisations);
  d3.select("#trend-kpi").text(formatCount(row.hospitalisations));
  d3.select("#trend-badge")
    .attr("class", `badge ${trendChange === null ? "" : trendChange >= 0 ? "up" : "down"}`)
    .text(trendChange === null ? "Baseline year" : `${trendChange >= 0 ? "↗" : "↘"} ${formatPct(trendChange)} vs ${year - 1}`);

  const users = usersFor(year);
  const top = users.slice().sort((a, b) => b.hospitalisations - a.hospitalisations)[0];
  const usersTotal = d3.sum(users, d => d.hospitalisations);
  d3.select("#users-kpi").text(formatShort(top.hospitalisations));
  d3.select("#users-kpi-note").text(`${userLabels[top.group]}s (${formatShare(top.hospitalisations / usersTotal)})`);

  const cyclist = users.find(d => d.group === "Pedal cyclist");
  const cyclistFirst = data.users.find(d => d.year === baseYear && d.group === "Pedal cyclist");
  d3.select("#cyc-kpi").text(formatCount(cyclist.hospitalisations));
  d3.select("#cyc-note").text(year === baseYear
    ? "↑ Baseline year for the 2011–2021 series"
    : `${cyclist.hospitalisations >= cyclistFirst.hospitalisations ? "↑" : "↓"} ${formatPct(change(cyclist.hospitalisations, cyclistFirst.hospitalisations))} since ${baseYear}, the fastest rise of any road user`);
};

// ---------- Road user bars ----------
const users = { width: 620, height: 290, margin: { top: 44, right: 0, bottom: 40, left: 0 } };

const drawUsers = () => {
  const svg = createSvg("#chart-users", users.width, users.height, "Bar chart of hospitalisations by road user");
  users.inner = svg.append("g").attr("transform", `translate(${users.margin.left},${users.margin.top})`);
  users.plotHeight = users.height - users.margin.top - users.margin.bottom;
  users.x = d3.scaleBand().domain(userOrder).range([0, users.width]).paddingInner(0.12);
  users.y = d3.scaleLinear().range([users.plotHeight, 0]);

  const groups = users.inner.selectAll(".user")
    .data(userOrder)
    .join("g")
      .attr("class", "user");

  groups.append("path")
    .attr("class", "bar")
    .attr("tabindex", 0)
    .attr("fill", d => userColors[d])
    .attr("d", d => topRoundedBar(users.x(d), users.plotHeight, users.x.bandwidth(), 0, 18));

  groups.append("text")
    .attr("class", "value-label")
    .attr("text-anchor", "middle")
    .attr("x", d => users.x(d) + users.x.bandwidth() / 2)
    .attr("y", users.plotHeight - 10);

  groups.append("text")
    .attr("class", "cat-label")
    .attr("text-anchor", "middle")
    .attr("x", d => users.x(d) + users.x.bandwidth() / 2)
    .attr("y", users.plotHeight + 28)
    .text(d => userLabels[d]);

  // Year-on-year change badge on the cyclist bar
  users.badge = users.inner.append("g").attr("class", "badge-group");
  users.badge.append("rect").attr("height", 26).attr("rx", 13).attr("fill", "#4648d4").attr("stroke", "#fff").attr("stroke-width", 2.5);
  users.badge.append("text").attr("fill", "#fff").attr("text-anchor", "middle").attr("y", 17.5)
    .style("font", "700 12px Inter, sans-serif");
};

const updateUsers = () => {
  const rows = usersFor(view.year);
  const prevRows = view.year > baseYear ? usersFor(view.year - 1) : null;
  const maxAll = d3.max(data.users, d => d.hospitalisations);
  users.y.domain([0, maxAll]);

  users.inner.selectAll(".bar")
    .data(rows)
    .attr("aria-label", d => `${d.group}, ${view.year}: ${formatCount(d.hospitalisations)} hospitalisations`)
    .call(bindTooltip, d => {
      const prev = prevRows && prevRows.find(p => p.group === d.group);
      const delta = prev ? `<br>${formatPct(change(d.hospitalisations, prev.hospitalisations))} vs ${view.year - 1}` : "";
      return `<b>${d.group}</b> · ${view.year}<br>${formatCount(d.hospitalisations)} hospitalisations${delta}`;
    })
    .transition()
    .duration(duration)
    .ease(d3.easeCubicInOut)
    .attrTween("d", function (d) {
      const from = this.__height || 0;
      const to = users.plotHeight - users.y(d.hospitalisations);
      this.__height = to;
      const interpolate = d3.interpolate(from, to);
      return t => {
        const h = interpolate(t);
        return topRoundedBar(users.x(d.group), users.plotHeight - h, users.x.bandwidth(), h, 18);
      };
    });

  users.inner.selectAll(".value-label")
    .data(rows)
    .transition()
    .duration(duration)
    .ease(d3.easeCubicInOut)
    .attr("y", d => users.y(d.hospitalisations) - 12)
    .text(d => formatCount(d.hospitalisations));

  const cyclist = rows.find(d => d.group === "Pedal cyclist");
  const prevCyclist = prevRows && prevRows.find(d => d.group === "Pedal cyclist");
  const delta = change(cyclist.hospitalisations, prevCyclist && prevCyclist.hospitalisations);
  const badgeWidth = 66;
  users.badge
    .attr("opacity", delta === null ? 0 : 1)
    .transition()
    .duration(duration)
    .ease(d3.easeCubicInOut)
    .attr("transform", `translate(${users.x("Pedal cyclist") + users.x.bandwidth() / 2 - badgeWidth / 2},${users.y(cyclist.hospitalisations) - 64})`);
  users.badge.select("rect").attr("width", badgeWidth);
  users.badge.select("text").attr("x", badgeWidth / 2).text(delta === null ? "" : formatPct(delta));
};

// ---------- Jurisdiction share gauge ----------
const gauge = { width: 320, height: 200, outerRadius: 140, innerRadius: 116 };

const drawGauge = () => {
  const svg = createSvg("#chart-gauge", gauge.width, gauge.height, "Half-donut of the share of hospitalisations by jurisdiction");
  gauge.inner = svg.append("g").attr("transform", `translate(${gauge.width / 2},${gauge.height - 26})`);
  gauge.arc = d3.arc().innerRadius(gauge.innerRadius).outerRadius(gauge.outerRadius).cornerRadius(12);
  gauge.pie = d3.pie().sort(null).value(d => d.count)
    .startAngle(-Math.PI / 2).endAngle(Math.PI / 2).padAngle(0.035);

  gauge.inner.append("path")
    .attr("fill", "#f3f4f6")
    .attr("d", d3.arc().innerRadius(gauge.innerRadius - 6).outerRadius(gauge.outerRadius + 6)
      .startAngle(-Math.PI / 2).endAngle(Math.PI / 2).cornerRadius(18)());

  gauge.value = gauge.inner.append("text")
    .attr("text-anchor", "middle").attr("y", -34)
    .style("font", "800 38px 'Plus Jakarta Sans', sans-serif").style("letter-spacing", "-0.04em")
    .attr("fill", "#111827");
  gauge.caption = gauge.inner.append("text")
    .attr("text-anchor", "middle").attr("y", -6)
    .style("font", "500 13px Inter, sans-serif").attr("fill", "#45464c");
};

const gaugeSegments = () => {
  const states = statesFor(view.year).sort((a, b) => b.count - a.count);
  const top = states.slice(0, 3).map(d => ({ key: d.state, label: d.state, count: d.count }));
  const restCount = d3.sum(states.slice(3), d => d.count);
  return [...top, { key: "rest", label: "Other states", count: restCount }];
};

const updateGauge = () => {
  const segments = gaugeSegments();
  const total = d3.sum(segments, d => d.count);
  const topThree = d3.sum(segments.slice(0, 3), d => d.count);
  const arcs = gauge.pie(segments);

  gauge.inner.selectAll(".segment")
    .data(arcs, (d, i) => i)
    .join("path")
      .attr("class", "segment bar")
      .attr("tabindex", 0)
      .attr("fill", (d, i) => gaugeColors[i])
      .attr("aria-label", d => `${d.data.label}: ${formatCount(d.data.count)} (${formatShare(d.data.count / total)})`)
      .call(bindTooltip, d => `<b>${stateNames[d.data.label] || d.data.label}</b><br>${formatCount(d.data.count)} cases · ${formatShare(d.data.count / total)}`)
      .transition()
      .duration(duration)
      .ease(d3.easeCubicInOut)
      .attrTween("d", function (d) {
        const from = this.__arc || { startAngle: -Math.PI / 2, endAngle: -Math.PI / 2, padAngle: d.padAngle };
        const interpolate = d3.interpolate(from, d);
        this.__arc = d;
        return t => gauge.arc(interpolate(t));
      });

  gauge.value.text(formatCount(topThree));
  gauge.caption.text(`${formatShare(topThree / total)} from ${segments.slice(0, 3).map(d => d.label).join(", ")}`);

  d3.select("#gauge-legend")
    .selectAll("li")
    .data(segments)
    .join("li")
      .html((d, i) => `<i style="background:${gaugeColors[i]}"></i>${d.label} (${formatShare(d.count / total)})`);
};

// ---------- Annual trend ----------
const trend = { width: 560, height: 230, margin: { top: 46, right: 20, bottom: 34, left: 20 } };

const drawTrend = () => {
  const svg = createSvg("#chart-trend", trend.width, trend.height, "Line chart of national hospitalisations, 2011 to 2021");
  const plotWidth = trend.width - trend.margin.left - trend.margin.right;
  const plotHeight = trend.height - trend.margin.top - trend.margin.bottom;
  const inner = svg.append("g").attr("transform", `translate(${trend.margin.left},${trend.margin.top})`);
  const rows = data.national;

  trend.x = d3.scaleLinear().domain(d3.extent(rows, d => d.year)).range([0, plotWidth]);
  trend.y = d3.scaleLinear().domain([32000, 41000]).range([plotHeight, 0]);
  trend.inner = inner;
  trend.plotHeight = plotHeight;

  const defs = svg.append("defs");
  const gradient = defs.append("linearGradient").attr("id", "trend-fill").attr("x1", 0).attr("x2", 0).attr("y1", 0).attr("y2", 1);
  gradient.append("stop").attr("offset", "0%").attr("stop-color", "#4648d4").attr("stop-opacity", 0.18);
  gradient.append("stop").attr("offset", "100%").attr("stop-color", "#4648d4").attr("stop-opacity", 0);

  [34000, 37000, 40000].forEach(value => {
    inner.append("line").attr("class", "grid-line")
      .attr("x1", 0).attr("x2", plotWidth).attr("y1", trend.y(value)).attr("y2", trend.y(value));
    inner.append("text").attr("class", "grid-label")
      .attr("x", plotWidth).attr("y", trend.y(value) - 5).attr("text-anchor", "end")
      .text(formatShort(value));
  });

  inner.append("path")
    .datum(rows)
    .attr("fill", "url(#trend-fill)")
    .attr("d", d3.area().curve(d3.curveMonotoneX)
      .x(d => trend.x(d.year)).y0(plotHeight).y1(d => trend.y(d.hospitalisations)));

  const line = inner.append("path")
    .datum(rows)
    .attr("fill", "none")
    .attr("stroke", "#4648d4")
    .attr("stroke-width", 3.5)
    .attr("stroke-linecap", "round")
    .attr("d", d3.line().curve(d3.curveMonotoneX).x(d => trend.x(d.year)).y(d => trend.y(d.hospitalisations)));

  const length = line.node().getTotalLength();
  line.attr("stroke-dasharray", `${length} ${length}`).attr("stroke-dashoffset", length)
    .transition().duration(duration * 2).ease(d3.easeCubicOut).attr("stroke-dashoffset", 0);

  trend.rule = inner.append("line")
    .attr("stroke", "#9ca3af").attr("stroke-dasharray", "3 4").attr("y2", plotHeight);

  trend.marker = inner.append("circle")
    .attr("r", 7).attr("fill", "#fff").attr("stroke", "#4648d4").attr("stroke-width", 3.5);

  trend.callout = inner.append("g").attr("pointer-events", "none");
  trend.callout.append("rect").attr("height", 28).attr("rx", 10).attr("fill", "#fff")
    .attr("stroke", "#e5e7eb").style("filter", "drop-shadow(0 4px 10px rgba(17,24,39,0.08))");
  trend.callout.append("text").attr("y", 19).attr("text-anchor", "middle")
    .style("font", "700 13px Inter, sans-serif").attr("fill", "#111827");

  inner.selectAll(".year-label")
    .data(rows)
    .join("text")
      .attr("class", "year-label")
      .attr("text-anchor", "middle")
      .attr("x", d => trend.x(d.year))
      .attr("y", plotHeight + 24)
      .text(d => `’${String(d.year).slice(2)}`);

  const step = trend.x(baseYear + 1) - trend.x(baseYear);
  inner.selectAll(".hit")
    .data(rows)
    .join("rect")
      .attr("class", "hit")
      .attr("x", d => trend.x(d.year) - step / 2)
      .attr("y", -trend.margin.top)
      .attr("width", step)
      .attr("height", plotHeight + trend.margin.top + 30)
      .attr("tabindex", 0)
      .attr("role", "button")
      .attr("aria-label", d => `Select ${d.year}: ${formatCount(d.hospitalisations)} hospitalisations`)
      .call(bindTooltip, d => `<b>${d.year}</b><br>${formatCount(d.hospitalisations)} hospitalisations<br>${formatCount(d.bedDays)} bed days`)
      .on("click", (e, d) => setYear(d.year))
      .on("keydown", (e, d) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setYear(d.year);
        }
      });
};

const updateTrend = () => {
  const row = national(view.year);
  const cx = trend.x(row.year);
  const cy = trend.y(row.hospitalisations);
  const label = `${row.year}: ${formatCount(row.hospitalisations)}`;
  const boxWidth = label.length * 7.6 + 22;
  const plotWidth = trend.width - trend.margin.left - trend.margin.right;
  const boxX = Math.max(-trend.margin.left + 2, Math.min(plotWidth + trend.margin.right - boxWidth - 2, cx - boxWidth / 2));

  const t = d3.transition().duration(duration).ease(d3.easeCubicInOut);
  trend.rule.transition(t).attr("x1", cx).attr("x2", cx).attr("y1", cy);
  trend.marker.transition(t).attr("cx", cx).attr("cy", cy);
  trend.callout.transition(t).attr("transform", `translate(${boxX},${cy - 44})`);
  trend.callout.select("rect").attr("width", boxWidth);
  trend.callout.select("text").attr("x", boxWidth / 2).text(label);
  trend.inner.selectAll(".year-label").classed("active", d => d.year === view.year);
};

// ---------- Cyclist sparkline ----------
const spark = { width: 480, height: 150, margin: { top: 40, right: 14, bottom: 12, left: 14 } };

const drawSpark = () => {
  const rows = data.users.filter(d => d.group === "Pedal cyclist").sort((a, b) => a.year - b.year);
  const svg = createSvg("#chart-cyclist", spark.width, spark.height, "Sparkline of pedal cyclist hospitalisations, 2011 to 2021");
  const plotWidth = spark.width - spark.margin.left - spark.margin.right;
  const plotHeight = spark.height - spark.margin.top - spark.margin.bottom;
  spark.inner = svg.append("g").attr("transform", `translate(${spark.margin.left},${spark.margin.top})`);
  spark.rows = rows;
  spark.plotWidth = plotWidth;
  spark.x = d3.scaleLinear().domain(d3.extent(rows, d => d.year)).range([0, plotWidth]);
  spark.y = d3.scaleLinear().domain(d3.extent(rows, d => d.hospitalisations)).nice().range([plotHeight, 0]);

  spark.inner.append("path")
    .datum(rows)
    .attr("fill", "rgba(255,255,255,0.12)")
    .attr("d", d3.area().curve(d3.curveMonotoneX)
      .x(d => spark.x(d.year)).y0(plotHeight).y1(d => spark.y(d.hospitalisations)));

  spark.inner.append("path")
    .datum(rows)
    .attr("fill", "none")
    .attr("stroke", "#fff")
    .attr("stroke-width", 3.5)
    .attr("stroke-linecap", "round")
    .attr("d", d3.line().curve(d3.curveMonotoneX).x(d => spark.x(d.year)).y(d => spark.y(d.hospitalisations)));

  spark.inner.selectAll(".spark-hit")
    .data(rows)
    .join("circle")
      .attr("class", "hit spark-hit")
      .attr("r", 16)
      .attr("cx", d => spark.x(d.year))
      .attr("cy", d => spark.y(d.hospitalisations))
      .call(bindTooltip, d => `<b>Cyclists · ${d.year}</b><br>${formatCount(d.hospitalisations)} hospitalisations`)
      .on("click", (e, d) => setYear(d.year));

  spark.marker = spark.inner.append("circle")
    .attr("r", 7).attr("fill", "#4648d4").attr("stroke", "#fff").attr("stroke-width", 3.5).attr("pointer-events", "none");

  spark.callout = spark.inner.append("g").attr("pointer-events", "none");
  spark.callout.append("rect").attr("height", 28).attr("rx", 14).attr("fill", "#fff");
  spark.callout.append("text").attr("y", 19).attr("text-anchor", "middle")
    .style("font", "700 13px Inter, sans-serif").attr("fill", "#4648d4");
};

const updateSpark = () => {
  const row = spark.rows.find(d => d.year === view.year);
  const cx = spark.x(row.year);
  const cy = spark.y(row.hospitalisations);
  const peak = d3.greatest(spark.rows, d => d.hospitalisations);
  const label = row === peak ? `Peak: ${row.year}` : `${row.year}: ${formatCount(row.hospitalisations)}`;
  const boxWidth = label.length * 7.6 + 24;
  const boxX = Math.max(-spark.margin.left, Math.min(spark.plotWidth + spark.margin.right - boxWidth, cx - boxWidth / 2));

  const t = d3.transition().duration(duration).ease(d3.easeCubicInOut);
  spark.marker.transition(t).attr("cx", cx).attr("cy", cy);
  spark.callout.transition(t).attr("transform", `translate(${boxX},${cy - 42})`);
  spark.callout.select("rect").attr("width", boxWidth);
  spark.callout.select("text").attr("x", boxWidth / 2).text(label);
};

// ---------- States ----------
const states = { width: 1100, height: 340, margin: { top: 8, right: 90, bottom: 8, left: 210 } };

const drawStates = () => {
  const svg = createSvg("#chart-states", states.width, states.height, "Bar chart of hospitalisations by state and territory");
  states.plotWidth = states.width - states.margin.left - states.margin.right;
  states.plotHeight = states.height - states.margin.top - states.margin.bottom;
  states.inner = svg.append("g").attr("transform", `translate(${states.margin.left},${states.margin.top})`);
  states.x = d3.scaleLinear().range([0, states.plotWidth]);
  states.y = d3.scaleBand().range([0, states.plotHeight]).padding(0.28);

  d3.selectAll("#metric-toggle button").on("click", function () {
    view.metric = this.dataset.metric;
    d3.selectAll("#metric-toggle button")
      .classed("active", function () { return this.dataset.metric === view.metric; })
      .attr("aria-pressed", function () { return this.dataset.metric === view.metric; });
    updateStates();
  });
};

const updateStates = () => {
  const { metric, year } = view;
  const rows = statesFor(year).sort((a, b) => b[metric] - a[metric]);
  const format = metric === "rate" ? d3.format(".0f") : formatCount;
  const t = d3.transition().duration(duration).ease(d3.easeCubicInOut);

  states.x.domain([0, d3.max(data.states, d => d[metric])]);
  states.y.domain(rows.map(d => d.state));

  d3.select("#states-sub").text(metric === "rate"
    ? `Hospitalisations per 100,000 people, ${year}. Highest: ${stateNames[rows[0].state]}.`
    : `Hospitalised cases, ${year}. Highest: ${stateNames[rows[0].state]}.`);

  const rowsJoin = states.inner.selectAll(".state-row")
    .data(rows, d => d.state)
    .join(enter => {
      const g = enter.append("g").attr("class", "state-row")
        .attr("transform", d => `translate(0,${states.y(d.state)})`);
      g.append("rect").attr("class", "track").attr("rx", 10)
        .attr("width", states.plotWidth).attr("fill", "#f3f4f6");
      g.append("rect").attr("class", "bar").attr("rx", 10).attr("width", 0).attr("tabindex", 0);
      g.append("text").attr("class", "state-label").attr("x", -16).attr("text-anchor", "end").attr("dy", "0.35em")
        .text(d => stateNames[d.state]);
      g.append("text").attr("class", "value-label").attr("dy", "0.35em");
      return g;
    });

  rowsJoin.transition(t).attr("transform", d => `translate(0,${states.y(d.state)})`);
  rowsJoin.select(".track").attr("height", states.y.bandwidth());
  rowsJoin.select(".state-label").attr("y", states.y.bandwidth() / 2);

  rowsJoin.select(".bar")
    .attr("height", states.y.bandwidth())
    .attr("aria-label", d => `${stateNames[d.state]}: ${format(d[metric])}`)
    .call(bindTooltip, d => `<b>${stateNames[d.state]}</b> · ${year}<br>${formatCount(d.count)} cases<br>${d3.format(".0f")(d.rate)} per 100,000 people`)
    .transition(t)
    .attr("width", d => Math.max(states.x(d[metric]), 20))
    .attr("fill", (d, i) => i === 0 ? "#ea580c" : d.state === "Vic" || d.state === "NSW" || d.state === "Qld" ? "#111827" : "#4648d4");

  rowsJoin.select(".value-label")
    .attr("y", states.y.bandwidth() / 2)
    .transition(t)
    .attr("x", d => Math.max(states.x(d[metric]), 20) + 10)
    .text(d => format(d[metric]));
};

// ---------- Year control ----------
const setYear = (year) => {
  view.year = year;
  d3.select("#year-select").property("value", year);
  hideTooltip();
  updateKpis();
  updateUsers();
  updateGauge();
  updateTrend();
  updateSpark();
  updateStates();
};

const populateYears = () => {
  d3.select("#year-select")
    .on("change", e => setYear(+e.target.value))
    .selectAll("option")
    .data(data.national.map(d => d.year).reverse())
    .join("option")
      .attr("value", d => d)
      .text(d => `Year ${d}`);
};

// Highlight the nav pill for the section in view
const watchSections = () => {
  const links = d3.selectAll(".topbar .segmented a");
  links.on("click", function () {
    links.classed("active", false);
    d3.select(this).classed("active", true);
  });
};

// ---------- Load ----------
Promise.all([
  d3.csv("data/national_year.csv", d => ({
    year: +d.year,
    hospitalisations: +d.hospitalisations,
    bedDays: +d.bed_days,
    diedCases: +d.died_cases
  })),
  d3.csv("data/road_user_year.csv", d => ({
    year: +d.year,
    group: d.group,
    hospitalisations: +d.hospitalisations
  })),
  d3.csv("data/state_year.csv", d => ({
    year: +d.year,
    state: d.state,
    count: +d.cases,
    population: +d.population_2021,
    rate: (+d.cases / +d.population_2021) * 100000
  }))
]).then(([nationalData, userData, stateData]) => {
  data = {
    national: nationalData.filter(d => d.year && d.hospitalisations).sort((a, b) => a.year - b.year),
    users: userData,
    states: stateData
  };
  view.year = d3.max(data.national, d => d.year);

  populateYears();
  drawUsers();
  drawGauge();
  drawTrend();
  drawSpark();
  drawStates();
  watchSections();
  setYear(view.year);
}).catch(error => {
  console.error("Error loading the CSV files:", error);
  d3.select("#error")
    .attr("hidden", null)
    .text("The data could not be loaded. Serve this folder from a web server (not file://) and check the data folder.");
});
