var sipChart = null;

function renderChart(result) {
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
                    font: { size: 15, weight: "600", family: "'Inter', sans-serif" },
                    color: "#1e293b",
                    padding: { bottom: 12 }
                },
                legend: {
                    position: "bottom",
                    labels: {
                        padding: 16,
                        usePointStyle: true,
                        pointStyleWidth: 10,
                        font: { size: 13, family: "'Inter', sans-serif" },
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
