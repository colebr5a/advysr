import { useEffect, useState } from 'react';

// One shared worker for the app. Falls back to running on the main thread if
// workers are unavailable (old WebViews, tests).
let worker;
let nextId = 0;
const pending = new Map();

function getWorker() {
  if (worker !== undefined) return worker;
  try {
    worker = new Worker(new URL('./sim.worker.js', import.meta.url), { type: 'module' });
    worker.onmessage = (e) => {
      const resolve = pending.get(e.data.id);
      if (resolve) {
        pending.delete(e.data.id);
        resolve(e.data);
      }
    };
    worker.onerror = () => {
      // Fail every in-flight request over to the main thread.
      worker = null;
      for (const [, resolve] of pending) resolve({ retry: true });
      pending.clear();
    };
  } catch {
    worker = null;
  }
  return worker;
}

async function runOnMainThread(payload) {
  const { runPayload } = await import('./engine.js');
  try {
    return { result: runPayload(payload) };
  } catch (err) {
    return { error: err.message };
  }
}

export async function runSimulation(payload) {
  const w = getWorker();
  if (!w) return runOnMainThread(payload);
  const id = ++nextId;
  const res = await new Promise((resolve) => {
    pending.set(id, resolve);
    w.postMessage({ id, ...payload });
  });
  return res.retry ? runOnMainThread(payload) : res;
}

/**
 * Runs a simulation whenever `payload` changes (by value), debounced.
 * Stale responses from superseded inputs are dropped.
 */
export function useSimulation(payload, delay = 70) {
  const key = payload ? JSON.stringify(payload) : null;
  const [state, setState] = useState({ result: null, error: null, key: null });

  useEffect(() => {
    if (!key) return undefined;
    let cancelled = false;
    const timer = setTimeout(async () => {
      const res = await runSimulation(JSON.parse(key));
      if (!cancelled) setState({ result: res.result ?? null, error: res.error ?? null, key });
    }, delay);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [key, delay]);

  return { ...state, running: key !== state.key };
}
