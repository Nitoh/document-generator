const template = document.querySelector('#template');
const fields = document.querySelector('#fields');
const message = document.querySelector('#message');
const preview = document.querySelector('#preview');
const download = document.querySelector('#download');
const generate = document.querySelector('#generate');
const example = template.value;
const values = new Map();
let content = null;
let revision = 0;
let busy = false;
function invalidate() {
  revision++;
  content = null;
  download.disabled = true;
  preview.textContent = 'Dein fertiges Dokument erscheint hier.';
  message.textContent = '';
}
function updateFields() {
  invalidate();
  const names = [...new Set([...template.value.matchAll(/\{\{\s*([\p{L}_][\p{L}\p{N}_]*)\s*\}\}/gu)].map(m => m[1]))];
  fields.replaceChildren();
  names.forEach((name, index) => {
    const label = document.createElement('label');
    const input = document.createElement('input');
    input.id = 'field-' + index;
    label.htmlFor = input.id;
    label.textContent = name;
    input.required = true;
    input.maxLength = 5000;
    input.value = values.get(name) || '';
    input.dataset.field = name;
    input.addEventListener('input', () => { values.set(name, input.value); invalidate(); });
    fields.append(label, input);
  });
  document.querySelector('#empty').hidden = names.length > 0;
}
template.addEventListener('input', updateFields);
document.querySelector('#example').addEventListener('click', () => {
  template.value = example;
  values.clear();
  values.set('Name', 'Erika'); values.set('Datum', '15.11.2026');
  updateFields();
});
document.querySelector('#generator').addEventListener('submit', async event => {
  event.preventDefault();
  if (busy) return;
  invalidate();
  const requestRevision = revision;
  const payload = Object.create(null);
  fields.querySelectorAll('input').forEach(input => { payload[input.dataset.field] = input.value; });
  busy = true; generate.disabled = true;
  message.className = ''; message.textContent = 'Dein Dokument wird erstellt …';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch('/api/documents/generate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ template: template.value, values: payload }), signal: controller.signal
    });
    const result = await response.json();
    if (requestRevision !== revision) return;
    if (!response.ok) throw new Error(result.detail || Object.values(result.errors || {}).flat().join(' ') || 'Bitte prüfe deine Eingaben.');
    content = result.content;
    preview.textContent = content;
    download.disabled = false;
    message.textContent = 'Fertig! Dein Dokument steht unten bereit.';
  } catch (error) {
    if (requestRevision !== revision) return;
    message.className = 'error';
    message.textContent = error.name === 'AbortError' ? 'Die Anfrage dauert zu lange. Bitte versuche es erneut.' : (error instanceof TypeError ? 'Die Verbindung ist fehlgeschlagen. Bitte versuche es erneut.' : error.message);
  } finally { clearTimeout(timeout); busy = false; generate.disabled = false; }
});
download.addEventListener('click', () => {
  if (content === null) return;
  const url = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a'); link.href = url; link.download = 'dokument.txt'; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
updateFields();
