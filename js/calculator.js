function calculateSIP(params) {
    var monthlyAmount = params.monthlyAmount;
    var annualReturn = params.annualReturn;
    var years = params.years;
    var fundType = params.fundType;
    var debtSlabRate = params.debtSlabRate;

    var months = years * 12;
    var monthlyRate = annualReturn / 100 / 12;
    var config = TAX_CONFIG[fundType];
    var holdingThreshold = config.holdingPeriodThreshold;

    var totalInvested = 0;
    var totalCorpus = 0;
    var stcgGains = 0;
    var ltcgGains = 0;

    for (var i = 1; i <= months; i++) {
        var holdingMonths = months - i + 1;
        var futureValue = monthlyAmount * Math.pow(1 + monthlyRate, holdingMonths);
        var gain = futureValue - monthlyAmount;

        totalInvested += monthlyAmount;
        totalCorpus += futureValue;

        if (fundType === "equity") {
            if (holdingMonths >= holdingThreshold) {
                ltcgGains += gain;
            } else {
                stcgGains += gain;
            }
        }
    }

    var totalGains = totalCorpus - totalInvested;
    var taxBreakdown = {};
    var totalTax = 0;

    if (fundType === "equity") {
        var stcgTax = stcgGains * config.stcg.rate;
        var ltcgExemptionUsed = Math.min(ltcgGains, config.ltcg.exemptionPerYear);
        var taxableLTCG = Math.max(0, ltcgGains - config.ltcg.exemptionPerYear);
        var ltcgTax = taxableLTCG * config.ltcg.rate;
        var baseTax = stcgTax + ltcgTax;
        var cess = baseTax * TAX_CONFIG.cess.rate;
        totalTax = baseTax + cess;

        var stcgInstallments = Math.min(months, holdingThreshold - 1);
        var ltcgInstallments = Math.max(0, months - stcgInstallments);

        taxBreakdown = {
            stcgGains: Math.round(stcgGains),
            ltcgGains: Math.round(ltcgGains),
            ltcgExemptionUsed: Math.round(ltcgExemptionUsed),
            taxableLTCG: Math.round(taxableLTCG),
            stcgTax: Math.round(stcgTax),
            ltcgTax: Math.round(ltcgTax),
            baseTax: Math.round(baseTax),
            cess: Math.round(cess),
            stcgRate: config.stcg.rate,
            ltcgRate: config.ltcg.rate,
            cessRate: TAX_CONFIG.cess.rate,
            stcgInstallments: stcgInstallments,
            ltcgInstallments: ltcgInstallments
        };
    } else {
        var slabRate = debtSlabRate !== undefined ? debtSlabRate : config.defaultSlabRate;
        var baseTax = totalGains * slabRate;
        var cess = baseTax * TAX_CONFIG.cess.rate;
        totalTax = baseTax + cess;

        taxBreakdown = {
            totalGains: Math.round(totalGains),
            slabRate: slabRate,
            baseTax: Math.round(baseTax),
            cess: Math.round(cess),
            cessRate: TAX_CONFIG.cess.rate
        };
    }

    return {
        totalInvested: Math.round(totalInvested),
        totalCorpus: Math.round(totalCorpus),
        totalGains: Math.round(totalGains),
        stcgGains: Math.round(stcgGains),
        ltcgGains: Math.round(ltcgGains),
        totalTax: Math.round(totalTax),
        postTaxCorpus: Math.round(totalCorpus - totalTax),
        taxBreakdown: taxBreakdown,
        fundType: fundType,
        years: years,
        months: months,
        monthlyAmount: monthlyAmount,
        annualReturn: annualReturn
    };
}
