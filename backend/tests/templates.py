"""CRUD integration test. Creates then removes only its own disposable test template."""
import json
import sys
import urllib.request
import urllib.error
import uuid

base = sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:5080'
def request(method, path, payload=None, expected=200):
    req = urllib.request.Request(base + path, method=method,
        data=None if payload is None else json.dumps(payload).encode(),
        headers={'Content-Type': 'application/json'})
    try:
        response = urllib.request.urlopen(req, timeout=10)
    except urllib.error.HTTPError as error:
        response = error
    with response:
        body = response.read().decode()
        assert response.status == expected, (method, path, response.status, body)
        return json.loads(body) if body else None, response.headers

payload = {'name': 'Smoke ' + str(uuid.uuid4()), 'type': 'Letter', 'content': 'Hallo {{Name}}'}
created, headers = request('POST', '/api/templates', payload, 201)
path = '/api/templates/' + created['id']
try:
    assert headers['Location'].endswith(path)
    assert created['name'] == payload['name'] and created['createdAt']
    assert request('GET', path)[0] == created
    assert any(t['id'] == created['id'] for t in request('GET', '/api/templates')[0])
    changed = {**payload, 'name': 'Geändert', 'type': 'Reminder'}
    updated, _ = request('PUT', path, changed)
    assert updated['name'] == 'Geändert' and updated['type'] == 'Reminder'
    assert updated['createdAt'] == created['createdAt']
    assert request('GET', path)[0] == updated
    for bad in [ {**payload, 'name': ' '}, {**payload, 'type': 'Invalid'}, {**payload, 'content': '{{bad-name}}'}, {**payload, 'content': ''} ]:
        request('POST', '/api/templates', bad, 400)
    missing = '/api/templates/' + str(uuid.uuid4())
    request('GET', missing, expected=404)
    request('PUT', missing, payload, 404)
    request('DELETE', missing, expected=404)
finally:
    request('DELETE', path, expected=204)
request('GET', path, expected=404)
print('PASS: template create/list/get/update/delete, Location, timestamp, validation, 404s')
