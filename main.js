
const YEAR = 2023;

// Sizing
const chartW = 520;
const chartH = 320;
const margin = { top: 30, right: 25, bottom: 50, left: 60 };

const innerW = chartW - margin.left - margin.right;
const innerH = chartH - margin.top - margin.bottom;

// Select SVGs and set size
const svgHist1 = d3.select("#histogram1").attr("width", chartW).attr("height", chartH);
const svgHist2 = d3.select("#histogram2").attr("width", chartW).attr("height", chartH);
const svgScat  = d3.select("#scatterplot").attr("width", chartW * 2 + 20).attr("height", chartH);

const tooltip = d3.select("body")
  .append("div")
  .style("position", "absolute")
  .style("padding", "8px 10px")
  .style("background", "white")
  .style("border", "1px solid #ddd")
  .style("border-radius", "6px")
  .style("box-shadow", "0 2px 8px rgba(0,0,0,0.10)")
  .style("pointer-events", "none")
  .style("opacity", 0);

// Load data
Promise.all([
  d3.csv("data/life-expectancy.csv", d => ({
    entity: d.Entity,
    code: d.Code,
    year: +d.Year,
    lifeExp: d["Life expectancy"] === "" ? NaN : +d["Life expectancy"]
  })),
  d3.csv("data/population-growth-rates.csv", d => ({
    entity: d.Entity,
    code: d.Code,
    year: +d.Year,
    growth: d["Growth rate, total"] === "" ? NaN : +d["Growth rate, total"]
  }))
]).then(([lifeData, growthData]) => {
  const lifeYear = lifeData.filter(d =>
    d.year === YEAR && d.code && d.code.length === 3 && Number.isFinite(d.lifeExp)
  );

  const growthYear = growthData.filter(d =>
    d.year === YEAR && d.code && d.code.length === 3 && Number.isFinite(d.growth)
  );

  const growthByCode = new Map(growthYear.map(d => [d.code, d]));

  const merged = lifeYear
    .map(d => {
      const g = growthByCode.get(d.code);
      if (!g) return null;
      return {
        country: d.entity,
        code: d.code,
        year: YEAR,
        lifeExp: d.lifeExp,
        growth: g.growth
      };
    })
    .filter(d => d !== null);

  // Level 1 charts
  drawHistogram(svgHist1, merged.map(d => d.lifeExp), {
    xLabel: "Life expectancy (years)",
    yLabel: "Countries",
    title: `Life Expectancy Distribution (${YEAR})`
  });

  drawHistogram(svgHist2, merged.map(d => d.growth), {
    xLabel: "Population growth rate (%)",
    yLabel: "Countries",
    title: `Population Growth Distribution (${YEAR})`
  });

  drawScatter(svgScat, merged, {
    xLabel: "Population growth rate (%)",
    yLabel: "Life expectancy (years)",
    title: `Life Expectancy vs Population Growth (${YEAR})`
  });
}).catch(err => {
  console.error("Data load error:", err);
});

// Histogram
function drawHistogram(svg, values, { xLabel, yLabel, title }) {
  svg.selectAll("*").remove();

  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // X scale
  const x = d3.scaleLinear()
    .domain(d3.extent(values))
    .nice()
    .range([0, innerW]);

  // Bins
  const bins = d3.bin()
    .domain(x.domain())
    .thresholds(18)(values);

  // Y scale
  const y = d3.scaleLinear()
    .domain([0, d3.max(bins, d => d.length) || 1])
    .nice()
    .range([innerH, 0]);

  // Bars
  g.selectAll("rect")
    .data(bins)
    .join("rect")
    .attr("x", d => x(d.x0) + 1)
    .attr("y", d => y(d.length))
    .attr("width", d => Math.max(0, x(d.x1) - x(d.x0) - 2))
    .attr("height", d => innerH - y(d.length))
    .attr("fill", "#4682B4")
    .on("mousemove", (event, d) => {
      tooltip
        .style("opacity", 1)
        .html(`
          <div><strong>Range:</strong> ${d.x0.toFixed(1)} to ${d.x1.toFixed(1)}</div>
          <div><strong>Countries:</strong> ${d.length}</div>
        `)
        .style("left", `${event.pageX + 12}px`)
        .style("top", `${event.pageY + 12}px`);
    })
    .on("mouseleave", () => tooltip.style("opacity", 0));

  // Axes
  g.append("g")
    .attr("transform", `translate(0,${innerH})`)
    .call(d3.axisBottom(x));

  g.append("g")
    .call(d3.axisLeft(y).ticks(6));

  // Title
  svg.append("text")
    .attr("x", chartW / 2)
    .attr("y", 18)
    .attr("text-anchor", "middle")
    .style("font-weight", "600")
    .text(title);

  // Labels
  svg.append("text")
    .attr("x", chartW / 2)
    .attr("y", chartH - 10)
    .attr("text-anchor", "middle")
    .style("fill", "#555")
    .text(xLabel);

  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -(chartH / 2))
    .attr("y", 16)
    .attr("text-anchor", "middle")
    .style("fill", "#555")
    .text(yLabel);
}

// Scatterplot
function drawScatter(svg, data, { xLabel, yLabel, title }) {
  svg.selectAll("*").remove();

  const scatMargin = { top: 30, right: 25, bottom: 55, left: 70 };
  const scatW = +svg.attr("width");
  const scatH = +svg.attr("height");
  const w = scatW - scatMargin.left - scatMargin.right;
  const h = scatH - scatMargin.top - scatMargin.bottom;

  const g = svg.append("g")
    .attr("transform", `translate(${scatMargin.left},${scatMargin.top})`);

  const x = d3.scaleLinear()
    .domain(d3.extent(data, d => d.growth))
    .nice()
    .range([0, w]);

  const y = d3.scaleLinear()
    .domain(d3.extent(data, d => d.lifeExp))
    .nice()
    .range([h, 0]);

  // Axes
  g.append("g")
    .attr("transform", `translate(0,${h})`)
    .call(d3.axisBottom(x));

  g.append("g")
    .call(d3.axisLeft(y));

  // Points
  g.selectAll("circle")
    .data(data)
    .join("circle")
    .attr("cx", d => x(d.growth))
    .attr("cy", d => y(d.lifeExp))
    .attr("r", 3.2)
    .attr("fill", "#4682B4")
    .attr("opacity", 0.75)
    .on("mousemove", (event, d) => {
      tooltip
        .style("opacity", 1)
        .html(`
          <div><strong>${d.country}</strong> (${d.code})</div>
          <div>Growth: ${d.growth.toFixed(2)}%</div>
          <div>Life exp: ${d.lifeExp.toFixed(1)} yrs</div>
        `)
        .style("left", `${event.pageX + 12}px`)
        .style("top", `${event.pageY + 12}px`);
    })
    .on("mouseleave", () => tooltip.style("opacity", 0));

  // Title
  svg.append("text")
    .attr("x", scatW / 2)
    .attr("y", 18)
    .attr("text-anchor", "middle")
    .style("font-weight", "600")
    .text(title);

  // Labels
  svg.append("text")
    .attr("x", scatW / 2)
    .attr("y", scatH - 12)
    .attr("text-anchor", "middle")
    .style("fill", "#555")
    .text(xLabel);

  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -(scatH / 2))
    .attr("y", 18)
    .attr("text-anchor", "middle")
    .style("fill", "#555")
    .text(yLabel);
}