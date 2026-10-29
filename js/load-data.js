// Loads the three CSV files, prepares them, and draws each chart.
const addIndex = (rows) => {
  const baseline = new Map(rows
    .filter(d => d.year === yearDomain[0])
    .map(d => [d.group, d.hospitalisations]));

  rows.forEach(d => {
    d.index = (d.hospitalisations / baseline.get(d.group)) * 100;
  });

  return rows;
};

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
]).then(([nationalData, roadUserData, stateData]) => {
  drawTrend(nationalData.filter(d => d.year && d.hospitalisations));
  handleTrendEvents();

  drawRoadUsers(addIndex(roadUserData));
  handleUserEvents(roadUserData);

  drawStates(stateData);
  populateMetricFilters(stateData);
  updateStates(stateData, "count");
}).catch(error => {
  console.error("Error loading the CSV files:", error);
  d3.select("#error")
    .attr("hidden", null)
    .text("The data could not be loaded. Serve this folder from a web server (not file://) and check the data folder.");
});
