// Chart 2: change in hospitalisations by road user, indexed to 2011 = 100.
const drawRoadUsers = (data) => {
  const svg = d3.select("#road-users")
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("role", "img")
    .attr("aria-label", "Line chart of change in hospitalised injuries by road user since 2011, indexed to 100");

  innerChartUsers = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const groups = d3.group(data.slice().sort((a, b) => a.year - b.year), d => d.group);
  const years = d3.range(yearDomain[0], yearDomain[1] + 1);

  xScaleUsers.domain(yearDomain).range([0, plotWidth]);
  yScaleUsers.domain([60, 160]).range([plotHeight, 0]);

  addAxes(innerChartUsers, xScaleUsers, yScaleUsers, formatYear);

  innerChartUsers.append("text")
    .attr("class", "axis-label")
    .attr("x", 0)
    .attr("y", -8)
    .attr("text-anchor", "start")
    .text("Hospitalisations indexed to 2011");

  innerChartUsers.append("line")
    .attr("class", "baseline")
    .attr("x1", 0)
    .attr("x2", plotWidth)
    .attr("y1", yScaleUsers(100))
    .attr("y2", yScaleUsers(100));

  innerChartUsers.append("text")
    .attr("class", "annotation")
    .attr("x", 4)
    .attr("y", yScaleUsers(100) - 5)
    .text("2011 level = 100");

  const line = d3.line()
    .x(d => xScaleUsers(d.year))
    .y(d => yScaleUsers(d.index));

  const series = innerChartUsers
    .selectAll(".series")
    .data([...groups])
    .join("g")
      .attr("class", "series");

  series.append("path")
    .attr("class", "series-line")
    .attr("d", ([, rows]) => line(rows))
    .attr("stroke", ([group]) => groupColors[group])
    .attr("stroke-width", ([group]) => group === highlightGroup ? 4 : 2.5);

  series.append("text")
    .attr("class", "series-label")
    .attr("x", plotWidth + 8)
    .attr("y", ([, rows]) => yScaleUsers(rows[rows.length - 1].index) + 4)
    .attr("fill", ([group]) => labelColors[group])
    .text(([group, rows]) => `${group} ${Math.round(rows[rows.length - 1].index)}`);

  innerChartUsers.append("line")
    .attr("class", "year-rule")
    .attr("y1", 0)
    .attr("y2", plotHeight)
    .attr("opacity", 0);

  innerChartUsers
    .selectAll(".year-band")
    .data(years)
    .join("rect")
      .attr("class", "year-band")
      .attr("x", year => xScaleUsers(year) - plotWidth / 20)
      .attr("width", plotWidth / 10)
      .attr("height", plotHeight)
      .attr("tabindex", 0)
      .attr("aria-label", year => `${year}: ` + [...groups]
        .map(([group, rows]) => `${group} ${formatCount(rows.find(d => d.year === year).hospitalisations)}`)
        .join(", "));
};
