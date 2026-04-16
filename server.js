'use strict';

const { execSync } = require('child_process');
const express = require('express');
const fs = require('fs');
const app = express();
const PORT = 3000;

let restartCount = 0;
try {
    restartCount = parseInt(fs.readFileSync('/tmp/restart-count', 'utf8').trim(), 10) || 0;
} catch {
    console.log('[app] No /tmp/restart-count found, assuming 0');
}

console.log(`[app] Restart count: ${restartCount}`);

if (restartCount === 0) {
    console.log('[app] First run — will crash in 5 seconds');

    app.get('/', (req, res) => {
        res.send('Running — will crash soon');
    });

    app.listen(PORT, '0.0.0.0', () => {
        console.log(`[app] Server running on port ${PORT}`);
    });

    setTimeout(() => {
        console.error('[app] FATAL: something went wrong, killing container!');
        try { execSync('kill -TERM 1'); } catch { process.exit(1); }
    }, 5000);
} else {
    console.log(`[app] Restarted (count: ${restartCount}), running normally`);

    app.get('/', (req, res) => {
        res.send('OK — running after crash recovery');
    });

    app.listen(PORT, '0.0.0.0', () => {
        console.log(`[app] Server running on port ${PORT}`);
    });
}
