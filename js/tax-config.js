/**
 * Indian Mutual Fund Tax Configuration
 * Update this file when tax rules change. All rates are decimals (0.20 = 20%).
 */
const TAX_CONFIG = {
    lastUpdated: "July 2024",
    applicableFrom: "FY 2024-25",
    budgetReference: "Union Budget 2024-25",

    equity: {
        label: "Equity Mutual Fund",
        holdingPeriodThreshold: 12,
        stcg: {
            rate: 0.20,
            label: "Short Term Capital Gains (STCG)",
            description: "Holding period less than 12 months"
        },
        ltcg: {
            rate: 0.125,
            exemptionPerYear: 125000,
            label: "Long Term Capital Gains (LTCG)",
            description: "Holding period 12 months or more; gains up to ₹1.25 lakh/year exempt"
        }
    },

    debt: {
        label: "Debt Mutual Fund",
        holdingPeriodThreshold: 36,
        taxAtSlabRate: true,
        defaultSlabRate: 0.30,
        slabOptions: [
            { label: "0% (₹0 – ₹3L)", rate: 0.00 },
            { label: "5% (₹3L – ₹7L)", rate: 0.05 },
            { label: "10% (₹7L – ₹10L)", rate: 0.10 },
            { label: "15% (₹10L – ₹12L)", rate: 0.15 },
            { label: "20% (₹12L – ₹15L)", rate: 0.20 },
            { label: "30% (Above ₹15L)", rate: 0.30 }
        ],
        description: "Post April 2023: taxed at income tax slab rate, no indexation benefit"
    },

    cess: {
        rate: 0.04,
        label: "Health & Education Cess",
        description: "4% cess on the income tax amount"
    }
};
