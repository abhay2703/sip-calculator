var sipChart = null;
var growthChart = null;

function renderChart(result, growthData) {
    renderDoughnut(result);
    renderGrowthChart(growthData);
}

function renderDoughnut(result) {
    var canvas = document.getElementById("sipChart");
    if (!canvas) return;
    var ctx = canvas.getContext("2d");

    var invested = result.totalInvested;
    var netGains = result.totalGains - result.totalTax;
    var tax = result.totalTax;

    if (sipChart) {
        sipChart.data.datasets[0].data = [invested, netGains, tax];
        sipChart.options.plugins.title.text = "Post-Tax Corpus: " + formatINR(result.postTaxCorpus);
        sipChart.update();
        return;
    }

    sipChart = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: ["Amount Invested", "Gains (After Tax)", "Estimated Tax"],
            datasets: [{
                data: [invested, netGains, tax],
                backgroundColor: ["#3b82f6", "#10b981", "#ef4444"],
                borderColor: "#ffffff",
                borderWidth: 3,
                hoverOffset: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            cutout: "62%",
            layout: { padding: 8 },
            plugins: {
                title: {
                    display: true,
                    text: "Post-Tax Corpus: " + formatINR(result.postTaxCorpus),
                    font: { size: 14, weight: "600", family: "'Inter', sans-serif" },
                    color: "#1e293b",
                    padding: { bottom: 12 }
                },
                legend: {
                    position: "bottom",
                    labels: {
                        padding: 14,
                        usePointStyle: true,
                        pointStyleWidth: 10,
                        font: { size: 12, family: "'Inter', sans-serif" },
                        color: "#475569"
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            var val = context.parsed;
                            var total = context.dataset.data.reduce(function (a, b) { return a + b; }, 0);
                            var pct = ((val / total) * 100).toFixed(1);
                            return " " + context.label + ": " + formatINR(val) + " (" + pct + "%)";
                        }
                    },
                    bodyFont: { family: "'Inter', sans-serif" }
                }
            }
        }
    });
}

function renderGrowthChart(data) {
    var canvas = document.getElementById("growthChart");
    if (!canvas) return;
    var ctx = canvas.getContext("2d");

    var labels = data.map(function (d) { return "Year " + d.year; });
    labels[0] = "Start";
    var investedData = data.map(function (d) { return d.invested; });
    var corpusData = data.map(function (d) { return d.corpus; });

    if (growthChart) {
        growthChart.data.labels = labels;
        growthChart.data.datasets[0].data = corpusData;
        growthChart.data.datasets[1].data = investedData;
        growthChart.update();
        return;
    }

    growthChart = new Chart(ctx, {
        type: "line",
        data: {
            labels: labels,
            datasets: [
                {
                    label: "Corpus Value",
                    data: corpusData,
                    borderColor: "#10b981",
                    backgroundColor: "rgba(16, 185, 129, 0.1)",
                    fill: true,
                    tension: 0.3,
                    pointRadius: 3,
                    pointHoverRadius: 6,
                    borderWidth: 2.5
                },
                {
                    label: "Amount Invested",
                    data: investedData,
                    borderColor: "#3b82f6",
                    backgroundColor: "rgba(59, 130, 246, 0.08)",
                    fill: true,
                    tension: 0.1,
                    pointRadius: 3,
                    pointHoverRadius: 6,
                    borderWidth: 2.5
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            interaction: { mode: "index", intersect: false },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function (val) {
                            if (val >= 10000000) return "₹" + (val / 10000000).toFixed(1) + "Cr";
                            if (val >= 100000) return "₹" + (val / 100000).toFixed(1) + "L";
                            if (val >= 1000) return "₹" + (val / 1000).toFixed(0) + "K";
                            return "₹" + val;
                        },
                        font: { size: 11, family: "'Inter', sans-serif" },
                        color: "#94a3b8"
                    },
                    grid: { color: "rgba(0,0,0,0.04)" }
                },
                x: {
                    ticks: {
                        font: { size: 11, family: "'Inter', sans-serif" },
                        color: "#94a3b8",
                        maxRotation: 0
                    },
                    grid: { display: false }
                }
            },
            plugins: {
                legend: {
                    position: "bottom",
                    labels: {
                        padding: 16,
                        usePointStyle: true,
                        pointStyleWidth: 10,
                        font: { size: 12, family: "'Inter', sans-serif" },
                        color: "#475569"
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return " " + context.dataset.label + ": " + formatINR(context.parsed.y);
                        }
                    },
                    bodyFont: { family: "'Inter', sans-serif" }
                }
            }
        }
    });
}
