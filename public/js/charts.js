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
          borderColor: 'blue',
          fill: false,
        },
        {
          label: 'Gæld',
          data: simulationData.map((d) => d.totalDebt),
          borderColor: 'red',
          fill: false,
        },
        {
          label: 'Egenkapital',
          data: simulationData.map((d) => d.equity),
          borderColor: 'green',
          backgroundColor: 'rgba(0,128,0,0.1)',
          fill: true,
        }
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'top' } },
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
        backgroundColor: simulationData.map((d) => d.annualCashflow >= 0 ? 'green' : 'red'),
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'top' } },
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
