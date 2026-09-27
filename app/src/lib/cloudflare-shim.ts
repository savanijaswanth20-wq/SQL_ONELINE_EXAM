// Shim for `cloudflare:workers` in Node / Vite dev mode
export const env: Record<string, unknown> = (globalThis as any).env || process.env || {};
export default { env };
