"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
async function wakeRender() {
    console.log('Sending wake-up request to https://scalora-lms.onrender.com/api/health (waiting up to 60s)...');
    const start = Date.now();
    try {
        const res = await fetch('https://scalora-lms.onrender.com/api/health');
        const elapsed = Math.round((Date.now() - start) / 1000);
        console.log(`Render responded after ${elapsed}s! Status: ${res.status}`);
        console.log('Response Body:', await res.text());
    }
    catch (err) {
        const elapsed = Math.round((Date.now() - start) / 1000);
        console.error(`Render failed after ${elapsed}s:`, err.message);
    }
}
wakeRender();
