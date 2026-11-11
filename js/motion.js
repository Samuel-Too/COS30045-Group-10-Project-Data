// Motion helpers shared by the charts. Every duration comes from MOTION, which is 0 when the user prefers reduced motion.

// Counts a number up or down to its new value. A non-finite value shows a dash.
const animateNumber = (selector, value, format) => {
  const el = d3.select(selector), node = el.node();
  if (!Number.isFinite(value)) { el.interrupt().text("–"); node.__value = NaN; return; }
  const from = Number.isFinite(node.__value) ? node.__value : 0;
  node.__value = value;
  el.interrupt().transition().duration(MOTION).tween("text", () => {
    const i = d3.interpolateNumber(from, value);
    return t => { node.textContent = format(i(t)); };
  });
};

// Replaces text and replays a short CSS fade, but only when the text actually changed.
const swapText = (selector, text) => {
  const el = d3.select(selector);
  if (el.text() === text) return;
  el.text(text).classed("swap", false);
  void el.node().offsetWidth;            // forces a reflow so the animation restarts
  el.classed("swap", true);
};

// Morphs a path to a new shape. Paths with a different number of segments are swapped without morphing.
const morphPath = (path, d) => {
  const count = s => (s.match(/[A-Za-z]/g) || []).length;
  const old = path.attr("d");
  if (old && d && count(old) === count(d)) path.transition().duration(MOTION).attr("d", d);
  else path.interrupt().attr("d", d);
};
