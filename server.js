'use strict';

const { execSync } = require('child_process');
const express = require('express');
const fs = require('fs');
const app = express();
const PORT = 3000;

// Crash marker on /data (emptyDir volume) — persists across container restarts.
// Requires dataDir feature enabled on the App CR.
const CRASH_MARKER = '/data/crash-marker';

if (!fs.existsSync(CRASH_MARKER)) {
    console.log('[run-1] First run — will crash in 5 seconds');

    app.get('/', (req, res) => {
        res.send('Running — will crash soon');
    });

    app.listen(PORT, '0.0.0.0', () => {
        console.log(`[run-1] Server running on port ${PORT}`);
    });

    setTimeout(() => {
        console.error('[run-1] FATAL: something went wrong, killing container!');
        fs.writeFileSync(CRASH_MARKER, new Date().toISOString());
        try { execSync('kill -TERM 1'); } catch { process.exit(1); }
    }, 5000);
} else {
    console.log('[run-2] Restarted after crash, running normally');

    app.get('/', (req, res) => {
        res.send('OK — running after crash recovery');
    });

    app.listen(PORT, '0.0.0.0', () => {
        console.log(`[run-2] Server running on port ${PORT}`);
    });
}
