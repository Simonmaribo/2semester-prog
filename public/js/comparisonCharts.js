// Grafer på sammenligningssiden. comparisonData kommer fra en <script> i comparison.ejs.
const c1 = comparisonData.case1;
const c2 = comparisonData.case2;

const maxYears = Math.max(c1.years.length, c2.years.length);
const labels = Array.from({ length: maxYears }, (_, i) => `År ${i}`);

const sharedOptions = {
  responsive: true,
  plugins: { legend: { position: 'top' } },
  scales: {
    y: {
      ticks: {
        callback(value) {
          if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} mio`;
          if (Math.abs(value) >= 1_000) return `${Math.round(value / 1_000)} t.kr`;
          return `${value} kr`;
        }
      }
    }
  }
};

// Graf 1: Egenkapital over tid (linjediagram)
const equityCtx = document.getElementById('compareEquityChart');
if (equityCtx) {
  new Chart(equityCtx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: c1.name,
          data: c1.years.map((d) => d.equity),
          borderColor: '#2563eb',
          backgroundColor: 'rgba(37, 99, 235, 0.08)',
          fill: false,
          tension: 0.3,
        },
        {
          label: c2.name,
          data: c2.years.map((d) => d.equity),
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.08)',
          fill: false,
          tension: 0.3,
        }
      ]
    },
    options: sharedOptions,
  });
}

// Graf 2: Kumulativt cashflow over tid (linjediagram)
const cashflowCtx = document.getElementById('compareCashflowChart');
if (cashflowCtx) {
  new Chart(cashflowCtx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: c1.name,
          data: c1.years.map((d) => d.cumulativeCashflow),
          borderColor: '#2563eb',
          backgroundColor: 'rgba(37, 99, 235, 0.08)',
          fill: false,
          tension: 0.3,
        },
        {
          label: c2.name,
          data: c2.years.map((d) => d.cumulativeCashflow),
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.08)',
          fill: false,
          tension: 0.3,
        }
      ]
    },
    options: sharedOptions,
  });
}
