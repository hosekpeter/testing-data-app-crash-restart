'use strict';

const express = require('express');
const fs = require('fs');
const app = express();
const PORT = 3000;

// Crash marker in /tmp — persists across process restarts by supervisord
// (supervisord restarts the process, not the container, so /tmp survives).
const CRASH_MARKER = '/tmp/crash-marker';

if (!fs.existsSync(CRASH_MARKER)) {
    console.log('[run-1] App starting for the first time');
    console.log('[run-1] Will crash in 5 seconds...');

    setTimeout(() => {
        console.error('[run-1] FATAL: something went wrong, crashing!');
        fs.writeFileSync(CRASH_MARKER, new Date().toISOString());
        process.exit(1);
    }, 5000);
} else {
    console.log('[run-2] Restarted after crash, running normally now');

    app.get('/', (req, res) => {
        res.send('OK — running after crash recovery');
    });

    app.listen(PORT, '0.0.0.0', () => {
        console.log(`[run-2] Server running on port ${PORT}`);
    });
}
