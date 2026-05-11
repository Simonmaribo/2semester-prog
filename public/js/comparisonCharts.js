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

const equityCtx = document.getElementById('compareEquityChart');
if (equityCtx) {
  new Chart(equityCtx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: c1.name, data: c1.years.map((d) => d.equity), borderColor: 'blue', fill: false },
        { label: c2.name, data: c2.years.map((d) => d.equity), borderColor: 'orange', fill: false },
      ]
    },
    options: sharedOptions,
  });
}

const cashflowCtx = document.getElementById('compareCashflowChart');
if (cashflowCtx) {
  new Chart(cashflowCtx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: c1.name, data: c1.years.map((d) => d.cumulativeCashflow), borderColor: 'blue', fill: false },
        { label: c2.name, data: c2.years.map((d) => d.cumulativeCashflow), borderColor: 'orange', fill: false },
      ]
    },
    options: sharedOptions,
  });
}
