// Runs simulations off the main thread so sliders and animations stay smooth.
import { runPayload } from './engine.js';

self.onmessage = (e) => {
  const { id, ...payload } = e.data;
  try {
    self.postMessage({ id, result: runPayload(payload) });
  } catch (err) {
    self.postMessage({ id, error: err.message });
  }
};
