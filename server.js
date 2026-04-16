'use strict';

const express = require('express');
const fs = require('fs');
const app = express();
const PORT = 3000;

// Use a file on /data (emptyDir volume) as a crash marker.
// The container filesystem is reset on restart, but emptyDir persists
// across restarts within the same Pod.
// If no /data mount is available, fall back to an env var approach:
// the Downward API can expose restart count, but the simplest approach
// is the marker file on a mounted volume.
const CRASH_MARKER = '/data/crash-marker';

function hasCrashMarker() {
    try {
        return fs.existsSync(CRASH_MARKER);
    } catch {
        return false;
    }
}

if (!hasCrashMarker()) {
    // First run: log something, then crash after a short delay.
    console.log('[run-1] App starting for the first time');
    console.log('[run-1] Simulating work for 5 seconds before crash...');

    setTimeout(() => {
        console.error('[run-1] FATAL: something went wrong, crashing!');
        try {
            fs.writeFileSync(CRASH_MARKER, new Date().toISOString());
        } catch {
            // /data not mounted — marker won't persist, app will crash-loop
            console.error('[run-1] Warning: could not write crash marker');
        }
        process.exit(1);
    }, 5000);
} else {
    // Second run (after restart): run normally.
    console.log('[run-2] App restarted successfully after previous crash');
    console.log('[run-2] Crash marker found, running normally now');

    app.get('/', (req, res) => {
        res.send('OK — running after crash recovery');
    });

    app.listen(PORT, '0.0.0.0', () => {
        console.log(`[run-2] Server running on port ${PORT}`);
    });
}
