let data_url = "edu_B_2_2_2.csv";
let geo_url = "taiwan_geo.json";

const DATA_FIELDS = [
    "公立機構總數",
    "私立機構總數",
    "公立學生總數",
    "私立學生總數",
    "機構總數",
    "學生總數"
];

let currentField = DATA_FIELDS[0];
let currentYear = "111";
let geoData, data;

// 只計算機構總數與學生總數，其他直接用原始欄位
function addTotalFields(data) {
    data.forEach(d => {
        // 機構總數 = 公立機構總數 + 私立機構總數
        d["機構總數"] =
            (+d["公立機構總數"] || 0) +
            (+d["私立機構總數"] || 0);

        // 學生總數 = 公立學生總數 + 私立學生總數
        d["學生總數"] =
            (+d["公立學生總數"] || 0) +
            (+d["私立學生總數"] || 0);
    });
}

function updateSelectedInfo(year, county, field, value) {
    const infoDiv = document.getElementById('selected-info');
    if (year && county && field && value !== undefined && value !== null && value !== "") {
        infoDiv.textContent = `學年度：${year}　縣市別：${county}　${field}：${value}`;
    } else {
        infoDiv.textContent = "";
    }
}

function drawMap() {
    const filtered = data.filter(d => d["學年度"] === currentYear);
    const counties = filtered.map(d => d["縣市別"]);
    const values = filtered.map(d => +d[currentField]);

    Plotly.newPlot('myGraph', [{
        type: 'choropleth',
        geojson: geoData,
        locations: counties,
        z: values,
        featureidkey: "properties.COUNTYNAME",
        colorscale: 'YlGnBu',
        colorbar: {title: currentField}
    }], {
        geo: {
            scope: 'asia',
            center: {lon: 121, lat: 23.7},
            projection: {type: 'mercator'},
            fitbounds: "locations"
        },
        margin: {t:0, b:0}
    });

    // 清空選取資訊
    updateSelectedInfo();

    // 點擊地圖事件（不再呼叫 drawLineChart）
    let myGraphDiv = document.getElementById('myGraph');
    myGraphDiv.on('plotly_click', function(eventData) {
        if (eventData && eventData.points && eventData.points.length > 0) {
            let county = eventData.points[0].location;
            let row = data.find(d => d["學年度"] === currentYear && d["縣市別"] === county);
            let value = row ? row[currentField] : "";
            updateSelectedInfo(currentYear, county, currentField, value);
        }
    });
}

// 長條圖頁面：點擊 bar 觸發折線圖
function drawBarChart() {
    const year = document.getElementById('bar-year-select').value;
    const filtered = data.filter(d => d["學年度"] === year);

    const counties = filtered.map(d => d["縣市別"]);
    const publicValues = filtered.map(d => +d["公立機構總數"] || 0);
    const privateValues = filtered.map(d => +d["私立機構總數"] || 0);
    const totalValues = filtered.map(d => +d["機構總數"] || 0);

    Plotly.newPlot('barChart', [
        {
            x: counties,
            y: publicValues,
            name: '公立機構總數',
            type: 'bar',
            marker: {color: '#81d4fa'}
        },
        {
            x: counties,
            y: privateValues,
            name: '私立機構總數',
            type: 'bar',
            marker: {color: '#ffab91'}
        },
        {
            x: counties,
            y: totalValues,
            name: '機構總數',
            type: 'bar',
            marker: {color: '#ffd54f'}
        }
    ], {
        barmode: 'group',
        title: `${year}年各縣市公立、私立及總機構數`,
        xaxis: {title: '縣市別'},
        yaxis: {title: '數量'},
        plot_bgcolor: 'rgba(0,0,0,0)',
        paper_bgcolor: 'rgba(0,0,0,0)'
    });

    // 點擊 bar 顯示該縣市折線圖
    let barDiv = document.getElementById('barChart');
    barDiv.on('plotly_click', function(eventData) {
        if (eventData && eventData.points && eventData.points.length > 0) {
            let county = eventData.points[0].x;
            drawLineChart(county);
        }
    });

    // 預設清空兩個折線圖
    Plotly.purge('lineChartOrg');
    Plotly.purge('lineChartStu');
}

function drawLineChart(county) {
    // 104~113年
    const years = Array.from({length: 10}, (_, i) => (104 + i).toString());

    // 機構類
    const orgFields = ["公立機構總數", "私立機構總數", "機構總數"];
    // 學生類
    const stuFields = ["公立學生總數", "私立學生總數", "學生總數"];

    // 機構折線圖
    let orgTraces = orgFields.map(field => ({
        x: years,
        y: years.map(y => {
            let row = data.find(d => d["學年度"] === y && d["縣市別"] === county);
            if (!row || row[field] === undefined || row[field] === null || row[field].toString().trim() === "" || isNaN(+row[field])) {
                return null;
            }
            return +row[field];
        }),
        mode: 'lines+markers',
        name: field,
        connectgaps: false
    }));

    Plotly.newPlot('lineChartOrg', orgTraces, {
        title: `${county} 機構數104~113年變化`,
        xaxis: {
            title: '學年度',
            type: 'category',
            categoryorder: 'array',
            categoryarray: years
        },
        yaxis: {title: '數量'}
    });

    // 學生折線圖
    let stuTraces = stuFields.map(field => ({
        x: years,
        y: years.map(y => {
            let row = data.find(d => d["學年度"] === y && d["縣市別"] === county);
            if (!row || row[field] === undefined || row[field] === null || row[field].toString().trim() === "" || isNaN(+row[field])) {
                return null;
            }
            return +row[field];
        }),
        mode: 'lines+markers',
        name: field,
        connectgaps: false
    }));

    Plotly.newPlot('lineChartStu', stuTraces, {
        title: `${county} 學生數104~113年變化`,
        xaxis: {
            title: '學年度',
            type: 'category',
            categoryorder: 'array',
            categoryarray: years
        },
        yaxis: {title: '數量'}
    });
}

// 畫圓餅圖
function drawTotalPieChart() {
    const year = document.getElementById('pie-year-select').value;
    const filtered = data.filter(d => d["學年度"] === year);
    const labels = filtered.map(d => d["縣市別"]);
    const values = filtered.map(d => +d["機構總數"] || 0);

    Plotly.newPlot('pieChart', [{
        type: 'pie',
        labels: labels,
        values: values,
        textinfo: 'label+percent',
        hole: 0.3
    }], {
        title: `${year}年各縣市機構總數佔比`,
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)'
    }, {displayModeBar: false});
}

// 畫公立圓餅圖
function drawPublicPieChart() {
    const year = document.getElementById('pie-year-select').value;
    const filtered = data.filter(d => d["學年度"] === year);
    const labels = filtered.map(d => d["縣市別"]);
    const values = filtered.map(d => +d["公立機構總數"] || 0);

    Plotly.newPlot('pieChart', [{
        type: 'pie',
        labels: labels,
        values: values,
        textinfo: 'label+percent',
        hole: 0.3
    }], {
        title: `${year}年各縣市公立機構數佔公立總數比例`,
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)'
    }, {displayModeBar: false});
}

// 畫私立圓餅圖
function drawPrivatePieChart() {
    const year = document.getElementById('pie-year-select').value;
    const filtered = data.filter(d => d["學年度"] === year);
    const labels = filtered.map(d => d["縣市別"]);
    const values = filtered.map(d => +d["私立機構總數"] || 0);

    Plotly.newPlot('pieChart', [{
        type: 'pie',
        labels: labels,
        values: values,
        textinfo: 'label+percent',
        hole: 0.3
    }], {
        title: `${year}年各縣市私立機構數佔私立總數比例`,
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)'
    }, {displayModeBar: false});
}

function drawBubbleChart() {
    const year = document.getElementById('bubble-year-select').value;
    const filtered = data.filter(d => d["學年度"] === year);

    // 計算幼生總數與公立幼生佔比
    const counties = filtered.map(d => d["縣市別"]);
    const public = filtered.map(d => +d["公立學生總數"] || 0);
    const private_ = filtered.map(d => +d["私立學生總數"] || 0);
    const total = filtered.map((d, i) => public[i] + private_[i]);
    const publicRatio = filtered.map((d, i) => total[i] > 0 ? public[i] / total[i] : 0);

    Plotly.newPlot('bubbleChart', [{
        x: counties,
        y: total,
        text: counties.map((c, i) => `${c}<br>幼生總數:${total[i]}<br>公立幼生佔比:${(publicRatio[i]*100).toFixed(1)}%`),
        mode: 'markers',
        marker: {
            size: total.map(v => Math.sqrt(v) * 2), // sqrt縮放避免過大
            color: publicRatio,
            colorscale: 'YlGnBu',
            colorbar: {title: '公立幼生佔比'},
            sizemode: 'area',
            sizeref: 2.0 * Math.max(...total) / (100**2),
            sizemin: 10
        }
    }], {
        title: `${year}年各縣市幼生總數與公立幼生佔比氣泡圖`,
        xaxis: {title: '縣市別', type: 'category'},
        yaxis: {title: '幼生總數'},
        plot_bgcolor: 'rgba(0,0,0,0)',
        paper_bgcolor: 'rgba(0,0,0,0)'
    });
}

Promise.all([
    d3.json('taiwan_geo.json'),
    d3.csv('edu_B_2_2_2.csv')
]).then(([geo, csv]) => {
    geoData = geo;
    data = csv;
    addTotalFields(data);

    drawMap();

    document.querySelectorAll('.data-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentField = btn.dataset.field;
            drawMap();
        });
    });

    document.getElementById('year-select').addEventListener('change', (e) => {
        currentYear = e.target.value;
        drawMap();
    });

    // 圓餅圖預設顯示機構總數佔比
    document.getElementById('show-pie-btn').addEventListener('click', () => {
        document.getElementById('main-screen').style.display = 'none';
        document.getElementById('app-content').style.display = 'block';
        document.getElementById('map-section').style.display = 'none';
        document.getElementById('pie-section').style.display = 'block';
        drawTotalPieChart();
    });

    document.getElementById('pie-year-select').addEventListener('change', () => {
        // 預設顯示機構總數佔比
        drawTotalPieChart();
    });

    document.getElementById('total-pie-btn').addEventListener('click', () => {
        drawTotalPieChart();
    });

    document.getElementById('public-pie-btn').addEventListener('click', () => {
        drawPublicPieChart();
    });

    document.getElementById('private-pie-btn').addEventListener('click', () => {
        drawPrivatePieChart();
    });

    document.getElementById('show-map-btn').onclick = function() {
        document.getElementById('main-screen').style.display = 'none';
        document.getElementById('app-content').style.display = 'block';
        document.getElementById('map-section').style.display = 'block';
        document.getElementById('bar-section').style.display = 'none';
    };
    document.getElementById('show-bar-btn').onclick = function() {
        document.getElementById('main-screen').style.display = 'none';
        document.getElementById('app-content').style.display = 'block';
        document.getElementById('map-section').style.display = 'none';
        document.getElementById('bar-section').style.display = 'flex';
        drawBarChart();
    };
    document.getElementById('back-main1').onclick = function() {
        document.getElementById('main-screen').style.display = 'flex';
        document.getElementById('app-content').style.display = 'none';
        document.getElementById('map-section').style.display = 'none';
    };
    document.getElementById('back-main3').onclick = function() {
        document.getElementById('main-screen').style.display = 'flex';
        document.getElementById('app-content').style.display = 'none';
        document.getElementById('bar-section').style.display = 'none';
    };
    document.getElementById('bar-year-select').addEventListener('change', drawBarChart);

    // 切換頁面按鈕
    document.getElementById('show-bubble-btn').onclick = function() {
        document.getElementById('main-screen').style.display = 'none';
        document.getElementById('app-content').style.display = 'block';
        document.getElementById('map-section').style.display = 'none';
        document.getElementById('bar-section').style.display = 'none';
        document.getElementById('pie-section').style.display = 'none';
        document.getElementById('bubble-section').style.display = 'flex';
        drawBubbleChart();
    };
    document.getElementById('back-main4').onclick = function() {
        document.getElementById('main-screen').style.display = 'flex';
        document.getElementById('app-content').style.display = 'none';
        document.getElementById('bubble-section').style.display = 'none';
    };
    document.getElementById('bubble-year-select').addEventListener('change', drawBubbleChart);
});