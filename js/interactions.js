// Tooltip, filter chips and the reset button.
const tooltip = d3.select("#tooltip");

const showTooltip = (x, y, html) => {
  tooltip.html(html).attr("hidden", null);
  const boxWidth = tooltip.node().offsetWidth;
  const left = x + 14 + boxWidth > document.documentElement.clientWidth - 8 ? x - boxWidth - 14 : x + 14;
  tooltip.style("left", `${left}px`).style("top", `${y + 14}px`);
};

const hideTooltip = () => tooltip.attr("hidden", true);

const bindTooltip = (selection, html) => selection
  .on("mousemove", (e, d) => showTooltip(e.pageX, e.pageY, html(d)))
  .on("focus", (e, d) => {
    const box = e.currentTarget.getBoundingClientRect();
    showTooltip(box.left + window.scrollX + box.width / 2, box.top + window.scrollY, html(d));
  })
  .on("mouseleave blur", hideTooltip);

const renderChips = () => {
  setText("#range-pill", filters.years.join("–"));
  const active = Object.keys(filterLabels).filter(k => filters[k] !== null);
  d3.select("#chips").selectAll(".chip-filter")
    .data(active, d => d)
    .join(enter => {
      const chip = enter.append("span").attr("class", "chip chip-filter");
      chip.append("span");
      chip.append("button")
        .attr("type", "button")
        .attr("aria-label", d => `Remove ${filterLabels[d]} filter`)
        .text("×")
        .on("click", (e, d) => setFilters({ [d]: null }));
      return chip;
    })
    .select("span")
    .text(d => `${filterLabels[d]}: ${filters[d]}`);
};
