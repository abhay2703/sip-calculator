function generateInsights(result) {
    var insights = [];
    var totalGains = result.totalGains;
    var totalTax = result.totalTax;
    var totalCorpus = result.totalCorpus;
    var postTaxCorpus = result.postTaxCorpus;
    var fundType = result.fundType;
    var years = result.years;
    var tb = result.taxBreakdown;

    if (totalGains <= 0) {
        return [{
            icon: "info",
            title: "No Gains to Tax",
            text: "With the inputs provided, the estimated gains are negligible. Consider reviewing your expected return rate or investment duration."
        }];
    }

    var taxPercent = (totalTax / totalGains * 100).toFixed(1);
    var wealthGap = totalCorpus - postTaxCorpus;

    // Insight 1 — tax impact on gains
    insights.push({
        icon: "tax",
        title: "Tax Impact on Your Returns",
        text: "Approximately " + taxPercent + "% of your estimated gains (" +
            formatINR(totalTax) + " out of " + formatINR(totalGains) +
            ") may go towards taxes. Factoring in taxes helps set realistic wealth-creation expectations."
    });

    // Insight 2 — fund-type and duration specific
    if (fundType === "equity") {
        if (years <= 1) {
            insights.push({
                icon: "clock",
                title: "Shorter Holding Means Higher Tax",
                text: "All your gains are classified as Short Term Capital Gains and taxed at 20%. " +
                    "Investments held for over 12 months qualify for the lower LTCG rate of 12.5%, " +
                    "with an annual exemption of ₹1.25 lakh. A longer horizon could improve tax efficiency."
            });
        } else {
            var ltcgPct = totalGains > 0 ? (tb.ltcgGains / totalGains * 100).toFixed(0) : 0;
            insights.push({
                icon: "clock",
                title: "Long-Term Holding Advantage",
                text: "With a " + years + "-year horizon, roughly " + ltcgPct +
                    "% of your gains qualify for the lower LTCG rate of 12.5% instead of the 20% STCG rate. " +
                    "The last 11 monthly installments are always taxed at the STCG rate because they are held for less than 12 months."
            });
        }
    } else {
        insights.push({
            icon: "info",
            title: "Debt Fund Tax Change (Post April 2023)",
            text: "Debt mutual fund gains are now taxed at your income tax slab rate without indexation benefit. " +
                "If your actual tax slab is lower than the rate used here, your real tax outgo could be less. " +
                "Consult a tax professional for your specific situation."
        });
    }

    // Insight 3 — pre-tax vs post-tax wealth gap
    insights.push({
        icon: "chart",
        title: "Pre-Tax vs Post-Tax Wealth",
        text: "Your pre-tax corpus is " + formatINR(totalCorpus) + " but the estimated take-home is " +
            formatINR(postTaxCorpus) + " — a gap of " + formatINR(wealthGap) +
            ". Planning around post-tax returns gives a more accurate picture of the wealth you can actually use."
    });

    return insights;
}
