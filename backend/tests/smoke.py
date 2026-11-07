"""Run against a running API: python3 backend/tests/smoke.py [base-url]."""
import json
import sys
import urllib.request
import urllib.error

base = sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:5080'
def request(path, payload=None, expected=200):
    data = None if payload is None else json.dumps(payload).encode()
    req = urllib.request.Request(base + path, data=data, headers={'Content-Type': 'application/json'})
    try:
        response = urllib.request.urlopen(req, timeout=10)
    except urllib.error.HTTPError as error:
        response = error
    with response:
        body = response.read().decode()
        assert response.status == expected, (path, response.status, body)
        return body, response.headers

def generate(template, values, expected=200):
    body, _ = request('/api/documents/generate', {'template': template, 'values': values}, expected)
    return json.loads(body)

assert json.loads(request('/api/health')[0])['status'] == 'healthy'
for path, media in [('/', 'text/html'), ('/app.js', 'javascript'), ('/styles.css', 'text/css')]:
    body, headers = request(path)
    assert body and media in headers['Content-Type']
assert generate('Hallo {{Name}}, am {{ Datum }}. {{Name}}', {'Name': 'Erika', 'Datum': '15.11.2026'})['content'] == 'Hallo Erika, am 15.11.2026. Erika'
assert generate('{{Änderung}}', {'Änderung': 'Grüße'})['content'] == 'Grüße'
assert generate('{{Name}}', {'Name': '$1 {{Datum}} <script>alert(1)</script>'})['content'] == '$1 {{Datum}} <script>alert(1)</script>'
assert generate('Ohne Platzhalter', {})['content'] == 'Ohne Platzhalter'
for template, values in [('{{Name}}', {}), ('{{Name}}', {'Name': ' '}), ('{{Name}}', {'name': 'Erika'}), ('{{Name', {}), ('{{bad-name}}', {}), ('', {}), ('x'*20001, {}), ('{{Name}}', {'Name': 'x'*5001}), ('{{Name}}'*300, {'Name': 'x'*5000})]:
    generate(template, values, 400)
request('/api/documents/generate', {'template': 'Hallo', 'values': None}, 400)
request('/api/missing', expected=404)
print('PASS: health, static frontend assets, successful rendering, Unicode, repeated fields, literal values, missing/blank/case-sensitive fields, malformed templates, length/output limits, null values and unknown route')
