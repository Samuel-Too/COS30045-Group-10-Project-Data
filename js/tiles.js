// Small single-number tiles in the Who, Where and Affected views. They follow the same filters as the charts beside them.
const topEntry = (map) => d3.greatest([...map].filter(([, v]) => Number.isFinite(v)), ([, v]) => v);
const formatShare1 = d3.format(".1%");

const updateTiles = () => {
  const [a, b] = filters.years;
  const range = a === b ? `in ${a}` : `${a}–${b}`;

  // Who: largest road user and age group in view
  const byUser = sumBy(filterNational(["roadUser"]), "roadUser");
  const topUser = topEntry(byUser);
  swapText("#tile-top-user", topUser ? topUser[0] : "–");
  swapText("#tile-top-user-note", topUser ? `${formatShare(topUser[1] / d3.sum(byUser.values()))} of cases, ${range}` : "");

  const byAge = sumBy(filterNational(["age"]), "age");
  const topAge = topEntry(byAge);
  swapText("#tile-top-age", topAge ? `Ages ${topAge[0]}` : "–");
  swapText("#tile-top-age-note", topAge ? `${formatShare(topAge[1] / d3.sum(byAge.values()))} of cases, ${range}` : "");

  // Where: same file and filter scope as the tile map
  const stateScope = scopeFor({ roadUser: "road_user", age: "age" });
  const stateRows = data.states.filter(d => d.dim === stateScope.dim && d.category === stateScope.category);
  const stateSums = d3.rollup(stateRows.filter(inYears), v => v.some(d => Number.isNaN(d.cases)) ? NaN : d3.sum(v, d => d.cases), d => d.state);
  const topState = topEntry(stateSums);
  swapText("#tile-top-state", topState ? topState[0] : "–");
  swapText("#tile-top-state-note", topState ? `${formatShare(topState[1] / d3.sum(stateSums.values()))} of cases, ${range}` : "");

  const at = (state, year) => stateRows.find(d => d.state === state && d.year === year)?.cases;
  const growth = new Map(stateOrder.map(state => [state, at(state, b) / at(state, a) - 1]));
  const fastest = a === b ? null : topEntry(growth);
  swapText("#tile-growth-state", fastest ? fastest[0] : "–");
  swapText("#tile-growth-state-note", a === b ? "Choose two or more years" : fastest ? `${formatPct(fastest[1])} from ${a} to ${b}` : "Not published");

  // Affected: same file and filter scope as the First Nations chart
  const fnScope = scopeFor({ roadUser: "road_user", age: "age", remoteness: "remoteness" });
  const fnRows = data.fn.filter(d => d.dim === fnScope.dim && d.category === fnScope.category && inYears(d));
  const fnCases = d3.sum(fnRows.filter(d => d.status === "First Nations"), d => d.cases);
  const otherCases = d3.sum(fnRows.filter(d => d.status === "Non-Indigenous"), d => d.cases);
  swapText("#tile-fn-cases", fnCases ? formatCount(fnCases) : "–");
  swapText("#tile-fn-cases-note", fnCases ? range : "Not published for this selection");
  swapText("#tile-fn-share", fnCases + otherCases ? formatShare1(fnCases / (fnCases + otherCases)) : "–");
  swapText("#tile-fn-share-note", "of cases with known Indigenous status");
};
