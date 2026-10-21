// Chart 1: national trend line with series-break shading.
const drawTrend = (data) => {
  const svg = d3.select("#trend")
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("role", "img")
    .attr("aria-label", "Line chart of national hospitalised road crash injuries, 2011 to 2021");

  innerChartTrend = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  xScaleTrend.domain(yearDomain).range([0, plotWidth]);
  yScaleTrend.domain([0, 45000]).range([plotHeight, 0]);

  [[2011, 2011.5], [2016.5, 2021]].forEach(([start, end]) => {
    innerChartTrend.append("rect")
      .attr("class", "series-break")
      .attr("x", xScaleTrend(start))
      .attr("width", xScaleTrend(end) - xScaleTrend(start))
      .attr("height", plotHeight);
  });

  addAxes(innerChartTrend, xScaleTrend, yScaleTrend, formatCount);

  innerChartTrend.append("text")
    .attr("class", "axis-label")
    .attr("x", 0)
    .attr("y", -8)
    .attr("text-anchor", "start")
    .text("Hospitalisations per year");

  innerChartTrend.append("text")
    .attr("class", "annotation")
    .attr("x", xScaleTrend(2016.6))
    .attr("y", 14)
    .text("Series break (NSW policy change)");

  innerChartTrend.append("path")
    .datum(data)
    .attr("class", "trend-line")
    .attr("d", d3.line()
      .x(d => xScaleTrend(d.year))
      .y(d => yScaleTrend(d.hospitalisations)));

  innerChartTrend
    .selectAll(".dot")
    .data(data)
    .join("circle")
      .attr("class", "dot")
      .attr("r", 5)
      .attr("cx", d => xScaleTrend(d.year))
      .attr("cy", d => yScaleTrend(d.hospitalisations))
      .attr("tabindex", 0)
      .attr("aria-label", d => `${d.year}: ${formatCount(d.hospitalisations)} hospitalisations`);
};
