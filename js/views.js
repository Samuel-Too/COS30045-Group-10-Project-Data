// View switching: one dashboard view fills the screen, chosen with the buttons in the top bar.
// The URL hash (#who, #where, ...) keeps the view on reload and makes the back button work.
const viewIds = ["overview", "who", "where", "affected", "sources"];

const showView = (id) => {
  const view = viewIds.includes(id) ? id : viewIds[0];
  d3.selectAll(".view").attr("hidden", function () { return this.id === `view-${view}` ? null : true; });
  d3.selectAll("#view-nav button")
    .classed("active", function () { return this.dataset.view === view; })
    .attr("aria-selected", function () { return this.dataset.view === view; })
    .attr("tabindex", function () { return this.dataset.view === view ? 0 : -1; });
  hideTooltip();
};

const initViews = () => {
  const buttons = d3.selectAll("#view-nav button");
  buttons
    .on("click", function () { location.hash = this.dataset.view; })
    .on("keydown", function (e) {
      const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (!step) return;
      const next = viewIds[(viewIds.indexOf(this.dataset.view) + step + viewIds.length) % viewIds.length];
      location.hash = next;
      d3.select(`#view-nav button[data-view="${next}"]`).node().focus();
    });
  window.addEventListener("hashchange", () => showView(location.hash.slice(1)));
  showView(location.hash.slice(1));
};

initViews();
