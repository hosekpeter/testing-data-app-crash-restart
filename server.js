'use strict';

const { execSync } = require('child_process');
const express = require('express');
const fs = require('fs');
const app = express();
const PORT = 3000;

function getRestartCount() {
    try {
        const token = fs.readFileSync('/var/run/secrets/kubernetes.io/serviceaccount/token', 'utf8');
        const namespace = fs.readFileSync('/var/run/secrets/kubernetes.io/serviceaccount/namespace', 'utf8');
        const hostname = process.env.HOSTNAME;

        const result = execSync(
            `curl -s --cacert /var/run/secrets/kubernetes.io/serviceaccount/ca.crt ` +
            `-H "Authorization: Bearer ${token}" ` +
            `"https://kubernetes.default.svc/api/v1/namespaces/${namespace}/pods/${hostname}"`,
            { encoding: 'utf8', timeout: 5000 }
        );

        const pod = JSON.parse(result);
        const cs = (pod.status?.containerStatuses || []).find(c => c.name === 'app');
        return cs?.restartCount || 0;
    } catch (err) {
        console.error('[app] Could not get restart count from K8s API:', err.message);
        return 0;
    }
}

const restartCount = getRestartCount();
console.log(`[app] Restart count: ${restartCount}`);

if (restartCount === 0) {
    console.log('[app] First run — will crash in 5 seconds');

    app.get('/', (req, res) => {
        res.send('Running — will crash soon');
    });

    const server = app.listen(PORT, '0.0.0.0', () => {
        console.log(`[app] Server running on port ${PORT}`);
    });

    setTimeout(() => {
        console.error('[app] FATAL: something went wrong, killing container!');
        try { execSync('kill -TERM 1'); } catch { process.exit(1); }
    }, 5000);
} else {
    console.log(`[app] Container was restarted (count: ${restartCount}), running normally`);

    app.get('/', (req, res) => {
        res.send('OK — running after crash recovery');
    });

    app.listen(PORT, '0.0.0.0', () => {
        console.log(`[app] Server running on port ${PORT}`);
    });
}
