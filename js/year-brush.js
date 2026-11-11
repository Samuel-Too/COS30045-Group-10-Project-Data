// Draggable year range shared by the overview timeline and the First Nations chart.
// Dragging on either chart sets filters.years, and both brushes follow the filter.

// Grey bands for the breaks in the series (Victoria 2012, NSW 2017)
const drawSeriesBreaks = (inner, x, ph) => [[2011, 2011.5], [2016.5, 2021]].forEach(([from, to]) => inner.append("rect")
  .attr("class", "series-break").attr("x", x(from)).attr("width", x(to) - x(from)).attr("height", ph));

// Adds the brush, a hover guide with a tooltip for the nearest year, and keyboard control.
// Returns move(a, b), which slides the brush to the years in the filter.
const addYearBrush = (inner, { x, pw, ph, tip, onHover }) => {
  const clamp = v => Math.max(FULL_YEARS[0], Math.min(FULL_YEARS[1], v));
  const guide = inner.append("line").attr("class", "hover-guide").attr("y1", 0).attr("y2", ph).attr("opacity", 0);

  const brush = d3.brushX().extent([[0, 0], [pw, ph]]).on("end", e => {
    if (!e.sourceEvent) return;                                   // moves made by the code are not user input
    if (!e.selection) return setFilters({ years: [...FULL_YEARS] });  // a click without a drag clears the range
    const [a, b] = e.selection.map(x.invert).map(Math.round);
    setFilters({ years: [clamp(a), clamp(b)] });
  });

  const leave = () => { guide.attr("opacity", 0); onHover(null); hideTooltip(); };
  const group = inner.append("g").attr("class", "brush").call(brush)
    .attr("tabindex", 0).attr("role", "group")
    .attr("aria-label", "Year range. Left and right arrows move the last year, shift with arrows moves the first year, Escape resets.")
    .on("mousemove.tip", e => {
      if (e.buttons) return leave();                              // no tooltip while dragging
      const year = clamp(Math.round(x.invert(d3.pointer(e, inner.node())[0])));
      guide.attr("x1", x(year)).attr("x2", x(year)).attr("opacity", 1);
      onHover(year);
      showTooltip(e.pageX, e.pageY, tip(year));
    })
    .on("mouseleave.tip", leave)
    .on("keydown.range", e => {
      if (e.key === "Escape") return setFilters({ years: [...FULL_YEARS] });
      const step = { ArrowLeft: -1, ArrowRight: 1 }[e.key];
      if (!step) return;
      e.preventDefault();
      let [a, b] = filters.years;
      if (e.shiftKey) a = Math.min(b, clamp(a + step)); else b = Math.max(a, clamp(b + step));
      setFilters({ years: [a, b] });
    });

  return (a, b) => {
    const full = a === FULL_YEARS[0] && b === FULL_YEARS[1];
    group.transition().duration(MOTION)
      .call(brush.move, full ? null : [Math.max(0, x(a - 0.4)), Math.min(pw, x(b + 0.4))]);
  };
};
