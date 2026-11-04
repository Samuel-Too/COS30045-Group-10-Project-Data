/* Loads the three cubes, draws every chart once, then hands control to the filter model.
   GenAI acknowledgement: first draft written with Claude (Anthropic).
   Prompt summary: build a D3 dashboard from the three provided BITRE files with linked charts
   (timeline brush, road user ranking, age heatmap, state tile map and mix, First Nations comparison).
   Team: replace this note with what you changed and tested. */
const blankToNaN = v => v === "" ? NaN : +v;

Promise.all([
  d3.csv("data/national_cube.csv", d => ({
    year: +d.year, remoteness: d.remoteness, age: d.age, sex: d.sex,
    roadUser: d.road_user, cases: +d.hospitalisations, bedDays: +d.bed_days
  })),
  d3.csv("data/state_cube.csv", d => ({ year: +d.year, state: d.state, dim: d.dim, category: d.category, cases: blankToNaN(d.cases) })),
  d3.csv("data/first_nations_cube.csv", d => ({ year: +d.year, status: d.status, dim: d.dim, category: d.category, cases: blankToNaN(d.cases) }))
]).then(([national, states, fn]) => {
  Object.assign(data, { national, states, fn });

  drawTimeline();
  drawUsers();
  drawHeat();
  drawStateMap();
  drawComp();
  drawFn();
  drawRemote();

  updaters.push(updateKpis, updateTimeline, updateUsers, updateHeat, updateStateMap, updateComp, updateFn, updateRemote);
  d3.select("#reset").on("click", resetFilters);
  watchSections();
  updateAll();
}).catch(error => {
  console.error("Error loading the CSV files:", error);
  d3.select("#error")
    .attr("hidden", null)
    .text("The data could not be loaded. Serve this folder from a web server (not file://) and check the data folder.");
});
