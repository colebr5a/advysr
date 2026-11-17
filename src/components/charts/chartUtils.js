import { useEffect, useRef, useState } from 'react';

export const C = {
  surface: '#FFFFFF',
  grid: '#EEF0EE',
  axis: '#9CA3AF',
  text1: '#111827',
  text2: '#374151',
  text3: '#6B7280',
  // Sequential (single hue) for uncertainty bands
  band: '#2F9E6E',
  median: '#1B4332',
  // Categorical — validated (light surface): all six checks pass
  catA: '#2F9E6E',
  catB: '#D97706',
  neutral: '#9CA3AF',
  history: '#374151',
  target: '#D97706',
  miss: '#D1D5DB', // histogram: outcomes short of the target
};

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export function fmtCompact(n) {
  const a = Math.abs(n);
  const sign = n < 0 ? '−' : '';
  if (a >= 1e9) return `${sign}$${trim(a / 1e9)}B`;
  if (a >= 1e6) return `${sign}$${trim(a / 1e6)}M`;
  if (a >= 1e4) return `${sign}$${Math.round(a / 1e3)}K`;
  if (a >= 1e3) return `${sign}$${trim(a / 1e3)}K`;
  return `${sign}$${Math.round(a)}`;
}
function trim(x) {
  return x >= 100 ? Math.round(x).toString() : x.toFixed(1).replace(/\.0$/, '');
}

export function niceTicks(min, max, count = 4) {
  if (!(max > min)) return [min];
  const span = max - min;
  const raw = span / count;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map(f => f * mag).find(s => span / s <= count + 0.5) || 10 * mag;
  const start = Math.ceil(min / step) * step;
  const ticks = [];
  for (let v = start; v <= max + step * 1e-9; v += step) ticks.push(Math.abs(v) < step * 1e-9 ? 0 : v);
  return ticks;
}

export function addMonths(date, m) {
  const d = new Date(date.getFullYear(), date.getMonth() + m, 1);
  return d;
}

export function monthLabel(date) {
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

/**
 * Width of an element, tracked with ResizeObserver. Returns a callback ref, so
 * it keeps tracking even if the element is swapped (e.g. skeleton → chart).
 */
export function useElementWidth(fallback = 360) {
  const [el, setEl] = useState(null);
  const [width, setWidth] = useState(fallback);
  useEffect(() => {
    if (!el) return undefined;
    const ro = new ResizeObserver(entries => {
      const w = Math.round(entries[0].contentRect.width);
      if (w > 0) setWidth(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [el]);
  return [setEl, width];
}

/** Linear resample of an array to n points (keeps endpoints). */
export function resample(arr, n) {
  if (!arr || arr.length === n) return arr;
  if (n <= 1) return [arr[arr.length - 1]];
  if (arr.length === 1) return new Array(n).fill(arr[0]);
  const out = new Array(n);
  for (let i = 0; i < n; i++) {
    const pos = (i / (n - 1)) * (arr.length - 1);
    const lo = Math.floor(pos), hi = Math.min(arr.length - 1, lo + 1);
    out[i] = arr[lo] + (arr[hi] - arr[lo]) * (pos - lo);
  }
  return out;
}

function alignTo(from, to) {
  if (typeof to === 'number') return typeof from === 'number' ? from : to;
  if (Array.isArray(to)) {
    if (!Array.isArray(from)) return to;
    if (to.length && Array.isArray(to[0])) {
      return to.map((row, i) => alignTo(from[i] ?? from[from.length - 1] ?? row, row));
    }
    return resample(from, to.length);
  }
  if (to && typeof to === 'object') {
    const out = {};
    for (const k of Object.keys(to)) out[k] = alignTo(from?.[k], to[k]);
    return out;
  }
  return to;
}

function lerp(from, to, t) {
  if (typeof to === 'number') return from + (to - from) * t;
  if (Array.isArray(to)) return to.map((v, i) => lerp(from[i], v, t));
  if (to && typeof to === 'object') {
    const out = {};
    for (const k of Object.keys(to)) out[k] = lerp(from[k], to[k], t);
    return out;
  }
  return to;
}

const easeOutCubic = t => 1 - Math.pow(1 - t, 3);

/**
 * Smoothly morphs between successive values of a numeric structure (numbers,
 * arrays, nested objects). Arrays of different lengths are resampled first,
 * so changing the horizon morphs the curve instead of snapping.
 */
export function useTweened(target, duration = 520) {
  const [shown, setShown] = useState(null);
  const shownRef = useRef(null);

  useEffect(() => {
    if (target == null) return undefined;
    const from = shownRef.current;
    let raf;
    if (from == null || prefersReducedMotion()) {
      raf = requestAnimationFrame(() => {
        shownRef.current = target;
        setShown(target);
      });
      return () => cancelAnimationFrame(raf);
    }
    const start = alignTo(from, target);
    const t0 = performance.now();
    const tick = (now) => {
      const k = Math.min(1, (now - t0) / duration);
      const v = k >= 1 ? target : lerp(start, target, easeOutCubic(k));
      shownRef.current = v;
      setShown(v);
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return shown;
}

/** Animates 0→1 once after mount (for the first draw-in). */
export function useReveal(duration = 900, ready = true) {
  const [p, setP] = useState(prefersReducedMotion() ? 1 : 0);
  useEffect(() => {
    if (!ready || p >= 1) return undefined;
    let raf;
    const t0 = performance.now();
    const tick = (now) => {
      const k = Math.min(1, (now - t0) / duration);
      setP(easeOutCubic(k));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // Only runs until fully revealed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);
  return p;
}

/** Counts a number toward its new value. */
export function useAnimatedNumber(value, duration = 600) {
  const t = useTweened(Number.isFinite(value) ? { v: value } : null, duration);
  return t ? t.v : value;
}

export function linePath(xs, ys, sx, sy) {
  let d = '';
  for (let i = 0; i < xs.length; i++) {
    d += `${i ? 'L' : 'M'}${sx(xs[i]).toFixed(1)},${sy(ys[i]).toFixed(1)}`;
  }
  return d;
}

export function areaPath(xs, lo, hi, sx, sy) {
  let d = '';
  for (let i = 0; i < xs.length; i++) d += `${i ? 'L' : 'M'}${sx(xs[i]).toFixed(1)},${sy(hi[i]).toFixed(1)}`;
  for (let i = xs.length - 1; i >= 0; i--) d += `L${sx(xs[i]).toFixed(1)},${sy(lo[i]).toFixed(1)}`;
  return d + 'Z';
}
