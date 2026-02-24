const YEAR = 2023;

const chartW = 520;
const chartH = 320;
const margin = { top: 30, right: 25, bottom: 50, left: 60 };

const innerW = chartW - margin.left - margin.right;
const innerH = chartH - margin.top - margin.bottom;

const mapH = 650;
const svgMap = d3.select("#choropleth");
const mapTitle = d3.select("#mapTitle");
const metricSelect = d3.select("#metricSelect");
const metricASelect = d3.select("#metricA");
const metricBSelect = d3.select("#metricB");

const hist1Title = d3.select("#hist1Title");
const hist2Title = d3.select("#hist2Title");
const scatTitle = d3.select("#scatTitle");

const legendDiv = d3.select("#legend");

const METRICS = {
  growth: {
    label: "Population growth rate (%)",
    type: "diverging",
    fmt: (v) => `${v.toFixed(2)}%`,
  },
  lifeExp: {
    label: "Life expectancy (years)",
    type: "sequential",
    fmt: (v) => `${v.toFixed(1)} yrs`,
  },
  gdp: {
    label: "GDP per capita",
    type: "sequential",
    fmt: (v) => `${Math.round(v).toLocaleString()}`,
  },
  co2: {
    label: "CO₂ emissions per capita",
    type: "sequential",
    fmt: (v) => `${v.toFixed(2)}`,
  },
  childMort: {
    label: "Under-five mortality rate",
    type: "sequential",
    fmt: (v) => `${v.toFixed(1)}`,
  },
};

// Select SVGs and set size
const svgHist1 = d3
  .select("#histogram1")
  .attr("width", chartW)
  .attr("height", chartH);
const svgHist2 = d3
  .select("#histogram2")
  .attr("width", chartW)
  .attr("height", chartH);
const svgScat = d3
  .select("#scatterplot")
  .attr("width", chartW * 2 + 20)
  .attr("height", chartH);

const tooltip = d3
  .select("body")
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
  d3.csv("data/life-expectancy.csv", (d) => ({
    entity: d.Entity,
    code: d.Code,
    year: +d.Year,
    value: d["Life expectancy"] === "" ? NaN : +d["Life expectancy"],
  })),
  d3.csv("data/population-growth-rates.csv", (d) => ({
    entity: d.Entity,
    code: d.Code,
    year: +d.Year,
    value: d["Growth rate, total"] === "" ? NaN : +d["Growth rate, total"],
  })),
  d3.csv("data/gdp-per-capita-maddison-project-database.csv", (d) => ({
    entity: d.Entity,
    code: d.Code,
    year: +d.Year,
    value: d["GDP per capita"] === "" ? NaN : +d["GDP per capita"],
  })),
  d3.csv("data/co-emissions-per-capita.csv", (d) => ({
    entity: d.Entity,
    code: d.Code,
    year: +d.Year,
    value:
      d["CO₂ emissions per capita"] === ""
        ? NaN
        : +d["CO₂ emissions per capita"],
  })),
  d3.csv("data/child-mortality.csv", (d) => ({
    entity: d.Entity,
    code: d.Code,
    year: +d.Year,
    value:
      d["Under-five mortality rate (selected)"] === ""
        ? NaN
        : +d["Under-five mortality rate (selected)"],
  })),
  d3.json("data/world.geojson"),
])
  .then(([lifeRows, growthRows, gdpRows, co2Rows, mortRows, world]) => {
    const countryMap = new Map();

    function upsert(rows, key) {
      rows.forEach((r) => {
        if (
          r.year !== YEAR ||
          !r.code ||
          r.code.length !== 3 ||
          !Number.isFinite(r.value)
        )
          return;
        if (!countryMap.has(r.code)) {
          countryMap.set(r.code, {
            code: r.code,
            country: r.entity,
            year: YEAR,
            metrics: {},
          });
        }
        countryMap.get(r.code).metrics[key] = r.value;
      });
    }

    upsert(lifeRows, "lifeExp");
    upsert(growthRows, "growth");
    upsert(gdpRows, "gdp");
    upsert(co2Rows, "co2");
    upsert(mortRows, "childMort");

    const allCountries = Array.from(countryMap.values());
    const dataByCode = new Map(allCountries.map((d) => [d.code, d]));

    initMap(world);

    window.addEventListener("resize", () => {
      initMap();
      render(allCountries, dataByCode, world);
    });

    function rerender() {
      render(allCountries, dataByCode, world);
    }

    metricSelect.on("change", rerender);
    metricASelect.on("change", rerender);
    metricBSelect.on("change", rerender);

    render(allCountries, dataByCode, world);
  })
  .catch((err) => console.error("Data load error:", err));

function render(allCountries, dataByCode, world) {
  const mapMetric = metricSelect.property("value");
  const metricA = metricASelect.property("value");
  const metricB = metricBSelect.property("value");

  const filtered = allCountries.filter(
    (d) =>
      Number.isFinite(d.metrics[metricA]) &&
      Number.isFinite(d.metrics[metricB]),
  );

  const aLabel = METRICS[metricA].label;
  const bLabel = METRICS[metricB].label;

  if (!hist1Title.empty()) hist1Title.text(`${aLabel} Distribution`);
  if (!hist2Title.empty()) hist2Title.text(`${bLabel} Distribution`);
  if (!scatTitle.empty()) scatTitle.text(`${bLabel} vs ${aLabel}`);

  drawHistogram(
    svgHist1,
    filtered.map((d) => d.metrics[metricA]),
    {
      xLabel: aLabel,
      yLabel: "Countries",
      title: `${aLabel} Distribution (${YEAR})`,
    },
  );

  drawHistogram(
    svgHist2,
    filtered.map((d) => d.metrics[metricB]),
    {
      xLabel: bLabel,
      yLabel: "Countries",
      title: `${bLabel} Distribution (${YEAR})`,
    },
  );

  drawScatter(
    svgScat,
    filtered.map((d) => ({
      country: d.country,
      code: d.code,
      x: d.metrics[metricA],
      y: d.metrics[metricB],
      xKey: metricA,
      yKey: metricB,
    })),
    {
      xLabel: aLabel,
      yLabel: bLabel,
      title: `${bLabel} vs ${aLabel} (${YEAR})`,
    },
  );

  updateMap(world, dataByCode, mapMetric);
}

// Histogram
function drawHistogram(svg, values, { xLabel, yLabel, title, metricKey }) {
  svg.selectAll("*").remove();

  const fmt = metricKey ? METRICS[metricKey].fmt : (v) => v.toFixed(2);

  const g = svg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // X scale
  const x = d3
    .scaleLinear()
    .domain(d3.extent(values))
    .nice()
    .range([0, innerW]);

  // Bins
  const bins = d3.bin().domain(x.domain()).thresholds(18)(values);

  // Y scale
  const y = d3
    .scaleLinear()
    .domain([0, d3.max(bins, (d) => d.length) || 1])
    .nice()
    .range([innerH, 0]);

  // Bars
  g.selectAll("rect")
    .data(bins)
    .join("rect")
    .attr("x", (d) => x(d.x0) + 1)
    .attr("y", (d) => y(d.length))
    .attr("width", (d) => Math.max(0, x(d.x1) - x(d.x0) - 2))
    .attr("height", (d) => innerH - y(d.length))
    .attr("fill", "#4682B4")
    .on("mousemove", (event, d) => {
      tooltip
        .style("opacity", 1)
        .html(
          `
  <div><strong>${xLabel}</strong></div>
  <div><strong>Range:</strong> ${fmt(d.x0)} to ${fmt(d.x1)}</div>
  <div><strong>Countries:</strong> ${d.length}</div>
        `,
        )
        .style("left", `${event.pageX + 12}px`)
        .style("top", `${event.pageY + 12}px`);
    })
    .on("mouseleave", () => tooltip.style("opacity", 0));

  // Axes
  g.append("g")
    .attr("transform", `translate(0,${innerH})`)
    .call(d3.axisBottom(x));

  g.append("g").call(d3.axisLeft(y).ticks(6));

  // Title
  svg
    .append("text")
    .attr("x", chartW / 2)
    .attr("y", 18)
    .attr("text-anchor", "middle")
    .style("font-weight", "600")
    .text(title);

  // Labels
  svg
    .append("text")
    .attr("x", chartW / 2)
    .attr("y", chartH - 10)
    .attr("text-anchor", "middle")
    .style("fill", "#555")
    .text(xLabel);

  svg
    .append("text")
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

  const g = svg
    .append("g")
    .attr("transform", `translate(${scatMargin.left},${scatMargin.top})`);

  const x = d3
    .scaleLinear()
    .domain(d3.extent(data, (d) => d.x))
    .nice()
    .range([0, w]);

  const y = d3
    .scaleLinear()
    .domain(d3.extent(data, (d) => d.y))
    .nice()
    .range([h, 0]);

  // Axes
  g.append("g").attr("transform", `translate(0,${h})`).call(d3.axisBottom(x));

  g.append("g").call(d3.axisLeft(y));

  // Points
  g.selectAll("circle")
    .data(data)
    .join("circle")
    .attr("cx", (d) => x(d.x))
    .attr("cy", (d) => y(d.y))
    .attr("r", 3.2)
    .attr("fill", "#4682B4")
    .attr("opacity", 0.75)
    .on("mouseenter", function () {
      d3.select(this).attr("r", 6).attr("opacity", 1);
    })
    .on("mouseleave", function () {
      d3.select(this).attr("r", 3.2).attr("opacity", 0.75);
      tooltip.style("opacity", 0);
    })
    .on("mousemove", (event, d) => {
      tooltip
        .style("opacity", 1)
        .html(
          `
      <div><strong>${d.country}</strong> (${d.code})</div>
      <div>${METRICS[d.xKey].label}: ${METRICS[d.xKey].fmt(d.x)}</div>
      <div>${METRICS[d.yKey].label}: ${METRICS[d.yKey].fmt(d.y)}</div>
    `,
        )
        .style("left", `${event.pageX + 12}px`)
        .style("top", `${event.pageY + 12}px`);
    });

  // Title
  svg
    .append("text")
    .attr("x", scatW / 2)
    .attr("y", 18)
    .attr("text-anchor", "middle")
    .style("font-weight", "600")
    .text(title);

  // Labels
  svg
    .append("text")
    .attr("x", scatW / 2)
    .attr("y", scatH - 12)
    .attr("text-anchor", "middle")
    .style("fill", "#555")
    .text(xLabel);

  svg
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -(scatH / 2))
    .attr("y", 18)
    .attr("text-anchor", "middle")
    .style("fill", "#555")
    .text(yLabel);
}
// Choropleth map
function initMap() {
  const w = svgMap.node().parentNode.getBoundingClientRect().width;
  svgMap.attr("width", w).attr("height", mapH);
}

function updateMap(world, dataByCode, metric) {
  const width = +svgMap.attr("width");
  const height = +svgMap.attr("height");

  svgMap.selectAll("*").remove();

  const projection = d3.geoNaturalEarth1();
  projection.fitSize([width, height], world);

  const path = d3.geoPath(projection);

  const values = world.features
    .map((f) => dataByCode.get(f.id)?.metrics?.[metric])
    .filter((v) => Number.isFinite(v));

  const domain = d3.extent(values);
  const scaleInfo = getColorScale(metric, domain);

  mapTitle.text(`${METRICS[metric].label} Map (${YEAR})`);

  svgMap
    .append("g")
    .selectAll("path")
    .data(world.features)
    .join("path")
    .attr("d", path)
    .attr("fill", (f) => {
      const row = dataByCode.get(f.id);
      const v = row ? row.metrics?.[metric] : NaN;
      return Number.isFinite(v) ? scaleInfo.color(v) : "#e9e9e9";
    })
    .attr("stroke", "#ffffff")
    .attr("stroke-width", 0.6)
    .on("mouseenter", function () {
      d3.select(this).attr("stroke", "#222").attr("stroke-width", 1.2);
    })
    .on("mouseleave", function () {
      d3.select(this).attr("stroke", "#ffffff").attr("stroke-width", 0.6);
      tooltip.style("opacity", 0);
    })
    .on("mousemove", (event, f) => {
      const row = dataByCode.get(f.id);
      const name = f.properties?.name || "Unknown";
      const v = row ? row.metrics?.[metric] : NaN;

      const label = METRICS[metric].label;
      const valueText = Number.isFinite(v) ? METRICS[metric].fmt(v) : "No data";

      tooltip
        .style("opacity", 1)
        .html(
          `
      <div><strong>${name}</strong> (${f.id || "—"})</div>
      <div>${label}: ${valueText}</div>
    `,
        )
        .style("left", `${event.pageX + 12}px`)
        .style("top", `${event.pageY + 12}px`);
    });

  renderLegend(metric, scaleInfo);
}

function getColorScale(metric, domain) {
  if (metric === "growth") {
    const maxAbs =
      Math.max(Math.abs(domain[0] || 0), Math.abs(domain[1] || 0)) || 1;
    const color = d3
      .scaleSequential()
      .domain([maxAbs, -maxAbs])
      .interpolator(d3.interpolateRdBu);
    return { color, domain: [-maxAbs, maxAbs] };
  }

  const color = d3
    .scaleSequential()
    .domain(domain)
    .interpolator(d3.interpolateViridis);

  return { color, domain };
}

function renderLegend(metric, scaleInfo) {
  legendDiv.html("");

  const label = METRICS[metric].label;

  const [d0, d1] = scaleInfo.domain;

  const n = 80;
  const stops = d3.range(n).map((i) => i / (n - 1));
  const colors = stops.map((t) => {
    const v = d0 + t * (d1 - d0);
    return scaleInfo.color(v);
  });

  const gradient = `linear-gradient(to right, ${colors.join(",")})`;

  const row = legendDiv.append("div").attr("class", "legend-row");
  row
    .append("div")
    .style("min-width", "190px")
    .style("color", "#555")
    .text(label);
  row.append("div").attr("class", "legend-bar").style("background", gradient);

  const labels = legendDiv.append("div").attr("class", "legend-labels");
  labels.append("div").text(formatLegendValue(metric, d0));
  labels.append("div").text(formatLegendValue(metric, (d0 + d1) / 2));
  labels.append("div").text(formatLegendValue(metric, d1));
}

function formatLegendValue(metric, v) {
  if (!Number.isFinite(v)) return "—";
  return METRICS[metric].fmt(v);
}
