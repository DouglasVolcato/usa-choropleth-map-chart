async function getEducationData() {
  const rawData = await fetch(
    "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json"
  );

  const data = await rawData.json();

  return data;
}

async function getCountryData() {
  const rawData = await fetch(
    "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json"
  );
  const data = await rawData.json();

  return data;
}

async function getData() {
  const educationData = await getEducationData();
  const countryData = await getCountryData();

  return { educationData, countryData };
}

function setToolTip() {
  const cells = document.querySelectorAll(".county");

  cells.forEach((cell) => {
    cell.addEventListener("mouseover", (event) => {
      document.getElementById("tooltip")?.remove();

      const education = event.target.getAttribute("data-education");
      const mousePosition = [event.x, event.y];

      const tooltip = document.createElement("div");
      tooltip.id = "tooltip";
      tooltip.innerHTML = `${education} %`;
      tooltip.style.position = "fixed";
      tooltip.style.zIndex = "9999";
      tooltip.style.background = "#fff";
      tooltip.style.padding = "10px";
      tooltip.style.border = "1px solid #ccc";
      tooltip.style.borderRadius = "4px";
      tooltip.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.2)";

      tooltip.setAttribute("data-education", education);

      const tooltipWidth = 50;
      const windowWidth = window.innerWidth;
      const spaceRight = windowWidth - mousePosition[0];

      if (spaceRight >= tooltipWidth) {
        tooltip.style.left = `${mousePosition[0]}px`;
      } else {
        const spaceLeft = mousePosition[0] - tooltipWidth;
        tooltip.style.left = `${spaceLeft}px`;
      }

      tooltip.style.top = `${mousePosition[1]}px`;

      document.body.appendChild(tooltip);
    });

    cell.addEventListener("mouseout", (event) => {
      document.getElementById("tooltip")?.remove();
    });
  });
}

async function appendChart(us, education) {
  const main = d3.select("#main");
  const svg = main.append("svg");
  const path = d3.geoPath();

  const x = d3.scaleLinear().domain([2.6, 75.1]).rangeRound([600, 860]);

  const color = d3
    .scaleThreshold()
    .domain(d3.range(2.6, 75.1, (75.1 - 2.6) / 8))
    .range(d3.schemeGreens[9]);

  const g = svg
    .append("g")
    .attr("class", "key")
    .attr("id", "legend")
    .attr("transform", "translate(0,40)");

  g.selectAll("rect")
    .data(
      color.range().map(function (d) {
        d = color.invertExtent(d);
        if (d[0] === null) {
          d[0] = x.domain()[0];
        }
        if (d[1] === null) {
          d[1] = x.domain()[1];
        }
        return d;
      })
    )
    .enter()
    .append("rect")
    .attr("height", 8)
    .attr("x", function (d) {
      return x(d[0]);
    })
    .attr("width", function (d) {
      return d[0] && d[1] ? x(d[1]) - x(d[0]) : x(null);
    })
    .attr("fill", function (d) {
      return color(d[0]);
    });

  g.append("text")
    .attr("class", "caption")
    .attr("x", x.range()[0])
    .attr("y", -6)
    .attr("fill", "#000")
    .attr("text-anchor", "start")
    .attr("font-weight", "bold");

  g.call(
    d3
      .axisBottom(x)
      .tickSize(13)
      .tickFormat(function (x) {
        return Math.round(x) + "%";
      })
      .tickValues(color.domain())
  )
    .select(".domain")
    .remove();

  svg
    .append("g")
    .attr("class", "counties")
    .selectAll("path")
    .data(topojson.feature(us, us.objects.counties).features)
    .enter()
    .append("path")
    .attr("class", "county")
    .attr("data-fips", function (d) {
      return d.id;
    })
    .attr("data-education", function (d) {
      var result = education.filter(function (obj) {
        return obj.fips === d.id;
      });
      if (result[0]) {
        return result[0].bachelorsOrHigher;
      }
      return 0;
    })
    .attr("fill", function (d) {
      var result = education.filter(function (obj) {
        return obj.fips === d.id;
      });
      if (result[0]) {
        return color(result[0].bachelorsOrHigher);
      }

      return color(0);
    })
    .attr("d", path);

  svg
    .append("path")
    .datum(
      topojson.mesh(us, us.objects.states, function (a, b) {
        return a !== b;
      })
    )
    .attr("class", "states")
    .attr("d", path);

  setToolTip();
}

getData().then(({ countryData, educationData }) =>
  appendChart(countryData, educationData)
);
