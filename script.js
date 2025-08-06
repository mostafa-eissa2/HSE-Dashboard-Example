// =================================================================
// SECTION 1: RAW DATA SECTIONS
// لإضافة بيانات شهر جديد، قم بإضافتها هنا. تأكد من تحديث السطر الأول (Header) أيضاً.
// =================================================================

const permits_csv = `
Project,Jan,Feb,Mar,Apr,May,Jun,Jul
Project1,50,30,12,14,35,45,15
Project2,10,56,50,40,30,20,10
Project3,62,46,75,40,56,75,75
Project4,86,62,19,100,105,45,123
Project5,85,95,16,65,20,4,5
Project6,20,56,12,25,26,27,28
`;
const parties_csv = `
Column1,Jan,Feb,Mar,Apr,May,Jun,Jul
Subcontractor,569,403,110,101,113,155,499
Storage Department,65,20,65,55,56,50,20
Quality Department,65,89,40,56,20,10,30
Survey Department,35,54,03,17,20,5,25
Execution Department,135,125,168,147,135,106,156
`;
const delays_csv = `
Category,Jan,Feb,Mar,Apr,May,Jun,Jul
Delays,568,125,462,762,459,674,326
On Time,200,456,120,123,126,68,45
`;
const shifts_csv = `
Category,Jan,Feb,Mar,Apr,May,Jun,Jul
DAY,853,159,159,753,654,987,798
NIGHT,1165,5,15,369,15,95,25
`;
const compliance_csv = `
Category,Jan,Feb,Mar,Apr,May,Jun,Jul
Compliance,0.56,0.25,0.40,0.60,0.50,0.20,0.18
`;
const performance_csv = `
Month,HSE_Observation
Jan,100
Feb,80
Mar,20
Apr,40
May,60
Jun,70
Jul,50
`;
const manpower_csv = `
Month,Worked Hours Sewedy,Worked Hours Sub,LTI,MTC,Property Damage
Jan,51369,75231,0,0,1
Feb,65432,32681,0,0,7
Mar,12345,65423,0,0,0
Apr,45812,28585,0,0,8
May,1265,71256,0,5,6
Jun,12582,12351,0,0,2
Jul,12351,12368,0,2,3
`;
const training_csv = `
Month,Emp Manpower,Total Training
Jan,568,574
Feb,457,542
Mar,694,789
Apr,123,751
May,357,159
Jun,128,132
Jul,123,158
`;
const inductions_csv = `
Month,Total
Jan,195
Feb,250
Mar,369
Apr,951
May,328
Jun,125
Jul,753
`;
// =================================================================
// SECTION 2: CONFIGURATION AND DATA PARSING
// =================================================================

const monthMapping = { "Jan": "January", "Feb": "February", "Mar": "March", "Apr": "April", "May": "May", "Jun": "June", "Jul": "July" };
const ALL_MONTHS = Object.keys(monthMapping);

function parseGeneric(csvText) {
    const dataByMonth = {};
    if (!csvText) return dataByMonth;
    const parsed = d3.csvParse(csvText.trim());
    parsed.forEach(row => {
        const group = row[Object.keys(row)[0]];
        for (const month in row) {
            if (ALL_MONTHS.includes(month)) {
                if (!dataByMonth[month]) dataByMonth[month] = [];
                dataByMonth[month].push({ group, value: +row[month] || 0 });
            }
        }
    });
    return dataByMonth;
}
function parseByMonth(csvText) {
    const dataByMonth = {};
    if (!csvText) return dataByMonth;
    const parsed = d3.csvParse(csvText.trim());
    parsed.forEach(row => {
        const month = row.Month;
        if (ALL_MONTHS.includes(month)) {
            dataByMonth[month] = row;
        }
    });
    return dataByMonth;
}

const ALL_DATA = {
    permits: parseGeneric(permits_csv),
    parties: parseGeneric(parties_csv),
    shifts: parseGeneric(shifts_csv),
    delays: parseGeneric(delays_csv),
    compliance: parseGeneric(compliance_csv),
    performance: parseByMonth(performance_csv),
    manpower: parseByMonth(manpower_csv),
    training: parseByMonth(training_csv),
    inductions: parseByMonth(inductions_csv),
};
const availableMonths = Object.keys(ALL_DATA.performance);

// =================================================================
// SECTION 3: MAIN APPLICATION LOGIC
// =================================================================

function setupDashboard() {
    const dropdown = d3.select("#month-filter");
    dropdown.selectAll("option").data(ALL_MONTHS).enter().append("option").attr("value", d => d).text(d => monthMapping[d]);
    const defaultMonth = "Jul";
    dropdown.property("value", defaultMonth);
    updateDashboard(defaultMonth);
    dropdown.on("change", (event) => updateDashboard(event.target.value));
    setupModal();
}

function updateDashboard(selectedMonth) {
    // --- Update KPI Section ---
    const totalHoursCard = d3.select("#total-hours-card");
    const kpiGrid = d3.select("#monthly-kpis");

    if (selectedMonth === 'Aug') {

        kpiGrid.html(`<p class="no-data-msg">Select a month from Jan to Jun to see monthly KPIs.</p>`);
    } else {
        displayMonthlyKPIs(selectedMonth);
    }

    if (selectedMonth === 'Jul') {
        totalHoursCard.style("display", "block");
        animateValue("kpi-total-hours", 2500000);
    } else {
        totalHoursCard.style("display", "none");
        displayMonthlyKPIs(selectedMonth);
    }

    // --- Prepare Data for Charts ---
    const permits = ALL_DATA.permits[selectedMonth] || [];
    const parties = ALL_DATA.parties[selectedMonth] || [];
    const shifts = ALL_DATA.shifts[selectedMonth] || [];
    const delays = ALL_DATA.delays[selectedMonth] || [];
    const complianceValue = ALL_DATA.compliance[selectedMonth]?.[0]?.value || 0;

    // --- Call Chart Drawing Functions ---
    drawPermitsChart(permits, "Permits per Project");
    drawHorizontalBarChart(parties, "Permits by Requesting Party");
    drawExplodedPieChart(delays, "Delays Analysis");
    drawInteractivePieChart(shifts, "Shifts Analysis");

    // --- Handle Conditional Charts ---
    const observationsCard = d3.select("#observations-card");
    const cumulativeCard = d3.select("#cumulative-card");
    if (selectedMonth === 'Jan' || !availableMonths.includes(selectedMonth)) {
        observationsCard.style("display", "none");
    } else {
        observationsCard.style("display", "block");
        const monthIndex = availableMonths.indexOf(selectedMonth);
        const cumulativeObsData = Object.values(ALL_DATA.performance).slice(0, monthIndex + 1);
        drawObservationsTrendChart(cumulativeObsData);

        const totalPermitsYTD = availableMonths.reduce((sum, month) => sum + d3.sum(ALL_DATA.permits[month] || [], d => d.value), 0);
        let cumulativeSum = 0;
        for (let i = 0; i <= monthIndex; i++) {
            cumulativeSum += d3.sum(ALL_DATA.permits[availableMonths[i]] || [], d => d.value);
        }
        drawCumulativeRadialChart(cumulativeSum, totalPermitsYTD);
    }
}

// =================================================================
// SECTION 4: KPI & MODAL & CHART FUNCTIONS
// =================================================================

const drawNoData = (selector) => d3.select(selector).html(`<p class="no-data-msg">No data for this selection.</p>`);

function animateValue(id, endValue) {
    const element = d3.select(`#${id}`);
    if (element.empty()) return;
    element.transition().duration(1500)
        .tween("text", function() {
            const i = d3.interpolate(this.textContent.replace(/,/g, ''), endValue);
            return function(t) { this.textContent = d3.format(",.0f")(i(t)); };
        });
}

function displayMonthlyKPIs(month) {
    const container = d3.select("#monthly-kpis").html("");
    const perf = ALL_DATA.performance[month] || {};
    const manp = ALL_DATA.manpower[month] || {};
    const train = ALL_DATA.training[month] || {};
    const induc = ALL_DATA.inductions[month] || {};

    const kpis = [
        { label: "Monthly Hours", value: (+manp["Worked Hours Sewedy"] || 0) + (+manp["Worked Hours Sub"] || 0) },
        { label: "Employees", value: train["Emp Manpower"] },
        { label: "PTW", value: d3.sum(ALL_DATA.permits[month] || [], d => d.value) },
        { label: "Observations", value: perf.HSE_Observation },
        { label: "LTI", value: manp.LTI },
        { label: "MTC", value: manp.MTC },
        { label: "Property Damage", value: manp["Property Damage"] },
        { label: "Trainings", value: train["Total Training"] },
        { label: "Inductions", value: (induc.Total || 0) },
    ];

    kpis.forEach(kpi => {
        const card = container.append("div").attr("class", "kpi-card");
        card.append("div").attr("class", "kpi-label").text(kpi.label);
        const valueDiv = card.append("div").attr("class", "kpi-value").attr("id", `kpi-${kpi.label.replace(/\s/g, '')}`).text(0);
        animateValue(`kpi-${kpi.label.replace(/\s/g, '')}`, kpi.value);
    });
}

function showModal(title, data) {
    d3.select("#modal-title").text(title);
    createTable("#modal-table-container", data);
    d3.select("#modal-overlay").classed("visible", true);
}

function hideModal() {
    d3.select("#modal-overlay").classed("visible", false);
}

function createTable(selector, dataArray) {
    const container = d3.select(selector).html("");
    if (!dataArray || dataArray.length === 0) { return; }
    const table = container.append("table").attr("class", "data-table");
    const thead = table.append("thead");
    const tbody = table.append("tbody");
    const headers = Object.keys(dataArray[0]);
    thead.append("tr").selectAll("th").data(headers).join("th").text(d => d);
    const rows = tbody.selectAll("tr").data(dataArray).join("tr");
    rows.selectAll("td").data(d => headers.map(header => d[header])).join("td").text(d => d);
}

function setupModal() {
    d3.select(".close-button").on("click", hideModal);
    d3.select("#modal-overlay").on("click", function(event) {
        if (event.target === this) {
            hideModal();
        }
    });
}

function drawPermitsChart(data, title) {
    const selector = "#permits-chart-container";
    const container = d3.select(selector).html("");
    if (data.length === 0) { drawNoData(selector); return; }
    container.on("click", () => showModal(title, data));
    const margin = { top: 30, right: 20, bottom: 80, left: 50 }, width = container.node().getBoundingClientRect().width - margin.left - margin.right, height = 300 - margin.top - margin.bottom;
    const svg = container.append("svg").attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`).append("g").attr("transform", `translate(${margin.left},${margin.top})`);
    const x = d3.scaleBand().range([0, width]).domain(data.map(d => d.group)).padding(0.2);
    const y = d3.scaleLinear().domain([0, d3.max(data, d => d.value) * 1.15 || 10]).range([height, 0]);
    svg.append("g").attr("class", "axis-x").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x)).selectAll("text").attr("transform", "translate(-10,0)rotate(-45)").style("text-anchor", "end");
    svg.append("g").attr("class", "axis-y").call(d3.axisLeft(y));
    svg.selectAll(".bar").data(data).enter().append("rect").attr("class", "bar").attr("x", d => x(d.group)).attr("width", x.bandwidth()).attr("y", d => y(d.value)).attr("height", d => height - y(d.value));
    svg.selectAll(".bar-label").data(data).enter().append("text").attr("class", "bar-label").attr("x", d => x(d.group) + x.bandwidth() / 2).attr("y", d => y(d.value) - 5).text(d => d.value).style("opacity", d => d.value > 0 ? 1 : 0);
}

function drawHorizontalBarChart(data, title) {
    const selector = "#parties-chart-container";
    const container = d3.select(selector).html("");
    if (data.length === 0) { drawNoData(selector); return; }
    container.on("click", () => showModal(title, data));
    const margin = { top: 20, right: 40, bottom: 40, left: 120 }, width = container.node().getBoundingClientRect().width - margin.left - margin.right, height = 300 - margin.top - margin.bottom;
    const svg = container.append("svg").attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`).append("g").attr("transform", `translate(${margin.left},${margin.top})`);
    const y = d3.scaleBand().range([0, height]).domain(data.map(d => d.group)).padding(0.2);
    const x = d3.scaleLinear().domain([0, d3.max(data, d => d.value) * 1.1 || 10]).range([0, width]);
    svg.append("g").attr("class", "axis-y").call(d3.axisLeft(y));
    svg.append("g").attr("class", "axis-x").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x));
    svg.selectAll(".bar").data(data).enter().append("rect").attr("class", "bar").attr("y", d => y(d.group)).attr("height", y.bandwidth()).attr("x", 0).attr("width", d => x(d.value));
    svg.selectAll(".bar-label").data(data).enter().append("text").attr("class", "bar-label").attr("y", d => y(d.group) + y.bandwidth() / 2).attr("dy", "0.35em").attr("x", d => x(d.value) + 15).text(d => d.value).style("fill", "var(--dark-text)").attr("text-anchor", "start").style("opacity", d => d.value > 0 ? 1 : 0);
}

function drawExplodedPieChart(data, title) {
    const selector = "#delays-chart-container";
    const container = d3.select(selector).html("");
    if (data.length === 0) { drawNoData(selector); return; }
    container.on("click", () => showModal(title, data));
    const width = container.node().getBoundingClientRect().width, height = 300, radius = Math.min(width, height) / 2 * 0.7;
    const svg = container.append("svg").attr("viewBox", `0 0 ${width} ${height}`).append("g").attr("transform", `translate(${width / 2},${height / 2})`);
    const color = d3.scaleOrdinal(["#2980B9", "#2C2A29"]);
    const pie = d3.pie().value(d => d.value).sort(null);
    const arc = d3.arc().innerRadius(radius * 0.5).outerRadius(radius);
    svg.selectAll(".arc-path").data(pie(data)).enter().append("path").attr("class", "arc-path").attr("d", arc).attr("fill", d => color(d.data.group)).style("stroke", "var(--white)").style("stroke-width", "5px").append("title").text(d => `${d.data.group}: ${d.data.value}`);
    drawPieLegend("#delays-legend-container", data, color);
}

function drawInteractivePieChart(data, title) {
    const selector = "#shifts-chart-container";
    const container = d3.select(selector).html("");
    if (data.length === 0) { drawNoData(selector); return; }
    container.on("click", () => showModal(title, data));
    const width = container.node().getBoundingClientRect().width, height = 300, radius = Math.min(width, height) / 2 * 0.7;
    const svg = container.append("svg").attr("viewBox", `0 0 ${width} ${height}`).append("g").attr("transform", `translate(${width / 2},${height / 2})`);
    const color = d3.scaleOrdinal(["#2980B9", "#2C2A29"]);
    const pie = d3.pie().value(d => d.value).sort(null);
    const arc = d3.arc().innerRadius(0).outerRadius(radius);
    const arcHover = d3.arc().innerRadius(0).outerRadius(radius * 1.1);
    svg.selectAll(".arc-path").data(pie(data)).enter().append("path").attr("class", "arc-path").attr("d", arc).attr("fill", d => color(d.data.group)).on("mouseover", function() { d3.select(this).transition().duration(200).attr("d", arcHover); }).on("mouseout", function() { d3.select(this).transition().duration(200).attr("d", arc); });
    drawPieLegend("#shifts-legend-container", data, color);
}

function drawPieLegend(selector, data, color) {
    const container = d3.select(selector).html("");
    data.forEach(d => {
        if (d.value > 0) {
            const item = container.append("div").attr("class", "legend-item");
            item.append("div").attr("class", "legend-color").style("background-color", color(d.group));
            item.append("span").text(`${d.group}: ${d.value}`);
        }
    });
}

function drawCumulativeRadialChart(value, total) {
    const selector = "#cumulative-permits-chart-container";
    const container = d3.select(selector).html("");
    const percentage = total > 0 ? value / total : 0;
    if (value === null || typeof value === 'undefined') { drawNoData(selector); return; }
    container.on("click", () => showModal("Cumulative Permits Data", [{ "Cumulative Value": value, "Year Total": total }]));
    const width = container.node().getBoundingClientRect().width, height = 300, radius = Math.min(width, height) / 2 * 0.7, thickness = 22;
    const svg = container.append("svg").attr("viewBox", `0 0 ${width} ${height}`).append("g").attr("transform", `translate(${width / 2},${height / 2})`);
    const arc = d3.arc().innerRadius(radius - thickness).outerRadius(radius).startAngle(0).cornerRadius(10);
    svg.append("path").datum({ endAngle: 2 * Math.PI }).style("fill", "#eef0f3").attr("d", arc);
    const foreground = svg.append("path").datum({ endAngle: 0 }).style("fill", "#C8102E").attr("d", arc);
    foreground.transition().duration(1000).attrTween("d", function(d) {
        const interpolate = d3.interpolate(d.endAngle, 2 * Math.PI * percentage);
        return function(t) { d.endAngle = interpolate(t); return arc(d); };
    });
    const valueText = svg.append("text").attr("text-anchor", "middle").attr("dy", "0.05em").style("font-size", "44px").style("font-weight", "700").style("fill", "var(--dark-text)");
    valueText.transition().duration(1000).tween("text", function() {
        const interpolate = d3.interpolate(0, value);
        return function(t) { this.textContent = d3.format(",.0f")(interpolate(t)); };
    });
    svg.append("text").attr("text-anchor", "middle").attr("dy", "2.2em").style("font-size", "14px").style("fill", "#666").text("Permits YTD");
}

function drawObservationsTrendChart(data) {
    const selector = "#observations-chart-container";
    const container = d3.select(selector).html("");
    const kpiKey = "HSE_Observation";
    const fullPerformanceData = Object.values(ALL_DATA.performance);
    if (data.length === 0) { drawNoData(selector); return; }
    container.on("click", () => showModal("Trend of Safety Observations", data.map(d => ({ Month: monthMapping[d.Month], Observations: d[kpiKey] }))));
    const margin = { top: 20, right: 30, bottom: 40, left: 50 }, width = container.node().getBoundingClientRect().width - margin.left - margin.right, height = 300 - margin.top - margin.bottom;
    const svg = container.append("svg").attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`).append("g").attr("transform", `translate(${margin.left},${margin.top})`);
    const gradient = svg.append("defs").append("linearGradient").attr("id", "area-gradient").attr("x1", "0%").attr("y1", "0%").attr("x2", "0%").attr("y2", "100%");
    gradient.append("stop").attr("offset", "0%").attr("stop-color", "#C8102E").attr("stop-opacity", 0.4);
    gradient.append("stop").attr("offset", "100%").attr("stop-color", "#C8102E").attr("stop-opacity", 0);
    const x = d3.scalePoint().range([0, width]).domain(data.map(d => d.Month)).padding(0.5);
    const y = d3.scaleLinear().domain([0, 110]).range([height, 0]);
    svg.append("g").attr("class", "axis-x").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x));
    svg.append("g").attr("class", "axis-y").call(d3.axisLeft(y));
    const area = d3.area().x(d => x(d.Month)).y0(height).y1(d => y(d[kpiKey])).curve(d3.curveCatmullRom.alpha(0.5));
    svg.append("path").datum(data).attr("class", "area").attr("d", area);
    const line = d3.line().x(d => x(d.Month)).y(d => y(d[kpiKey])).curve(d3.curveCatmullRom.alpha(0.5));
    svg.append("path").datum(data).attr("class", "line").attr("d", line);
}

function setupSidebarToggle() {
    const toggleButton = document.querySelector('.sidebar-toggle');
    const sidebar = document.querySelector('.sidebar');
    if (toggleButton && sidebar) {
        toggleButton.addEventListener('click', () => {
            sidebar.classList.toggle('visible');
        });
    }
}
setupDashboard();
