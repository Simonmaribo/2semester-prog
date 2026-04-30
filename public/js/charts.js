// Grafer på simuleringssiden. simulationData kommer fra en <script>-blok i simulation.ejs.
const years = simulationData.map((d) => `År ${d.year}`);

const equityCtx = document.getElementById('equityChart');
if (equityCtx) {
  new Chart(equityCtx, {
    type: 'line',
    data: {
      labels: years,
      datasets: [
        {
          label: 'Ejendomsværdi',
          data: simulationData.map((d) => d.propertyValue),
          borderColor: '#2563eb',
          backgroundColor: 'rgba(37, 99, 235, 0.1)',
          fill: false,
          tension: 0.3,
        },
        {
          label: 'Gæld',
          data: simulationData.map((d) => d.totalDebt),
          borderColor: '#dc2626',
          backgroundColor: 'rgba(220, 38, 38, 0.1)',
          fill: false,
          tension: 0.3,
        },
        {
          label: 'Egenkapital',
          data: simulationData.map((d) => d.equity),
          borderColor: '#16a34a',
          backgroundColor: 'rgba(22, 163, 74, 0.1)',
          fill: true,
          tension: 0.3,
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'top' },
      },
      scales: {
        y: {
          ticks: {
            callback(value) {
              return `${(value / 1000000).toFixed(1)} mio`;
            }
          }
        }
      }
    }
  });
}

const cashflowCtx = document.getElementById('cashflowChart');
if (cashflowCtx) {
  new Chart(cashflowCtx, {
    type: 'bar',
    data: {
      labels: years,
      datasets: [{
        label: 'Årligt cashflow',
        data: simulationData.map((d) => d.annualCashflow),
        backgroundColor: simulationData.map((d) =>
          d.annualCashflow >= 0 ? 'rgba(22, 163, 74, 0.7)' : 'rgba(220, 38, 38, 0.7)'
        ),
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'top' },
      },
      scales: {
        y: {
          ticks: {
            callback(value) {
              return `${value.toLocaleString('da-DK')} kr`;
            }
          }
        }
      }
    }
  });
}
