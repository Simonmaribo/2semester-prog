// Adressesøgning via DAWA + BBR

var input = document.getElementById('address-input');
var searchBtn = document.getElementById('address-search-btn');
var dropdown = document.getElementById('autocomplete-results');
var form = document.getElementById('create-property-form');
var preview = document.getElementById('property-preview');

function triggerSearch() {
  var query = input.value.trim();

  if (query.length < 2) {
    dropdown.innerHTML = '';
    dropdown.style.display = 'none';
    return;
  }

  searchAddresses(query);
}

searchBtn.addEventListener('click', triggerSearch);

// Luk dropdown hvis brugeren klikker udenfor
document.addEventListener('click', (e) => {
  if (
    !input.contains(e.target) &&
    !dropdown.contains(e.target) &&
    !searchBtn.contains(e.target)
  ) {
    dropdown.style.display = 'none';
  }
});

function searchAddresses(query) {
  fetch('/api/dawa/autocomplete?q=' + encodeURIComponent(query))
    .then((res) => res.json())
    .then((results) => {
      dropdown.innerHTML = '';

      if (results.length === 0) {
        dropdown.style.display = 'none';
        return;
      }

      results.forEach((item) => {
        var div = document.createElement('div');
        div.className = 'autocomplete-item';
        div.textContent = item.forslagstekst;
        div.addEventListener('click', () => {
          selectAddress(item);
        });
        dropdown.appendChild(div);
      });

      dropdown.style.display = 'block';
    })
    .catch((err) => {
      console.error('Fejl ved adressesøgning:', err);
    });
}

function selectAddress(item) {
  input.value = item.forslagstekst;
  dropdown.style.display = 'none';

  // adgangsadresseid = selve adressen, id = den specifikke bolig (bruges ved ejerlejligheder)
  var adgangsadresseId = item.data.adgangsadresseid;
  var adresseId = item.data.id;

  // Udfyld skjulte form-felter så de sendes med når formen submittes
  document.getElementById('selected-address').value = item.forslagstekst;
  document.getElementById('selected-dawa-id').value = adgangsadresseId;
  document.getElementById('selected-lat').value = item.data.y || '';
  document.getElementById('selected-lng').value = item.data.x || '';

  // Hent BBR-data for adressen
  fetch('/api/bbr/' + adgangsadresseId + '?adresseId=' + adresseId)
    .then((res) => { 
      return res.json(); 
    })
    .then((bbr) =>{
      showPreview(bbr);
    })
    .catch((err) => {
      console.error('Fejl ved BBR-opslag:', err);
      preview.innerHTML = '<p>Fejl ved hentning af bygningsdata.</p>';
      form.style.display = 'block';
    });
}

// Vis BBR-data i preview-området og udfyld skjulte felter
function showPreview(bbr) {
  if (bbr.error) {
    preview.innerHTML = '<p>Kunne ikke hente bygningsdata.</p>';
  } else {
    document.getElementById('selected-type').value = bbr.propertyType || '';
    document.getElementById('selected-year').value = bbr.buildYear || '';
    document.getElementById('selected-area').value = bbr.livingArea || '';
    document.getElementById('selected-rooms').value = bbr.rooms || '';

    preview.innerHTML =
      '<h3>Ejendomsdata</h3>' +
      '<p><strong>Type:</strong> ' + (bbr.propertyType || 'Ukendt') + '</p>' +
      '<p><strong>Byggeår:</strong> ' + (bbr.buildYear || 'Ukendt') + '</p>' +
      '<p><strong>Areal:</strong> ' + (bbr.livingArea ? bbr.livingArea + ' m²' : 'Ukendt') + '</p>' +
      '<p><strong>Værelser:</strong> ' + (bbr.rooms || 'Ukendt') + '</p>';
  }

  form.style.display = 'block';
}
