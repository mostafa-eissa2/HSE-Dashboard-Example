// =================================================================
// SECTION 1: RAW DATA SECTIONS
// لإضافة بيانات شهر جديد، قم بإضافتها هنا. تأكد من تحديث السطر الأول (Header) أيضاً.
// =================================================================

const permits_csv = `
المشروع,Jan,Feb,Mar,Apr,May,Jun,Jul
التحكم الاقليمي,20,29,14,21,11,0,18
الحي الحكومي,1,1,2,0,0,0,2
الحي الدبلوماسي,32,29,23,12,17,24,81
العلمين,53,62,21,99,101,46,113
الفردوس,59,44,11,16,66,6,1
الكيان العسكري,47,36,22,27,25,27,50
حياة كريمة الفيوم,148,127,116,122,111,113,99
حياة كريمة المنيا,111,60,38,68,84,32,46
حياة كريمة أرمنت,33,22,10,5,1,0,0
حياة كريمة أسنا,19,12,1,0,10,3,6
حياة كريمة أسوان,88,54,29,23,33,20,30
حياة كريمة صدفا,14,8,5,5,1,6,1
حياة كريمة مطوبس,14,11,3,16,10,1,0
حياة كريمة منفلوط,23,14,45,9,9,15,6
دهشور,57,50,10,76,66,19,7
سانت كاترين,61,45,32,35,68,14,20
ميناء الدخيلة,87,22,6,7,5,9,7
سوهاج,20,26,24,26,29,24,63
التوسعات الشرقية,0,0,0,0,0,0,0
أبو قير,1,0,0,1,1,1,0
العبور,0,0,0,11,14,16,16
العاشر من رمضان,0,0,0,0,0,2,9
`;
const parties_csv = `
Column1,Jan,Feb,Mar,Apr,May,Jun,Jul
المقاول,535,402,227,334,388,186,323
المخازن,71,54,39,59,69,54,58
قسم الجودة,35,22,18,22,30,23,27
قسم المساحة,47,24,8,18,23,8,36
قسم تنفيذ الكهرباء,196,148,118,146,152,106,126
قسم المدني,4,2,2,0,0,1,5
`;
const delays_csv = `
Category,Jan,Feb,Mar,Apr,May,Jun,Jul
Delays,588,431,245,381,443,315,476
On Time,300,221,167,198,219,63,99
`;
const shifts_csv = `
Category,Jan,Feb,Mar,Apr,May,Jun,Jul
DAY,862,622,398,549,643,371,557
NIGHT,26,30,14,30,19,7,18
`;
const compliance_csv = `
Category,Jan,Feb,Mar,Apr,May,Jun,Jul
Compliance,0.34,0.34,0.41,0.34,0.33,0.17,0.17
`;
const performance_csv = `
Month,HSE_Observation
Jan,107
Feb,58
Mar,82
Apr,85
May,84
Jun,47
Jul,80
`;
const manpower_csv = `
Month,Worked Hours Sewedy,Worked Hours Sub,LTI,MTC,Property Damage
Jan,51331,80716,0,0,0
Feb,75596,62600,0,0,1
Mar,64069,52523,0,0,0
Apr,69775,60529,0,0,4
May,73455,7126,0,1,1
Jun,61436,52194,0,0,0
Jul,68975,61305,0,1,0
`;
const training_csv = `
Month,Emp Manpower,Total Training
Jan,467,716
Feb,467,471
Mar,455,465
Apr,438,600
May,424,695
Jun,427,339
Jul,407,553
`;
const inductions_csv = `
Month,Total
Jan,192
Feb,110
Mar,74
Apr,205
May,160
Jun,109
Jul,168
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
        animateValue("kpi-total-hours", 3285917);
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
    const color = d3.scaleOrdinal(["#C8102E", "#2C2A29"]);
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
    const color = d3.scaleOrdinal(["#C8102E", "#2C2A29"]);
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