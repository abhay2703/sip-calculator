/* ── Helpers ────────────────────────────────────────── */
function formatINR(n) {
    if (n === undefined || n === null) return "₹0";
    return "₹" + new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Math.round(n));
}

function $(id) { return document.getElementById(id); }

/* ── DOM refs ──────────────────────────────────────── */
var elSipAmount, elReturn, elYears, elStepUp, elFundType, elSlabGroup, elSlabRate, elCalcBtn;
var elInvestMode, elStepUpGroup, elAmountLabel, elAmountHint;
var elResults, elChartSection, elTaxBreakdown, elInsights, elStepUpSection;

/* ── Init ──────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", function () {
    elSipAmount    = $("sipAmount");
    elReturn       = $("expectedReturn");
    elYears        = $("investmentYears");
    elStepUp       = $("stepUp");
    elFundType     = document.querySelectorAll('input[name="fundType"]');
    elInvestMode   = document.querySelectorAll('input[name="investMode"]');
    elSlabGroup    = $("slabGroup");
    elSlabRate     = $("slabRate");
    elCalcBtn      = $("calculateBtn");
    elStepUpGroup  = $("stepUpGroup");
    elAmountLabel  = $("amountLabel");
    elAmountHint   = $("amountHint");

    elResults        = $("resultsSection");
    elChartSection   = $("chartSection");
    elTaxBreakdown   = $("taxBreakdownSection");
    elInsights       = $("insightsSection");
    elStepUpSection  = $("stepUpSection");

    buildSlabOptions();

    elFundType.forEach(function (radio) {
        radio.addEventListener("change", function () {
            elSlabGroup.style.display = this.value === "debt" ? "" : "none";
        });
    });

    elInvestMode.forEach(function (radio) {
        radio.addEventListener("change", onModeChange);
    });

    elCalcBtn.addEventListener("click", runCalculation);
    elSipAmount.addEventListener("input", formatAmountInput);

    document.querySelectorAll(".accordion-header").forEach(function (header) {
        header.addEventListener("click", function () {
            this.parentElement.classList.toggle("open");
        });
    });
});

/* ── Mode toggle ───────────────────────────────────── */
function getMode() {
    var mode = "sip";
    elInvestMode.forEach(function (r) { if (r.checked) mode = r.value; });
    return mode;
}

function onModeChange() {
    var isLumpsum = getMode() === "lumpsum";
    elAmountLabel.textContent = isLumpsum ? "Investment Amount" : "Monthly SIP Amount";
    elAmountHint.textContent  = isLumpsum ? "One-time investment amount" : "Minimum ₹100";
    elSipAmount.placeholder   = isLumpsum ? "5,00,000" : "10,000";
    elStepUpGroup.style.display = isLumpsum ? "none" : "";
}

/* ── Slab dropdown ─────────────────────────────────── */
function buildSlabOptions() {
    TAX_CONFIG.debt.slabOptions.forEach(function (opt) {
        var o = document.createElement("option");
        o.value = opt.rate;
        o.textContent = opt.label;
        if (opt.rate === TAX_CONFIG.debt.defaultSlabRate) o.selected = true;
        elSlabRate.appendChild(o);
    });
}

/* ── Format amount with commas ─────────────────────── */
function formatAmountInput() {
    var raw = this.value.replace(/[^0-9]/g, "");
    if (raw === "") { this.value = ""; return; }
    this.value = new Intl.NumberFormat("en-IN").format(Number(raw));
}

function parseAmount() {
    return Number(elSipAmount.value.replace(/[^0-9]/g, ""));
}

/* ── Validation ────────────────────────────────────── */
function validate() {
    var errors = [];
    var amount = parseAmount();
    var ret = parseFloat(elReturn.value);
    var yrs = parseInt(elYears.value, 10);
    var mode = getMode();
    var stepUp = mode === "sip" ? (parseFloat(elStepUp.value) || 0) : 0;

    if (!amount || amount < 100)  errors.push("Investment amount must be at least ₹100.");
    if (isNaN(ret) || ret <= 0 || ret > 50) errors.push("Expected return should be between 0.1% and 50%.");
    if (isNaN(yrs) || yrs < 1 || yrs > 50) errors.push("Investment duration should be between 1 and 50 years.");
    if (mode === "sip" && (stepUp < 0 || stepUp > 50)) errors.push("Annual step-up should be between 0% and 50%.");

    if (errors.length) {
        showValidationErrors(errors);
        return null;
    }
    clearValidationErrors();

    var fundType = "equity";
    elFundType.forEach(function (r) { if (r.checked) fundType = r.value; });

    return {
        monthlyAmount: amount,
        annualReturn: ret,
        years: yrs,
        stepUp: stepUp,
        fundType: fundType,
        mode: mode,
        debtSlabRate: fundType === "debt" ? parseFloat(elSlabRate.value) : undefined
    };
}

function showValidationErrors(msgs) {
    var box = $("validationErrors");
    box.innerHTML = msgs.map(function (m) { return "<p>" + m + "</p>"; }).join("");
    box.classList.remove("hidden");
}
function clearValidationErrors() {
    var box = $("validationErrors");
    box.innerHTML = "";
    box.classList.add("hidden");
}

/* ── Main calculation ──────────────────────────────── */
function runCalculation() {
    var params = validate();
    if (!params) return;

    var result = params.mode === "lumpsum" ? calculateLumpsum(params) : calculateSIP(params);

    renderResultCards(result);
    renderChart(result);
    renderTaxBreakdown(result);
    renderInsights(result);
    renderStepUpTable(result);

    elResults.style.display = "";
    elChartSection.style.display = "";
    elTaxBreakdown.style.display = "";
    elInsights.style.display = "";

    elResults.scrollIntoView({ behavior: "smooth", block: "start" });
}

/* ── Result cards ──────────────────────────────────── */
function renderResultCards(r) {
    $("resInvested").textContent   = formatINR(r.totalInvested);
    $("resGains").textContent      = formatINR(r.totalGains);
    $("resTax").textContent        = formatINR(r.totalTax);
    $("resPreTax").textContent     = formatINR(r.totalCorpus);
    $("resPostTax").textContent    = formatINR(r.postTaxCorpus);

    var gainPct = r.totalInvested > 0 ? ((r.totalGains / r.totalInvested) * 100).toFixed(1) : "0";
    $("resGainsPct").textContent = "+" + gainPct + "% absolute return";

    var taxPct = r.totalGains > 0 ? ((r.totalTax / r.totalGains) * 100).toFixed(1) : "0";
    $("resTaxPct").textContent = taxPct + "% of gains";

    var investedSub = $("resInvestedSub");
    if (r.stepUp > 0 && r.mode === "sip") {
        investedSub.textContent = formatINR(r.monthlyAmount) + "/mo → " + formatINR(r.finalMonthlySIP) + "/mo (step-up " + r.stepUp + "%)";
        investedSub.style.display = "";
    } else {
        investedSub.style.display = "none";
    }
}

/* ── Step-up yearly table ──────────────────────────── */
function renderStepUpTable(r) {
    if (r.mode !== "sip" || r.stepUp <= 0) {
        elStepUpSection.style.display = "none";
        return;
    }

    var html = '<table class="step-up-table"><thead><tr>';
    html += '<th>Year</th><th>Monthly SIP</th><th>Annual Investment</th><th>Cumulative</th>';
    html += '</tr></thead><tbody>';

    var cumulative = 0;
    for (var y = 1; y <= r.years; y++) {
        var monthly = r.monthlyAmount * Math.pow(1 + r.stepUp / 100, y - 1);
        var annual = monthly * 12;
        cumulative += annual;
        html += '<tr><td>' + y + '</td>';
        html += '<td>' + formatINR(monthly) + '</td>';
        html += '<td>' + formatINR(annual) + '</td>';
        html += '<td>' + formatINR(cumulative) + '</td></tr>';
    }

    html += '</tbody></table>';
    $("stepUpTableContent").innerHTML = html;
    elStepUpSection.style.display = "";
}

/* ── Tax breakdown ─────────────────────────────────── */
function renderTaxBreakdown(r) {
    var html = "";
    var tb = r.taxBreakdown;
    var isEquity = r.fundType === "equity";
    var config = TAX_CONFIG[r.fundType];
    var isLumpsum = r.mode === "lumpsum";

    html += '<h3>Tax Calculation Breakdown</h3>';
    html += '<table class="tax-table"><tbody>';

    if (isEquity) {
        html += row("Fund Type", config.label);
        html += row("Investment Mode", isLumpsum ? "Lumpsum" : "SIP");
        html += row("Investment Duration", r.years + " years (" + r.months + " months)");

        if (isLumpsum) {
            var holdingType = r.months >= config.holdingPeriodThreshold ? "LTCG" : "STCG";
            html += row("Holding Classification", holdingType + " (held " + r.months + " months)");
            html += rowSep();
            if (tb.ltcgGains > 0) {
                html += rowBold("Long Term Capital Gains (LTCG)");
                html += row("LTCG Amount", formatINR(tb.ltcgGains));
                html += row("Annual Exemption (₹1.25L)", "−" + formatINR(tb.ltcgExemptionUsed));
                html += row("Taxable LTCG", formatINR(tb.taxableLTCG));
                html += row("LTCG Tax Rate", (tb.ltcgRate * 100) + "%");
                html += row("LTCG Tax", formatINR(tb.ltcgTax));
            } else {
                html += rowBold("Short Term Capital Gains (STCG)");
                html += row("STCG Amount", formatINR(tb.stcgGains));
                html += row("STCG Tax Rate", (tb.stcgRate * 100) + "%");
                html += row("STCG Tax", formatINR(tb.stcgTax));
            }
        } else {
            html += rowSep();
            html += rowBold("Short Term Capital Gains (STCG)");
            html += row("STCG Installments", tb.stcgInstallments + " (last " + tb.stcgInstallments + " months)");
            html += row("STCG Amount", formatINR(tb.stcgGains));
            html += row("STCG Tax Rate", (tb.stcgRate * 100) + "%");
            html += row("STCG Tax", formatINR(tb.stcgTax));
            html += rowSep();
            html += rowBold("Long Term Capital Gains (LTCG)");
            html += row("LTCG Installments", tb.ltcgInstallments + " (first " + tb.ltcgInstallments + " months)");
            html += row("LTCG Amount", formatINR(tb.ltcgGains));
            html += row("Annual Exemption (₹1.25L)", "−" + formatINR(tb.ltcgExemptionUsed));
            html += row("Taxable LTCG", formatINR(tb.taxableLTCG));
            html += row("LTCG Tax Rate", (tb.ltcgRate * 100) + "%");
            html += row("LTCG Tax", formatINR(tb.ltcgTax));
        }
        html += rowSep();
        html += row("Base Tax", formatINR(tb.baseTax));
        html += row("Cess @ " + (tb.cessRate * 100) + "%", formatINR(tb.cess));
        html += rowHighlight("Total Estimated Tax", formatINR(r.totalTax));
    } else {
        html += row("Fund Type", config.label);
        html += row("Investment Mode", isLumpsum ? "Lumpsum" : "SIP");
        html += row("Investment Duration", r.years + " years (" + r.months + " months)");
        html += row("Total Gains", formatINR(tb.totalGains));
        html += row("Applied Slab Rate", (tb.slabRate * 100) + "%");
        html += row("Base Tax", formatINR(tb.baseTax));
        html += row("Cess @ " + (tb.cessRate * 100) + "%", formatINR(tb.cess));
        html += rowHighlight("Total Estimated Tax", formatINR(r.totalTax));
    }

    html += "</tbody></table>";

    html += '<div class="assumptions">';
    html += "<strong>Assumptions Used</strong><ul>";
    if (!isLumpsum && r.stepUp > 0) {
        html += "<li>Monthly SIP increases by " + r.stepUp + "% every year (from " + formatINR(r.monthlyAmount) + " to " + formatINR(r.finalMonthlySIP) + "/month).</li>";
    }
    if (isLumpsum) {
        html += "<li>One-time investment of " + formatINR(r.totalInvested) + " held for " + r.years + " years.</li>";
    }
    html += "<li>All units are redeemed at the end of the investment period (lump-sum redemption).</li>";
    if (isEquity) {
        html += "<li>LTCG exemption of ₹1.25 lakh is applied once (single financial-year redemption).</li>";
        if (!isLumpsum) {
            html += "<li>Installments held ≥ 12 months → LTCG; held &lt; 12 months → STCG.</li>";
        }
    } else {
        html += "<li>Post April 2023 debt-fund tax rules applied — gains taxed at income tax slab rate, no indexation.</li>";
    }
    html += "<li>Surcharge is not included; actual tax may be higher for high-income individuals.</li>";
    html += "<li>4% Health &amp; Education Cess is included on the tax amount.</li>";
    html += "<li>Tax rules as per " + TAX_CONFIG.applicableFrom + " (" + TAX_CONFIG.budgetReference + ").</li>";
    html += "</ul></div>";

    $("taxBreakdownContent").innerHTML = html;
}

function row(label, value) {
    return '<tr><td>' + label + '</td><td class="val">' + value + '</td></tr>';
}
function rowBold(label) {
    return '<tr><td colspan="2" class="section-label">' + label + '</td></tr>';
}
function rowSep() {
    return '<tr class="sep"><td colspan="2"></td></tr>';
}
function rowHighlight(label, value) {
    return '<tr class="highlight"><td>' + label + '</td><td class="val">' + value + '</td></tr>';
}

/* ── Insights ──────────────────────────────────────── */
function renderInsights(result) {
    var items = generateInsights(result);
    var iconMap = {
        tax: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 3h-8l-2 4h12z"/></svg>',
        clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
        chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>',
        info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>'
    };

    var html = items.map(function (item) {
        var svg = iconMap[item.icon] || iconMap.info;
        return '<div class="insight-card">' +
            '<div class="insight-icon">' + svg + '</div>' +
            '<div class="insight-body"><h4>' + item.title + '</h4><p>' + item.text + '</p></div>' +
            '</div>';
    }).join("");

    $("insightsContent").innerHTML = html;
}
