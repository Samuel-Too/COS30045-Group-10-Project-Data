// Constants and small helpers shared by every chart.
const MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 500;
const FULL_YEARS = [2011, 2021];
const roadUsers = ["Car occupant", "Motorcyclist", "Pedal cyclist", "Pedestrian", "Other"];
const ageBands = ["0-7", "8-16", "17-25", "26-39", "40-64", "65+"];
const remoteAreas = ["Major Cities", "Regional", "Remote"];
const stateOrder = ["NSW", "Vic", "Qld", "WA", "SA", "Tas", "ACT", "NT"];
const categoryOrder = { road_user: roadUsers, age: ageBands, sex: ["Male", "Female"] };
const filterLabels = { roadUser: "Road user", age: "Age", sex: "Sex", remoteness: "Area", state: "State" };

const ink = "#111827", indigo = "#4648d4", coral = "#ea580c", grey = "#6b7280";
const DIM = 0.45;   // opacity of marks that are not selected, the same in every chart
const palette = ["#4648d4", "#ea580c", "#0d9488", "#111827", "#a16207", "#7c3aed"];

const formatCount = d3.format(",");
const formatPct = d3.format("+.0%");
const formatShare = d3.format(".0%");

const createSvg = (selector, w, h, label) => d3.select(selector)
  .append("svg")
  .attr("viewBox", `0 0 ${w} ${h}`)
  .attr("role", "img")
  .attr("aria-label", label);

const setText = (selector, text) => d3.select(selector).text(text);

const bindToggle = (selector, key, onChange) => {
  const buttons = d3.selectAll(`${selector} button`);
  buttons.on("click", function () {
    buttons.classed("active", false).attr("aria-pressed", false);
    d3.select(this).classed("active", true).attr("aria-pressed", true);
    onChange(this.dataset[key]);
  });
};

const onActivate = (selection, handler) => selection
  .attr("tabindex", 0)
  .attr("role", "button")
  .on("click", (e, d) => handler(d))
  .on("keydown", (e, d) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handler(d); }
  });
