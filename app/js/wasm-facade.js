import init, { mainThread, Config } from './web.js';

const STABLE_TESTNET_RPC = 'https://soroban-testnet.stellar.org';

let handle = null;

export async function initializeWasm(rpcUrl, bootnodeUrl = null) {
    if (handle) return handle; // Prevent double initialization

    // Ensure we always use the stable testnet RPC endpoint
    const effectiveRpc = rpcUrl || STABLE_TESTNET_RPC;
    const effectiveBootnode = bootnodeUrl || undefined;

    await init();
    const config = new Config(effectiveRpc, effectiveBootnode);
    handle = await mainThread(config);

    return handle;
}

// Named export to get the handle after initialization
export const getHandle = () => {
    if (!handle) throw new Error("WASM not initialized. Call initializeWasm first.");
    return handle;
};

/**
 * Retry wrapper with exponential backoff.
 * Retries an async function up to `maxAttempts` times with delay doubling each time.
 */
export async function withRetry(fn, { maxAttempts = 3, baseDelayMs = 1000, label = 'operation' } = {}) {
    let lastError;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn();
        } catch (err) {
            lastError = err;
            if (attempt < maxAttempts) {
                const delay = baseDelayMs * Math.pow(2, attempt - 1);
                console.warn(`[retry] ${label} attempt ${attempt}/${maxAttempts} failed: ${err?.message || err}. Retrying in ${delay}ms...`);
                await new Promise(r => setTimeout(r, delay));
            }
        }
    }
    throw new Error(`${label} failed after ${maxAttempts} attempts: ${lastError?.message || lastError}`);
}
