// Små hjælpefunktioner til case-siden:
// tilføje/fjerne rækker, åbne/lukke modal, confirm-dialog.

document.querySelectorAll('[data-add-row]').forEach(function (btn) {
  btn.addEventListener('click', function () {
    var list = document.querySelector(btn.getAttribute('data-add-row'));
    var template = document.querySelector(btn.getAttribute('data-template'));
    if (!list || !template) return;

    // Unikt index så felter ikke kolliderer. Serveren bruger Object.values()
    // så selve værdien er ligegyldig, bare den er unik pr. række.
    var idx = Math.floor(Math.random() * 1000000);
    var html = template.innerHTML.replaceAll('INDEX', idx);

    var wrapper = document.createElement('div');
    wrapper.innerHTML = html.trim();
    var newRow = wrapper.firstElementChild;
    if (newRow) list.appendChild(newRow);
  });
});

document.addEventListener('click', function (e) {
  var btn = e.target.closest('[data-remove-row]');
  if (!btn) return;
  var row = btn.closest('[data-row]');
  if (row) row.remove();
});

document.querySelectorAll('[data-modal-open]').forEach(function (btn) {
  btn.addEventListener('click', function () {
    var modal = document.querySelector(btn.getAttribute('data-modal-open'));
    if (modal) modal.classList.add('active');
  });
});

document.querySelectorAll('[data-modal-close]').forEach(function (btn) {
  btn.addEventListener('click', function () {
    var overlay = btn.closest('.modal-overlay');
    if (overlay) overlay.classList.remove('active');
  });
});

document.querySelectorAll('.modal-overlay').forEach(function (overlay) {
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) overlay.classList.remove('active');
  });
});

document.querySelectorAll('form[data-confirm]').forEach(function (form) {
  form.addEventListener('submit', function (e) {
    if (!confirm(form.getAttribute('data-confirm'))) e.preventDefault();
  });
});
