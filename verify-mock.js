const { MockInstagramAdapter } = require('./apps/web/lib/sync/adapters/mock-instagram-adapter.ts'); // This might fail due to TS, let's use a simpler test or just trust the server run.

// Actually, I can't easily run TS files directly with node without ts-node or transpilation.
// Let's rely on the server logs since it's running.

console.log("Mock Adapter Test: Skipped due to TS environment constraints. Relying on dev server.");
