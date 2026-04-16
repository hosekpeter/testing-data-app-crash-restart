#!/bin/bash
set -Eeuo pipefail

echo "=== Installing dependencies ==="
cd /app && npm install

echo "=== Detecting restart count ==="
python3 - <<'PYEOF'
import json, os, ssl, urllib.request, traceback

try:
    sa_path = '/var/run/secrets/kubernetes.io/serviceaccount'
    token_file = f'{sa_path}/token'
    ns_file = f'{sa_path}/namespace'
    ca_file = f'{sa_path}/ca.crt'

    if not os.path.exists(token_file):
        print(f'ERROR: SA token not found at {token_file}')
        raise SystemExit(1)

    with open(token_file) as f:
        token = f.read()
    with open(ns_file) as f:
        namespace = f.read().strip()

    hostname = os.environ.get('HOSTNAME', 'unknown')
    url = f'https://kubernetes.default.svc/api/v1/namespaces/{namespace}/pods/{hostname}'
    print(f'Querying: {url}')

    ctx = ssl.create_default_context(cafile=ca_file)
    req = urllib.request.Request(url, headers={'Authorization': f'Bearer {token}'})
    with urllib.request.urlopen(req, context=ctx, timeout=5) as resp:
        pod = json.loads(resp.read())

    statuses = pod.get('status', {}).get('containerStatuses', [])
    for s in statuses:
        print(f"  container={s['name']} restartCount={s.get('restartCount', 0)}")

    cs = next((s for s in statuses if s['name'] == 'app'), None)
    count = cs['restartCount'] if cs else 0
    print(f'Result: restart_count={count}')

    with open('/tmp/restart-count', 'w') as f:
        f.write(str(count))

except Exception as e:
    traceback.print_exc()
    print(f'Falling back to restart_count=0')
    with open('/tmp/restart-count', 'w') as f:
        f.write('0')
PYEOF
