'use strict';

const { execSync } = require('child_process');
const express = require('express');
const app = express();
const PORT = 3000;

console.log('[app] Starting...');
console.log('[app] Will kill supervisord (PID 1) in 5 seconds to crash the container');

setTimeout(() => {
    console.error('[app] FATAL: something went wrong, killing container!');
    // Kill PID 1 (supervisord) — this crashes the entire container,
    // Kubernetes will restart it and increment RestartCount.
    try {
        execSync('kill -TERM 1');
    } catch {
        process.exit(1);
    }
}, 5000);
