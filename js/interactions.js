// Tooltips, year hover and the count/rate toggle.
const tooltip = d3.select("#tooltip");

const showTooltip = (x, y, html) => {
  tooltip.html(html).attr("hidden", null);
  const boxWidth = tooltip.node().offsetWidth;
  const left = x + 14 + boxWidth > document.documentElement.clientWidth - 8 ? x - boxWidth - 14 : x + 14;
  tooltip.style("left", `${left}px`).style("top", `${y + 14}px`);
};

const showTooltipAtElement = (element, html) => {
  const box = element.getBoundingClientRect();
  showTooltip(box.left + window.scrollX, box.top + window.scrollY, html);
};

const hideTooltip = () => tooltip.attr("hidden", true);

const trendTooltipHtml = (d) =>
  `<b>${d.year}</b><br>${formatCount(d.hospitalisations)} hospitalisations<br>${formatCount(d.bedDays)} bed days`;

const handleTrendEvents = () => {
  innerChartTrend.selectAll(".dot")
    .on("mousemove", (e, d) => showTooltip(e.pageX, e.pageY, trendTooltipHtml(d)))
    .on("focus", (e, d) => showTooltipAtElement(e.target, trendTooltipHtml(d)))
    .on("mouseleave", hideTooltip)
    .on("blur", hideTooltip);
};

const userTooltipHtml = (year, data) => {
  const rows = data.filter(d => d.year === year).sort((a, b) => b.index - a.index);
  const lines = rows.map(d =>
    `<span style="color:${groupColors[d.group]}">&#9632;</span> ${d.group}: ${formatCount(d.hospitalisations)} (${Math.round(d.index)})`);
  return `<b>${year}</b><br>${lines.join("<br>")}`;
};

const handleUserEvents = (data) => {
  const rule = innerChartUsers.select(".year-rule");

  const showRule = (year) => rule
    .attr("x1", xScaleUsers(year))
    .attr("x2", xScaleUsers(year))
    .attr("opacity", 0.4);

  const hideAll = () => {
    rule.attr("opacity", 0);
    hideTooltip();
  };

  innerChartUsers.selectAll(".year-band")
    .on("mousemove", (e, year) => {
      showRule(year);
      showTooltip(e.pageX, e.pageY, userTooltipHtml(year, data));
    })
    .on("focus", (e, year) => {
      showRule(year);
      showTooltipAtElement(e.target, userTooltipHtml(year, data));
    })
    .on("mouseleave", hideAll)
    .on("blur", hideAll);
};

const updateStates = (data, metric) => {
  const states = getStateData(data).sort((a, b) => b[metric] - a[metric]);
  const format = metric === "rate" ? formatRate : formatCount;

  yScaleStates.domain(states.map(d => d.state));
  xScaleStates.domain([0, d3.max(states, d => d[metric])]).nice();

  d3.select("#states .x-axis")
    .transition()
    .duration(motionDuration)
    .call(d3.axisBottom(xScaleStates).ticks(5).tickFormat(formatCount));

  d3.select("#states .y-axis")
    .transition()
    .duration(motionDuration)
    .call(d3.axisLeft(yScaleStates).tickSize(0));

  innerChartStates.selectAll(".bar")
    .data(states, d => d.state)
    .transition()
    .duration(motionDuration)
    .ease(d3.easeCubicInOut)
    .attr("y", d => yScaleStates(d.state))
    .attr("width", d => xScaleStates(d[metric]))
    .attr("fill", d => d.state === highlightState && metric === "rate" ? highlightColor : barColor);

  innerChartStates.selectAll(".bar-label")
    .data(states, d => d.state)
    .transition()
    .duration(motionDuration)
    .ease(d3.easeCubicInOut)
    .attr("x", d => xScaleStates(d[metric]) + 6)
    .attr("y", d => yScaleStates(d.state) + yScaleStates.bandwidth() / 2)
    .text(d => format(d[metric]));

  d3.select("#states .axis-label")
    .text(metric === "rate" ? `Cases per 100,000 people, ${statesYear}` : `Hospitalised cases, ${statesYear}`);

  d3.select("#states svg")
    .attr("aria-label", `Bar chart of ${metric === "rate" ? "cases per 100,000 people" : "case counts"} by state, ${statesYear}. Highest: ${states[0].state}.`);
};

const populateMetricFilters = (data) => {
  d3.select("#filters_states")
    .selectAll(".filter")
    .data(filters_metric)
    .join("button")
    .attr("class", d => `filter ${d.isActive ? "active" : ""}`)
    .attr("aria-pressed", d => d.isActive)
    .text(d => d.label)
    .on("click", (e, d) => {
      if (!d.isActive) {
        filters_metric.forEach(filter => {
          filter.isActive = filter.id === d.id;
        });

        d3.selectAll("#filters_states .filter")
          .classed("active", filter => filter.isActive)
          .attr("aria-pressed", filter => filter.isActive);

        updateStates(data, d.id);
      }
    });
};
