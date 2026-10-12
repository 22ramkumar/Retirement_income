/**
 * RetireWell Fiduciary Advisory - Interactive Projections & Annuity Simulator
 * Mathematical engine for calculating accumulation, guaranteed annuity floors,
 * safe withdrawal rates, income gap analysis, and interactive Chart.js graphs.
 */

const RetireWellProjections = {
  chartInstance: null,
  homeChartInstance: null,

  // Mathematical calculation engine
  calculate(params) {
    const {
      currentAge = 58,
      retirementAge = 63,
      currentSavings = 1284500,
      monthlyContribution = 1500,
      annualReturn = 6.5,       // %
      inflation = 2.5,          // %
      desiredMonthlyIncome = 6500,
      socialSecurityAge = 67,
      ssMonthlyBenefit = 2400
    } = params;

    const yearsToRetire = Math.max(1, retirementAge - currentAge);
    const monthsToRetire = yearsToRetire * 12;
    const monthlyRate = (annualReturn / 100) / 12;

    // Future value of current savings
    let futureValue = currentSavings * Math.pow(1 + monthlyRate, monthsToRetire);

    // Future value of ongoing contributions
    if (monthlyRate > 0) {
      futureValue += monthlyContribution * ((Math.pow(1 + monthlyRate, monthsToRetire) - 1) / monthlyRate);
    } else {
      futureValue += monthlyContribution * monthsToRetire;
    }

    // Traditional 4% Safe Withdrawal Rule monthly yield
    const fourPercentMonthly = (futureValue * 0.04) / 12;

    // Guaranteed Annuity Lifetime Income Floor (Industry standard institutional rate ~6.2% at age 63-65 with GLWB rider)
    const annuityPayoutRate = 0.062 + (Math.max(0, retirementAge - 60) * 0.0018);
    const guaranteedAnnuityMonthly = (futureValue * 0.60 * annuityPayoutRate) / 12 + (futureValue * 0.40 * 0.038) / 12;

    // Social security adjustment
    const effectiveSS = retirementAge >= socialSecurityAge ? ssMonthlyBenefit : 0;
    const totalProjectedMonthly = guaranteedAnnuityMonthly + effectiveSS;

    // Income Gap
    const incomeGap = totalProjectedMonthly - desiredMonthlyIncome;

    // Build year-by-year curve for Chart.js (from current age to age 85)
    const labels = [];
    const potValues = [];
    const guaranteedIncomes = [];
    const targetIncomes = [];

    let balance = currentSavings;
    const endAge = 85;

    for (let age = currentAge; age <= endAge; age++) {
      labels.push(`Age ${age}`);

      if (age < retirementAge) {
        // Accumulation phase
        balance = balance * (1 + annualReturn / 100) + (monthlyContribution * 12);
        potValues.push(Math.round(balance));
        guaranteedIncomes.push(0);
      } else {
        // Decumulation phase: Portfolio provides stable floor + indexed growth
        balance = Math.max(0, balance * (1 + (annualReturn - 2.0) / 100) - (desiredMonthlyIncome * 12));
        potValues.push(Math.round(balance));
        guaranteedIncomes.push(Math.round(guaranteedAnnuityMonthly + (age >= socialSecurityAge ? ssMonthlyBenefit : 0)));
      }

      targetIncomes.push(age >= retirementAge ? desiredMonthlyIncome : 0);
    }

    return {
      yearsToRetire,
      totalPotAtRetirement: Math.round(futureValue),
      traditional4PctMonthly: Math.round(fourPercentMonthly),
      guaranteedAnnuityMonthly: Math.round(guaranteedAnnuityMonthly),
      ssMonthlyBenefit: effectiveSS,
      totalProjectedMonthly: Math.round(totalProjectedMonthly),
      incomeGap: Math.round(incomeGap),
      isSurplus: incomeGap >= 0,
      labels,
      potValues,
      guaranteedIncomes,
      targetIncomes
    };
  },

  // Initialize or update the Dashboard Chart.js
  updateDashboardChart(params) {
    const canvas = document.getElementById("projectionChartCanvas");
    if (!canvas || typeof Chart === "undefined") return;

    const result = this.calculate(params);
    const ctx = canvas.getContext("2d");

    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    const gridColor = isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(15, 23, 42, 0.08)";
    const textColor = isDark ? "#94A3B8" : "#475569";

    // Destroy existing instance to avoid duplicate rendering
    if (this.chartInstance) {
      this.chartInstance.destroy();
    }

    this.chartInstance = new Chart(ctx, {
      type: "line",
      data: {
        labels: result.labels,
        datasets: [
          {
            label: "Total Retirement Asset Trajectory ($)",
            data: result.potValues,
            borderColor: "#0D9488", // Teal
            backgroundColor: isDark ? "rgba(13, 148, 136, 0.15)" : "rgba(13, 148, 136, 0.08)",
            fill: true,
            tension: 0.35,
            borderWidth: 3,
            pointRadius: 2,
            pointHoverRadius: 6,
            yAxisID: "y"
          },
          {
            label: "Guaranteed Monthly Income Stream ($/mo)",
            data: result.guaranteedIncomes,
            borderColor: "#D97706", // Amber
            backgroundColor: "transparent",
            borderDash: [5, 5],
            tension: 0.2,
            borderWidth: 2.5,
            pointRadius: 2,
            yAxisID: "y1"
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: "index",
          intersect: false
        },
        plugins: {
          legend: {
            labels: {
              color: textColor,
              font: { family: "'Plus Jakarta Sans', sans-serif", weight: 600 }
            }
          },
          tooltip: {
            backgroundColor: isDark ? "#0A192F" : "#FFFFFF",
            titleColor: isDark ? "#FFFFFF" : "#0F172A",
            bodyColor: isDark ? "#E2E8F0" : "#334155",
            borderColor: isDark ? "#1E2E52" : "#CBD5E1",
            borderWidth: 1,
            padding: 12,
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) label += ': ';
                if (context.parsed.y !== null) {
                  label += '$' + context.parsed.y.toLocaleString();
                }
                return label;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { color: gridColor },
            ticks: { color: textColor, maxTicksLimit: 12 }
          },
          y: {
            type: "linear",
            display: true,
            position: "left",
            grid: { color: gridColor },
            ticks: {
              color: textColor,
              callback: val => "$" + (val >= 1000000 ? (val / 1000000).toFixed(1) + "M" : (val / 1000).toFixed(0) + "k")
            }
          },
          y1: {
            type: "linear",
            display: true,
            position: "right",
            grid: { drawOnChartArea: false },
            ticks: {
              color: "#D97706",
              callback: val => "$" + val.toLocaleString() + "/mo"
            }
          }
        }
      }
    });

    // Update numerical stat labels in UI
    this.updateMetricsUI(result);
  },

  updateMetricsUI(result) {
    const elPot = document.getElementById("metricProjectedPot");
    const elIncome = document.getElementById("metricMonthlyIncome");
    const elFloor = document.getElementById("metricAnnuityFloor");
    const elGap = document.getElementById("metricIncomeGap");
    const elGapCard = document.getElementById("metricGapCard");

    if (elPot) elPot.textContent = "$" + result.totalPotAtRetirement.toLocaleString();
    if (elIncome) elIncome.textContent = "$" + result.totalProjectedMonthly.toLocaleString() + "/mo";
    if (elFloor) elFloor.textContent = "$" + result.guaranteedAnnuityMonthly.toLocaleString() + "/mo";

    if (elGap) {
      if (result.isSurplus) {
        elGap.innerHTML = `<span class="text-emerald-600 font-bold">+$${result.incomeGap.toLocaleString()}/mo Surplus</span>`;
        if (elGapCard) elGapCard.className = "rw-card p-5 border-emerald-500/30 bg-emerald-500/5";
      } else {
        elGap.innerHTML = `<span class="text-rose-600 font-bold">-$${Math.abs(result.incomeGap).toLocaleString()}/mo Gap</span>`;
        if (elGapCard) elGapCard.className = "rw-card p-5 border-rose-500/30 bg-rose-500/5";
      }
    }
  },

  // Mini Widget on Homepage
  updateHomeWidget() {
    const ageInput = document.getElementById("homeCurrentAge");
    const retAgeInput = document.getElementById("homeRetireAge");
    const savingsInput = document.getElementById("homeSavings");
    const contribInput = document.getElementById("homeMonthlyContrib");

    if (!ageInput || !retAgeInput || !savingsInput || !contribInput) return;

    const currentAge = parseInt(ageInput.value) || 55;
    const retirementAge = parseInt(retAgeInput.value) || 65;
    const currentSavings = parseFloat(savingsInput.value) || 500000;
    const monthlyContribution = parseFloat(contribInput.value) || 1200;

    const res = this.calculate({
      currentAge,
      retirementAge,
      currentSavings,
      monthlyContribution,
      annualReturn: 6.2,
      inflation: 2.5,
      desiredMonthlyIncome: 5500
    });

    const outPot = document.getElementById("homeResultPot");
    const outIncome = document.getElementById("homeResultIncome");
    const outFloor = document.getElementById("homeResultFloor");

    if (outPot) outPot.textContent = "$" + res.totalPotAtRetirement.toLocaleString();
    if (outIncome) outIncome.textContent = "$" + res.totalProjectedMonthly.toLocaleString() + "/mo";
    if (outFloor) outFloor.textContent = "$" + res.guaranteedAnnuityMonthly.toLocaleString() + "/mo";
  },

  // Save current scenario to LocalStorage
  saveCurrentScenario() {
    const ageInput = document.getElementById("sliderCurrentAge");
    const retAgeInput = document.getElementById("sliderRetireAge");
    const savingsInput = document.getElementById("sliderCurrentSavings");
    const contribInput = document.getElementById("sliderMonthlyContrib");
    const returnInput = document.getElementById("sliderAnnualReturn");
    const incomeInput = document.getElementById("sliderDesiredIncome");

    const scenario = {
      title: prompt("Enter a descriptive title for this retirement scenario:", "My Custom Fiduciary Scenario") || "Custom Scenario",
      currentAge: parseInt(ageInput?.value || 58),
      retirementAge: parseInt(retAgeInput?.value || 63),
      currentSavings: parseFloat(savingsInput?.value || 1284500),
      monthlyContribution: parseFloat(contribInput?.value || 1500),
      annualReturn: parseFloat(returnInput?.value || 6.5),
      desiredMonthlyIncome: parseFloat(incomeInput?.value || 6500)
    };

    const res = this.calculate(scenario);
    scenario.projectedMonthlyIncome = res.totalProjectedMonthly;
    scenario.guaranteedFloor = res.guaranteedAnnuityMonthly;
    scenario.totalPotAtRetirement = res.totalPotAtRetirement;

    window.RetireWellDB.saveScenario(scenario);
    window.RetireWellApp.toast("Scenario saved successfully to your profile!", "success");

    if (typeof window.renderSavedScenarios === "function") {
      window.renderSavedScenarios();
    }
  },

  // Print projection summary
  printProjections() {
    window.print();
  }
};

if (typeof window !== "undefined") {
  window.RetireWellProjections = RetireWellProjections;
}
