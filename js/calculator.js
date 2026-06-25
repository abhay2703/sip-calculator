function calculateSIP(params) {
    var baseAmount = params.monthlyAmount;
    var annualReturn = params.annualReturn;
    var years = params.years;
    var fundType = params.fundType;
    var debtSlabRate = params.debtSlabRate;
    var stepUpPct = params.stepUp || 0;
    var isYearly = params.mode === "yearly";

    var monthlyRate = annualReturn / 100 / 12;
    var config = TAX_CONFIG[fundType];
    var holdingThreshold = config.holdingPeriodThreshold;

    var totalInvested = 0;
    var totalCorpus = 0;
    var stcgGains = 0;
    var ltcgGains = 0;
    var finalSIP = baseAmount;
    var totalMonths = years * 12;

    if (isYearly) {
        for (var y = 1; y <= years; y++) {
            var currentSIP = baseAmount * Math.pow(1 + stepUpPct / 100, y - 1);
            var holdingMonths = (years - y + 1) * 12;
            var futureValue = currentSIP * Math.pow(1 + monthlyRate, holdingMonths);
            var gain = futureValue - currentSIP;

            totalInvested += currentSIP;
            totalCorpus += futureValue;

            if (fundType === "equity") {
                if (holdingMonths >= holdingThreshold) {
                    ltcgGains += gain;
                } else {
                    stcgGains += gain;
                }
            }
            if (y === years) finalSIP = currentSIP;
        }
    } else {
        for (var i = 1; i <= totalMonths; i++) {
            var yearIndex = Math.floor((i - 1) / 12);
            var currentSIP = baseAmount * Math.pow(1 + stepUpPct / 100, yearIndex);
            var holdingMonths = totalMonths - i + 1;
            var futureValue = currentSIP * Math.pow(1 + monthlyRate, holdingMonths);
            var gain = futureValue - currentSIP;

            totalInvested += currentSIP;
            totalCorpus += futureValue;

            if (fundType === "equity") {
                if (holdingMonths >= holdingThreshold) {
                    ltcgGains += gain;
                } else {
                    stcgGains += gain;
                }
            }
            if (i === totalMonths) finalSIP = currentSIP;
        }
    }

    return buildResult({
        totalInvested: totalInvested,
        totalCorpus: totalCorpus,
        stcgGains: stcgGains,
        ltcgGains: ltcgGains,
        fundType: fundType,
        debtSlabRate: debtSlabRate,
        years: years,
        months: totalMonths,
        monthlyAmount: baseAmount,
        finalMonthlySIP: Math.round(finalSIP),
        stepUp: stepUpPct,
        annualReturn: annualReturn,
        mode: params.mode
    });
}

function calculateLumpsum(params) {
    var principal = params.monthlyAmount;
    var annualReturn = params.annualReturn;
    var years = params.years;
    var fundType = params.fundType;
    var debtSlabRate = params.debtSlabRate;

    var config = TAX_CONFIG[fundType];
    var monthlyRate = annualReturn / 100 / 12;
    var holdingMonths = years * 12;
    var totalCorpus = principal * Math.pow(1 + monthlyRate, holdingMonths);
    var totalGains = totalCorpus - principal;

    var stcgGains = 0;
    var ltcgGains = 0;

    if (fundType === "equity") {
        if (holdingMonths >= config.holdingPeriodThreshold) {
            ltcgGains = totalGains;
        } else {
            stcgGains = totalGains;
        }
    }

    return buildResult({
        totalInvested: principal,
        totalCorpus: totalCorpus,
        stcgGains: stcgGains,
        ltcgGains: ltcgGains,
        fundType: fundType,
        debtSlabRate: debtSlabRate,
        years: years,
        months: holdingMonths,
        monthlyAmount: principal,
        finalMonthlySIP: 0,
        stepUp: 0,
        annualReturn: annualReturn,
        mode: "lumpsum"
    });
}

function generateGrowthData(params) {
    var monthlyRate = params.annualReturn / 100 / 12;
    var stepUpPct = params.stepUp || 0;
    var data = [{ year: 0, invested: 0, corpus: 0 }];

    for (var y = 1; y <= params.years; y++) {
        var invested = 0;
        var corpus = 0;
        var monthsElapsed = y * 12;

        if (params.mode === "lumpsum") {
            invested = params.monthlyAmount;
            corpus = params.monthlyAmount * Math.pow(1 + monthlyRate, monthsElapsed);
        } else if (params.mode === "yearly") {
            for (var yi = 1; yi <= y; yi++) {
                var amount = params.monthlyAmount * Math.pow(1 + stepUpPct / 100, yi - 1);
                var holdMonths = (y - yi + 1) * 12;
                invested += amount;
                corpus += amount * Math.pow(1 + monthlyRate, holdMonths);
            }
        } else {
            for (var m = 1; m <= monthsElapsed; m++) {
                var yearIdx = Math.floor((m - 1) / 12);
                var amount = params.monthlyAmount * Math.pow(1 + stepUpPct / 100, yearIdx);
                invested += amount;
                corpus += amount * Math.pow(1 + monthlyRate, monthsElapsed - m + 1);
            }
        }

        data.push({ year: y, invested: Math.round(invested), corpus: Math.round(corpus) });
    }

    return data;
}

function buildResult(r) {
    var totalGains = r.totalCorpus - r.totalInvested;
    var config = TAX_CONFIG[r.fundType];
    var taxBreakdown = {};
    var totalTax = 0;

    if (r.fundType === "equity") {
        var stcgTax = r.stcgGains * config.stcg.rate;
        var ltcgExemptionUsed = Math.min(r.ltcgGains, config.ltcg.exemptionPerYear);
        var taxableLTCG = Math.max(0, r.ltcgGains - config.ltcg.exemptionPerYear);
        var ltcgTax = taxableLTCG * config.ltcg.rate;
        var baseTax = stcgTax + ltcgTax;
        var cess = baseTax * TAX_CONFIG.cess.rate;
        totalTax = baseTax + cess;

        var stcgInstallments = r.mode === "lumpsum" || r.mode === "yearly" ? 0 :
            Math.min(r.months, config.holdingPeriodThreshold - 1);
        var ltcgInstallments = r.mode === "lumpsum" || r.mode === "yearly" ? 0 :
            Math.max(0, r.months - stcgInstallments);

        taxBreakdown = {
            stcgGains: Math.round(r.stcgGains),
            ltcgGains: Math.round(r.ltcgGains),
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
        var slabRate = r.debtSlabRate !== undefined ? r.debtSlabRate : config.defaultSlabRate;
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
        totalInvested: Math.round(r.totalInvested),
        totalCorpus: Math.round(r.totalCorpus),
        totalGains: Math.round(totalGains),
        stcgGains: Math.round(r.stcgGains),
        ltcgGains: Math.round(r.ltcgGains),
        totalTax: Math.round(totalTax),
        postTaxCorpus: Math.round(r.totalCorpus - totalTax),
        taxBreakdown: taxBreakdown,
        fundType: r.fundType,
        years: r.years,
        months: r.months,
        monthlyAmount: r.monthlyAmount,
        finalMonthlySIP: r.finalMonthlySIP,
        stepUp: r.stepUp,
        annualReturn: r.annualReturn,
        mode: r.mode
    };
}
