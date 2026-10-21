// Shared sizes, scales, colours and helpers used by every chart.
const margin = { top: 20, right: 110, bottom: 40, left: 56 };
const width = 760;
const height = 340;
const plotWidth = width - margin.left - margin.right;
const plotHeight = height - margin.top - margin.bottom;

const motionDuration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 500;

const yearDomain = [2011, 2021];
const statesYear = 2021;
const highlightGroup = "Pedal cyclist";
const highlightState = "NT";

const barColor = "#17212b";
const highlightColor = "#D55E00";
const groupColors = {
  "Pedal cyclist": "#0072B2",
  "Pedestrian": "#D55E00",
  "Motorcyclist": "#7A4EAB",
  "Car occupant": "#4d5b69",
  "Other": "#6b7580"
};
const labelColors = { ...groupColors, "Pedestrian": "#B34A00" };

const formatCount = d3.format(",");
const formatYear = d3.format("d");
const formatRate = d3.format(".0f");

let innerChartTrend;
let innerChartUsers;
let innerChartStates;

const xScaleTrend = d3.scaleLinear();
const yScaleTrend = d3.scaleLinear();
const xScaleUsers = d3.scaleLinear();
const yScaleUsers = d3.scaleLinear();
const xScaleStates = d3.scaleLinear();
const yScaleStates = d3.scaleBand();

const filters_metric = [
  { id: "count", label: "Number of cases", isActive: true },
  { id: "rate", label: "Cases per 100,000 people", isActive: false }
];

const addAxes = (chart, xScale, yScale, yFormat) => {
  chart.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0, ${plotHeight})`)
    .call(d3.axisBottom(xScale).ticks(11).tickFormat(formatYear));

  chart.append("g")
    .attr("class", "y-axis")
    .call(d3.axisLeft(yScale).ticks(5).tickSize(-plotWidth).tickFormat(yFormat));
};
