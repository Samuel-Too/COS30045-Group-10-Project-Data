/* Loads the three cubes, draws every chart once, then hands control to the filter model.
   GenAI acknowledgement: first draft written with Claude (Anthropic).
   Prompt summary: build a D3 dashboard from the three provided BITRE files with linked charts
   (timeline brush, road user ranking, age heatmap, state tile map and mix, First Nations comparison).
   Team: replace this note with what you changed and tested. */
const blankToNaN = v => v === "" ? NaN : +v;
 
d3.csv("data/master_cube.csv", d => ({
  dataset: d.dataset,
  year: +d.year,
  state: d.state,
  status: d.status,
  remoteness: d.remoteness,
  age: d.age,
  sex: d.sex,
  roadUser: d.road_user,
  dim: d.dim,
  category: d.category,
  cases: blankToNaN(d.cases),
  bedDays: blankToNaN(d.bed_days)
})).then(rows => {
  const part = name => rows.filter(d => d.dataset === name);
  Object.assign(data, { national: part("national"), states: part("state"), fn: part("first_nations") });
 
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
  console.error("Error loading the master CSV:", error);
  d3.select("#error")
    .attr("hidden", null)
    .text("The data could not be loaded. Serve this folder from a web server (not file://) and check data/master_cube.csv.");
}); 