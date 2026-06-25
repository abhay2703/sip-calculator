function generateInsights(result) {
    var pool = [];
    var totalGains = result.totalGains;
    var totalTax = result.totalTax;
    var totalInvested = result.totalInvested;
    var totalCorpus = result.totalCorpus;
    var postTaxCorpus = result.postTaxCorpus;
    var fundType = result.fundType;
    var years = result.years;
    var tb = result.taxBreakdown;
    var mode = result.mode;
    var stepUp = result.stepUp;

    if (totalGains <= 0) {
        return [{
            icon: "info", title: "No Gains to Tax",
            text: "With the inputs provided, the estimated gains are negligible. Consider reviewing your expected return rate or investment duration."
        }];
    }

    var taxPct = totalTax / totalGains * 100;
    var gainsMultiple = totalGains / totalInvested;
    var wealthGap = totalCorpus - postTaxCorpus;

    // ── Tax severity insights ──
    if (taxPct > 25) {
        pool.push({ score: 90, icon: "tax", title: "High Tax Impact",
            text: "Taxes are consuming about " + taxPct.toFixed(1) + "% of your gains (" + formatINR(totalTax) +
                "). This is significant. " + (fundType === "debt"
                    ? "Debt funds at higher slab rates face steeper taxation. If your actual slab is lower, the impact reduces."
                    : "For equity, this is often driven by a large STCG component. Holding longer shifts more gains to the lower LTCG rate.")
        });
    } else if (taxPct > 10) {
        pool.push({ score: 60, icon: "tax", title: "Moderate Tax Impact",
            text: "About " + taxPct.toFixed(1) + "% of your gains (" + formatINR(totalTax) +
                ") goes to taxes. This is a typical range for " + (fundType === "equity" ? "equity" : "debt") +
                " investments held over " + years + " years."
        });
    } else {
        pool.push({ score: 50, icon: "tax", title: "Tax-Efficient Returns",
            text: "Only " + taxPct.toFixed(1) + "% of your gains goes to taxes — just " + formatINR(totalTax) +
                " out of " + formatINR(totalGains) + ". " +
                (fundType === "equity" && years > 1
                    ? "The LTCG exemption of ₹1.25 lakh is working well at this corpus size."
                    : "This is a relatively tax-efficient outcome.")
        });
    }

    // ── Equity-specific holding period insights ──
    if (fundType === "equity") {
        if (mode === "sip") {
            var ltcgPct = totalGains > 0 ? (tb.ltcgGains / totalGains * 100) : 0;
            if (years <= 1) {
                pool.push({ score: 85, icon: "clock", title: "All Gains Taxed at 20%",
                    text: "With a " + years + "-year SIP, every installment is held under 12 months, so all " + formatINR(totalGains) +
                        " in gains faces the 20% STCG rate. Even one more year would shift most gains to the 12.5% LTCG rate."
                });
            } else if (years <= 2) {
                pool.push({ score: 70, icon: "clock", title: "STCG Still Weighs on Returns",
                    text: "About " + (100 - ltcgPct).toFixed(0) + "% of your gains are still short-term (" + formatINR(tb.stcgGains) +
                        " taxed at 20%). With a longer horizon, this proportion drops since only the last 11 installments are ever STCG."
                });
            } else if (years >= 10) {
                pool.push({ score: 55, icon: "clock", title: "Long Horizon Paying Off",
                    text: formatINR(tb.ltcgGains) + " of your " + formatINR(totalGains) + " in gains (" + ltcgPct.toFixed(0) +
                        "%) qualifies for the lower 12.5% LTCG rate. The STCG portion (" + formatINR(tb.stcgGains) +
                        ") comes only from the last 11 monthly installments."
                });
            } else {
                pool.push({ score: 60, icon: "clock", title: "Majority Qualifies for LTCG",
                    text: ltcgPct.toFixed(0) + "% of your gains qualify for the 12.5% LTCG rate. The remaining " +
                        (100 - ltcgPct).toFixed(0) + "% (" + formatINR(tb.stcgGains) +
                        ") is from installments held under 12 months, taxed at 20%."
                });
            }
        } else {
            if (years * 12 >= 12) {
                pool.push({ score: 65, icon: "clock", title: "Entire Gain Qualifies for LTCG",
                    text: "Since this is a lumpsum held for " + years + " years, your full gain of " + formatINR(totalGains) +
                        " is taxed at the 12.5% LTCG rate. The first ₹1.25 lakh is exempt, making lumpsum equity tax-friendly for long holding periods."
                });
            } else {
                pool.push({ score: 80, icon: "clock", title: "Short Holding = Higher Tax",
                    text: "Holding a lumpsum equity investment for under 12 months means the entire gain of " + formatINR(totalGains) +
                        " is taxed at 20% STCG. Holding beyond 12 months would qualify for the 12.5% LTCG rate and the ₹1.25 lakh exemption."
                });
            }
        }

        // LTCG exemption utilization
        if (tb.ltcgGains > 0 && tb.ltcgGains <= 125000) {
            pool.push({ score: 75, icon: "info", title: "LTCG Fully Exempt",
                text: "Your long-term gains of " + formatINR(tb.ltcgGains) +
                    " fall entirely within the ₹1.25 lakh annual exemption — no LTCG tax applies! You only pay STCG tax of " +
                    formatINR(tb.stcgTax) + " on the short-term portion."
            });
        } else if (tb.ltcgGains > 0 && totalCorpus > 5000000) {
            var exemptPct = (125000 / tb.ltcgGains * 100).toFixed(1);
            pool.push({ score: 65, icon: "info", title: "Exemption Covers Only " + exemptPct + "% of LTCG",
                text: "With " + formatINR(tb.ltcgGains) + " in long-term gains, the ₹1.25 lakh exemption covers just " + exemptPct +
                    "%. For larger corpuses, the exemption becomes proportionally less impactful. Staggering redemptions across financial years can multiply the exemption benefit."
            });
        }
    }

    // ── Debt fund insight ──
    if (fundType === "debt") {
        if (tb.slabRate >= 0.30) {
            pool.push({ score: 80, icon: "info", title: "High Slab = Higher Debt Fund Tax",
                text: "At the 30% slab, your debt fund tax of " + formatINR(totalTax) +
                    " is substantially higher than what equity LTCG would be on the same gains (~" +
                    formatINR(Math.round(Math.max(0, totalGains - 125000) * 0.125 * 1.04)) +
                    "). This is a key trade-off since April 2023 when indexation was removed for debt funds."
            });
        } else if (tb.slabRate <= 0.05) {
            pool.push({ score: 70, icon: "info", title: "Low Slab Works in Your Favour",
                text: "At the " + (tb.slabRate * 100) + "% slab, your debt fund taxation is very light — only " + formatINR(totalTax) +
                    " on " + formatINR(totalGains) + " in gains. At lower slabs, debt funds can be competitive with equity from a post-tax perspective."
            });
        }
    }

    // ── Step-up insight ──
    if (stepUp > 0 && mode === "sip") {
        var flatInvested = result.monthlyAmount * result.months;
        var extraFromStepUp = totalInvested - flatInvested;
        pool.push({ score: 72, icon: "chart", title: "Step-Up Boosted Your Investment",
            text: "The " + stepUp + "% annual step-up added " + formatINR(extraFromStepUp) +
                " more to your total investment compared to a flat " + formatINR(result.monthlyAmount) +
                "/month SIP (" + formatINR(flatInvested) + " → " + formatINR(totalInvested) +
                "). Your monthly SIP grew from " + formatINR(result.monthlyAmount) + " to " + formatINR(result.finalMonthlySIP) + " in the final year."
        });
    }

    // ── Wealth multiplication ──
    if (gainsMultiple > 2) {
        pool.push({ score: 55, icon: "chart", title: "Gains Exceed " + Math.floor(gainsMultiple) + "x Your Investment",
            text: "Your gains of " + formatINR(totalGains) + " are " + gainsMultiple.toFixed(1) +
                "x your total investment of " + formatINR(totalInvested) +
                ". Compounding over " + years + " years has done the heavy lifting — even after taxes, you keep " +
                formatINR(postTaxCorpus) + "."
        });
    } else if (gainsMultiple < 0.3 && years <= 3) {
        pool.push({ score: 55, icon: "chart", title: "Compounding Needs Time",
            text: "Your gains (" + formatINR(totalGains) + ") are " + (gainsMultiple * 100).toFixed(0) +
                "% of what you invested. Compounding accelerates over time — the same SIP over 15–20 years could generate gains many times your investment."
        });
    }

    // ── Pre-tax vs post-tax (always relevant, varied framing) ──
    if (wealthGap > 500000) {
        pool.push({ score: 62, icon: "chart", title: formatINR(wealthGap) + " Gap Between Pre and Post-Tax",
            text: "Your pre-tax corpus is " + formatINR(totalCorpus) + " but the estimated take-home is " +
                formatINR(postTaxCorpus) + ". A " + formatINR(wealthGap) +
                " gap means tax planning should be part of your goal-setting — not an afterthought."
        });
    } else {
        pool.push({ score: 40, icon: "chart", title: "Manageable Tax Gap",
            text: "The " + formatINR(wealthGap) + " difference between pre-tax (" + formatINR(totalCorpus) +
                ") and post-tax (" + formatINR(postTaxCorpus) +
                ") corpus is relatively small. Your investment is reasonably tax-efficient at this size."
        });
    }

    // ── Lumpsum-specific ──
    if (mode === "lumpsum") {
        pool.push({ score: 58, icon: "info", title: "Lumpsum: One Holding Period",
            text: "Unlike SIPs where each installment has a different holding period, your entire lumpsum is held for " + years +
                " years. " + (fundType === "equity" && years >= 1
                    ? "This means all gains are uniformly classified as LTCG — no STCG component to worry about."
                    : "The full gain of " + formatINR(totalGains) + " is taxed uniformly under one set of rules.")
        });
    }

    pool.sort(function (a, b) { return b.score - a.score; });
    return pool.slice(0, 3);
}
