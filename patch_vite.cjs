const fs = require('fs');
// To make sw.js available in the dist output, Vite usually copies everything in public/ automatically.
// The task says Target Files: public/sw.js (New), index.html, vite.config.js.
// Why vite.config.js? Maybe we need to do something for the service worker or PWA plugin, but the prompt says:
// "Create a basic Service Worker (public/sw.js) that caches the core HTML, CSS, and JS bundles locally... Register the Service Worker dynamically in index.html on window load."
// Let's check vite.config.js to make sure no existing config interferes.
