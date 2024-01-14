
document.addEventListener("DOMContentLoaded", function () {
  const estaciSelect = document.getElementById("estaciSelect");
  const startButton = document.getElementById("startButton");

  let animationInProgress = false;
  let animationFrameId;
  let startTime;
  let allMedianChartData;

  function drawBarChart(year, estaci, averagePercentage) {
    const colorRanges = [
      { range: [-Infinity, 29], color: "lightcoral" },
      { range: [30, 50], color: "lightblue" },
      { range: [51, 80], color: "dodgerblue" },
      { range: [81, Infinity], color: "darkblue" }
    ];

    const color = getColorForPercentage(averagePercentage, colorRanges);

    //create  bar chart
    const svg = d3.select("#bar-graph");

    svg.selectAll("*").remove();


    const barHeight = 520 * (averagePercentage / 100);
    const barWidth = 700;
    const x = (700 - barWidth) / 2;
    const y = 500 - barHeight;

    // Create a rectangle for the bar chart
    svg.append("rect")
      .attr("x", x)
      .attr("y", y)
      .attr("width", barWidth)
      .attr("height", barHeight)
      .attr("fill", color);

    // Add text label for percentage
    svg.append("text")
      .attr("x", x + barWidth / 2)
      .attr("y", y + barHeight / 2)
      .attr("font-size", "28px")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .attr("fill", "white")
      .text(`${averagePercentage.toFixed(2)}%`);
  }

  async function fetchData(year, estaci) {
    try {
      const startDate = `${year}-01-01T00:00:00.000`;
      const endDate = `${year}-12-31T23:59:59.999`;

      const response = await fetch(`https://analisi.transparenciacatalunya.cat/resource/gn9e-3qhr.json?dia=${startDate}&$where=dia <= '${endDate}'&estaci='${estaci}'`);
      const data = await response.json();

      console.log(`Fetched data for ${estaci} in ${year}:`, data);

      let sumPercentage = 0;
      let validEntries = 0;

      data.forEach(entry => {
        if (entry.percentatge_volum_embassat !== null) {
          sumPercentage += parseFloat(entry.percentatge_volum_embassat);
          validEntries++;
        }
      });

      console.log(`Sum of percentatge_volum_embassat for ${estaci} in ${year}:`, sumPercentage);

      // Calculate the average percentage for the year and estaci
      const averagePercentage = validEntries > 0 ? sumPercentage / validEntries : 0;

      console.log(`Average percentage for ${estaci} in ${year}:`, averagePercentage);

      return averagePercentage;
    } catch (error) {
      console.error("Error fetching or processing data:", error);
      throw error;
    }
  }

  const animationDuration = 20000;

  function animate(currentTime, startYear, endYear, estaci, percentages) {
    if (!startTime) {
      startTime = currentTime;
    }

    const progress = Math.min(1, (currentTime - startTime) / animationDuration);

    const currentAnimatedYear = startYear + Math.floor(((endYear - startYear + 1) * progress) % (endYear - startYear + 1));

    startButton.innerText = `${currentAnimatedYear}`;

    const svg = d3.select("#bar-graph");

    // Clear previous content
    svg.selectAll("*").remove();

    // Draw bar chart
    drawBarChart(currentAnimatedYear, estaci, percentages[currentAnimatedYear - startYear]);

    if (progress < 1) {
      animationFrameId = requestAnimationFrame((time) => animate(time, startYear, endYear, estaci, percentages));
    } else {
      startTime = null;
      startButton.disabled = false;
    }
  }

  function startAnimation(startYear, endYear, estaci, percentages) {
    drawBarChart(startYear, estaci, percentages[startYear - startYear]);
    animate(0, startYear, endYear, estaci, percentages);
  }

  async function handleButtonClick() {
    startTime = null;
    startButton.disabled = true;
    const selectedEstaci = estaciSelect.value;
    cancelAnimationFrame(animationFrameId);

    const promises = [];
    const percentages = [];

    for (let currentYear = 2000; currentYear <= 2023; currentYear++) {
      promises.push(
        fetchData(currentYear, selectedEstaci).then(averagePercentage => {
          percentages.push(averagePercentage);
        })
      );
    }

    Promise.all(promises).then(() => {
      animate(0, 2000, 2023, selectedEstaci, percentages);
      startButton.disabled = false;
    });
  }

  startButton.addEventListener("click", handleButtonClick);

  for (let year = 2000; year <= 2023; year++) {
    const option = document.createElement("option");
    option.value = year;
    option.text = year;
  }

  fetchData(2000, estaciSelect.value);

  function getColorForPercentage(percentage, colorRanges) {
    for (const rangeInfo of colorRanges) {
      const [min, max] = rangeInfo.range;

      if (percentage >= min && percentage <= max) {
        return rangeInfo.color;
      }
    }

    return "rgb(14, 131, 198)";
  }

// Function to fetch data from the API for line chart
async function fetchLineChartData(year, estaci) {
try {
  const startDate = `${year}-01-01T00:00:00.000`;
  const endDate = `${year}-12-31T23:59:59.999`;
  const response = await fetch(`https://analisi.transparenciacatalunya.cat/resource/gn9e-3qhr.json?dia=${startDate}&$where=dia <= '${endDate}'&estaci='${encodeURIComponent(estaci)}'`);;
  const data = await response.json();

  console.log(`Fetched line chart data for ${estaci} in ${year}:`, data);

  return data;
} catch (error) {
  console.error("Error fetching line chart data:", error);
  throw error;
}
}

async function createLineChart() {
//width and height for your chart
const width = 420;
const height = 250;


// Define margins
const margin = { top: 60, right: 20, bottom: 20, left: 50 }; // Adjust the left margin as needed

// Select #line-graph and append an SVG element to it
const svg = d3.select("#line-graph").append("svg")
  .attr("width", (width + margin.left + margin.right) * 3) // Adjust based on the number of columns
  .attr("height", (height + margin.top + margin.bottom) * 3) // Adjust based on the number of rows
  .append("g")  // Append a 'g' element to apply margins
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

const estaciList = [
  "Embassament de Sau (Vilanova de Sau)",
  "Embassament de Sant Ponç (Clariana de Cardener)",
  "Embassament de Susqueda (Osor)",
  "Embassament de Darnius Boadella (Darnius)",
  "Embassament de Foix (Castellet i la Gornal)",
  "Embassament de Riudecanyes",
  "Embassament de Siurana (Cornudella de Montsant)",
  "Embassament de la Baells (Cercs)",
  "Embassament de la Llosa del Cavall (Navès)"
];

// Array to store median values for each estaci
const medianList = [];

// Array to store unique estaci and their corresponding unique nivell_absolut values
// const uniqueEstaciList = [];

// Array to store average percentage every 5 years for each estaci
// const avgPercentageEvery5YearsList = [];

// Loop through estaciList and create individual line charts
for (let i = 0; i < estaciList.length; i++) {
  const estaci = estaciList[i];

  // Array to store average values for each year
  const yearlyAverages = [];

  // Array to store unique integer values of nivell_absolut for each estaci
  // const uniqueNivellValues = new Set();

  // Loop through the years to calculate average for each year
  for (let year = 2000; year <= 2023; year++) {
    const data = await fetchLineChartData(year, estaci);

    // Calculate average for the year
    const average = d3.mean(data, d => d.percentatge_volum_embassat);

    // Push the average value to the array
    yearlyAverages.push({ year, average });

    // Extract unique integer values of nivell_absolut and add them to the set
    // data.forEach(d => uniqueNivellValues.add(Math.round(d.nivell_absolut)));
  }

  // Convert the set to an array
  // const uniqueNivellArray = Array.from(uniqueNivellValues);

  // Add the estaci and unique nivell_absolut values to the list
  // uniqueEstaciList.push({ estaci, uniqueNivellValues: uniqueNivellArray });

  // Parse the date / time
  const parseTime = d3.timeParse("%Y");

  // X and Y scales
  const x = d3.scaleTime().range([0, width]); // Set width as needed
  const y = d3.scaleLinear().range([height, margin.top]); // Set height as needed

  // Define the line
  const line = d3.line()
    .x(d => x(parseTime(d.year)))
    .y(d => y(d.average));

  // Set the domains
  x.domain(d3.extent(yearlyAverages, d => parseTime(d.year)));
  y.domain([0, d3.max(yearlyAverages, d => d.average)]);

  // Append a group element for each line chart with margin
  const chartGroup = svg.append("g")
    .attr("transform", "translate(" + (i % 3) * (width + margin.left + margin.right) + "," + (Math.floor(i / 3) * (height + margin.top + margin.bottom)) + ")");

  // Add the X Axis
  chartGroup.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x).tickFormat(d3.timeFormat("%Y")));

  // Add the Y Axis
  chartGroup.append("g")
    .call(d3.axisLeft(y));

  // Add the line
  chartGroup.append("path")
    .data([yearlyAverages])
    .attr("class", "line")
    .attr("d", line)
    .attr("fill", "none")
    .attr("stroke", "steelblue");

  // Add title
  chartGroup.append("text")
    .attr("x", (width + margin.left + margin.right) / 2)
    .attr("y", margin.top - 20)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("text-decoration", "underline")
    .text(estaci);

  // Calculate the median of the yearly averages
  const median = d3.median(yearlyAverages, d => d.average);

  // Add the median to the list
  medianList.push({ estaci, median });

  // Add a red line at the median
  chartGroup.append("line")
    .attr("x1", 0)
    .attr("y1", y(median))
    .attr("x2", width)
    .attr("y2", y(median))
    .attr("stroke", "red")
    .attr("stroke-width", 2)
    .attr("stroke-dasharray", "4");

   // Add legend for the median and average lines
   const legend = chartGroup.append("g")
   .attr("transform", "translate(" + (width - 80) + "," + (margin.top + 170) + ")");

 // Add rectangle for median
 legend.append("rect")
   .attr("x", -4)  
   .attr("y", -10) 
   .attr("width", 80) 
   .attr("height", 20) 
   .style("fill", "lightgray");

 // Add red dashed line for median
 legend.append("line")
   .attr("x1", 0)
   .attr("y1", 0)
   .attr("x2", 20)
   .attr("y2", 0)
   .attr("stroke", "red")
   .attr("stroke-width", 2)
   .attr("stroke-dasharray", "4");

 // Add rectangle for average (blue line)
 legend.append("rect")
   .attr("x", -4)  
   .attr("y", -30) 
   .attr("width", 80) 
   .attr("height", 20) 
   .style("fill", "lightgray");

 // Add blue line for average
 legend.append("line")
   .attr("x1", 0)
   .attr("y1", -20)
   .attr("x2", 25)
   .attr("y2", -20)
   .attr("stroke", "steelblue")
   .attr("stroke-width", 2);

 // Add text for median
 legend.append("text")
   .attr("x", 30)
   .attr("y", 0)
   .attr("dy", "0.35em")
   .style("font-size", "12px")
   .text("Median");

 // Add text for average
 legend.append("text")
   .attr("x", 30)
   .attr("y", -20)
   .attr("dy", "0.35em")
   .style("font-size", "12px")
   .text("Mitjana");
    

  // Calculate average percentage every 5 years
  // const avgPercentageEvery5Years = [];
  // for (let startYear = 2000; startYear <= 2020; startYear += 5) {
  //   const endYear = startYear + 4;

  //       // Filter data for the specified 5-year range
  //       const dataInRange = yearlyAverages.filter(d => d.year >= startYear && d.year <= endYear);

  //       // Calculate the average percentage for the range
  //       const avgPercentage = d3.mean(dataInRange, d => d.average);
  
  //       // Push the result to the array
  //       avgPercentageEvery5Years.push({
  //         range: `${startYear}-${endYear}`,
  //         averagePercentage: avgPercentage.toFixed(2),
  //       });
  //     }
  
      // Add the estaci and average percentage every 5 years to the list
      // avgPercentageEvery5YearsList.push({ estaci, avgPercentageEvery5Years });
  
      // Add the average percentage every 5 years to the console
      // console.log(`Average Percentage Every 5 Years for ${estaci}:`, avgPercentageEvery5Years);
  
    }
  
    // // Print the entire list of median values to the console with 2 decimals
    // console.log("Median List:", medianList.map(item => ({ estaci: item.estaci, median: item.median.toFixed(2) })));
  
    // // Print the entire list of unique estaci and their corresponding unique nivell_absolut values to the console
    // console.log("Unique Estaci List:", uniqueEstaciList);
  }

  // Call the function to create line charts
  createLineChart();



  let d3PieChart;

const periods = [
    { label: "2000-2016", startYear: 2000, endYear: 2016 },
    { label: "2017-2022", startYear: 2017, endYear: 2022 },
    { label: "2023", startYear: 2023, endYear: 2023 }
];

async function fetchMedianVolumEmbassatByEstaciAndPeriod() {
    const estaci = document.getElementById("estaci").value;

    try {
        const medianData = [];

        for (const period of periods) {
            const startDate = `${period.startYear}-01-01T00:00:00.000`;
            const endDate = `${period.endYear}-12-31T23:59:59.999`;

            const response = await fetch(
                `https://analisi.transparenciacatalunya.cat/resource/gn9e-3qhr.json?dia=${startDate}&$where=dia <= '${endDate}'&estaci='${encodeURIComponent(estaci)}'`
            );
            const data = await response.json();

            const volumValues = data
                .filter(entry => entry.volum_embassat !== null)
                .map(entry => parseFloat(entry.volum_embassat));

            volumValues.sort((a, b) => a - b);

            let median;
            const mid = Math.floor(volumValues.length / 2);

            if (volumValues.length % 2 === 0) {
                median = (volumValues[mid - 1] + volumValues[mid]) / 2;
            } else {
                median = volumValues[mid];
            }

            medianData.push({
                estaci,
                period: period.label,
                median
            });

            console.log(`Estaci: ${estaci}, Period: ${period.label}, Median: ${median}`);
        }

        console.log("Fetched Data:", medianData); // Log the entire fetched data for debugging

        updateD3PieChart(medianData); // Update the D3 pie chart with the new data

        return medianData;
    } catch (error) {
        console.error("Error fetching or processing data:", error);
        throw error;
    }
}


function updateD3PieChart(data) {
  // Extract unique periods for labels
  const labels = Array.from(new Set(data.map(entry => entry.period)));

  // Create a dataset for the current estaci
  const dataset = labels.map(label => {
      const entry = data.find(entry => entry.period === label);
      return {
          label,
          value: entry.median,
      };
  });

  // Check if the D3 pie chart already exists, remove it if yes
  d3.select("#d3-pie-chart svg").remove();

  const width = 800;
  const height = 800;
  const radius = Math.min(width, height) / 2;

  const svg = d3.select("#d3-pie-chart")
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`);

  const arc = d3.arc()
      .outerRadius(radius - 10)
      .innerRadius(0);

  const arcs = svg.selectAll(".arc")
      .data(d3.pie().value(d => d.value)(dataset))
      .enter()
      .append("g")
      .attr("class", "arc");

  arcs.append("path")
      .attr("d", d => arc(d))
      .attr("fill", d => getCustomColorByLabel(d.data.label)); // Use getCustomColorByLabel here

      // Add legend
  const legend = svg.selectAll(".legend")
      .data(dataset)
      .enter()
      .append("g")
      .attr("class", "legend")
      .attr("transform", (d, i) => `translate(200, ${-height / 2 + i * 20})`);

  legend.append("rect")
      .attr("width", 18)
      .attr("height", 18)
      .style("fill", d => getCustomColorByLabel(d.label));

  legend.append("text")
      .attr("x", 25)
      .attr("y", 9) 
      .attr("dy", ".35em")
      .style("text-anchor", "start")
      .text(d =>  d.label);
  

  // Add text labels
  arcs.append("text")
      .attr("transform", d => `translate(${arc.centroid(d)})`)
      .attr("text-anchor", "middle")
      .style("fill", "white")
      .html(d => {
        const lines = [`Mediana:`,`${d.data.value.toFixed(2)}`];
        return lines.map((line, i) => `<tspan x="0" dy="${i * 1.2}em">${line}</tspan>`).join('');
    });
}


function getCustomColorByLabel(label) {
 
  switch (label) {
      case "2000-2016":
          return "#010088"; // Light Red
      case "2017-2022":
          return "#1e8cf7"; // Medium Blue
      case "2023":
          return "#e87c7c"; // Dark Blue
      default:
          return "#808080"; // Default color for unknown labels
  }
}

document.getElementById("estaci").addEventListener("change", () => {
    fetchMedianVolumEmbassatByEstaciAndPeriod();
  });
  
}); 



  

