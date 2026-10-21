// Chart 3: hospitalisations by state, 2021 (bars are sized and sorted in interactions.js).
const getStateData = (data) => data.filter(d => d.year === statesYear);

const drawStates = (data) => {
  const states = getStateData(data);

  const svg = d3.select("#states")
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("role", "img")
    .attr("aria-label", "Bar chart of hospitalised road crash injuries by state, 2021");

  innerChartStates = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  yScaleStates
    .domain(states.map(d => d.state))
    .range([0, plotHeight])
    .padding(0.25);

  xScaleStates.range([0, plotWidth]);

  innerChartStates.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0, ${plotHeight})`);

  innerChartStates.append("g")
    .attr("class", "y-axis");

  innerChartStates
    .selectAll(".bar")
    .data(states, d => d.state)
    .join("rect")
      .attr("class", "bar")
      .attr("x", 0)
      .attr("y", d => yScaleStates(d.state))
      .attr("width", 0)
      .attr("height", yScaleStates.bandwidth())
      .attr("fill", barColor);

  innerChartStates
    .selectAll(".bar-label")
    .data(states, d => d.state)
    .join("text")
      .attr("class", "bar-label")
      .attr("x", 6)
      .attr("y", d => yScaleStates(d.state) + yScaleStates.bandwidth() / 2)
      .attr("dy", "0.35em");

  innerChartStates.append("text")
    .attr("class", "axis-label")
    .attr("x", plotWidth)
    .attr("y", plotHeight + 34)
    .attr("text-anchor", "end");
};
