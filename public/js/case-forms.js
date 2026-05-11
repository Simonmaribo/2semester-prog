// Hjælpefunktioner til case-siden: tilføj/fjern rækker, modal.

function addRow(listId, templateId) {
  var list = document.getElementById(listId);
  var template = document.getElementById(templateId);
  if (!list || !template) return;

  // unikt index så name-attributterne ikke kolliderer
  var idx = Math.floor(Math.random() * 1000000);
  var html = template.innerHTML.replaceAll('INDEX', idx);

  var wrapper = document.createElement('div');
  wrapper.innerHTML = html.trim();
  var newRow = wrapper.firstElementChild;
  if (newRow) list.appendChild(newRow);
}

// Klik på en remove-knap inde i en af listerne fjerner den række knappen sidder i
['costs-list', 'loans-list', 'operating-list', 'renovations-list'].forEach((id) => {
  var list = document.getElementById(id);
  if (!list) return;
  list.addEventListener('click', (e) => {
    if (e.target.classList.contains('remove')) {
      e.target.parentElement.remove();
    }
  });
});

function openModal(id) {
  document.getElementById(id).classList.add('active');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('active');
}

// Klik udenfor modal-indholdet lukker også modalen
document.querySelectorAll('.modal-overlay').forEach((overlay) => {
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.classList.remove('active');
  });
});
