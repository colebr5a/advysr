import { useMemo } from 'react';
import { runAdviceEngine } from '../engine/adviceEngine.js';

export function useAdvice(profile) {
  return useMemo(() => profile ? runAdviceEngine(profile) : null, [profile]);
}
