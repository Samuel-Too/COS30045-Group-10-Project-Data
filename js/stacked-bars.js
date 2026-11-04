// 100% stacked bars shared by the state composition and remoteness charts.
const renderStack = (inner, items, cats, o) => {
  const rows = items.map(item => {
    const total = d3.sum(item.values);
    let x = 0;
    const segs = cats.map((cat, i) => {
      const share = total ? item.values[i] / total : 0;
      const seg = { key: item.key, label: item.label, cat, i, v: item.values[i], share, x0: x };
      x += share;
      return seg;
    });
    return { ...item, segs };
  });

  const rowGroups = inner.selectAll(".stack-row").data(rows, d => d.key)
    .join(enter => {
      const row = enter.append("g").attr("class", "stack-row").attr("transform", (d, i) => `translate(0,${i * o.rowH})`);
      row.append("text").attr("class", "state-label").attr("y", (o.rowH - 10) / 2).attr("dy", "0.35em").text(d => d.label);
      return row;
    })
    .attr("opacity", d => o.dim && o.dim(d) ? 0.45 : 1);

  rowGroups.selectAll(".stack-seg").data(d => d.segs, d => d.cat)
    .join("rect")
      .attr("class", "stack-seg")
      .attr("x", d => o.labelW + d.x0 * o.barW)
      .attr("width", d => Math.max(0, d.share * o.barW - 1))
      .attr("height", o.rowH - 10)
      .attr("rx", 4)
      .attr("fill", d => palette[d.i % palette.length])
      .attr("stroke", d => o.picked && o.picked(d) ? ink : "none")
      .attr("stroke-width", 3)
      .attr("aria-label", d => `${d.label}, ${d.cat}: ${formatShare(d.share)}`)
      .call(onActivate, o.onClick)
      .call(bindTooltip, d => `<b>${d.label}</b> · ${d.cat}<br>${formatShare(d.share)} (${formatCount(d.v)} cases)`);

  rowGroups.selectAll(".stack-pct").data(d => d.segs.filter(s => s.share > 0.08), d => d.cat)
    .join("text")
      .attr("class", "stack-pct")
      .attr("x", d => o.labelW + (d.x0 + d.share / 2) * o.barW)
      .attr("y", (o.rowH - 10) / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", "middle")
      .text(d => formatShare(d.share));
};

const renderLegend = (selector, cats) => d3.select(selector).selectAll("li")
  .data(cats, d => d)
  .join(enter => {
    const item = enter.append("li");
    item.append("i");
    item.append("span");
    return item;
  })
  .each(function (d, i) {
    d3.select(this).select("i").style("background", palette[i % palette.length]);
    d3.select(this).select("span").text(d);
  });
