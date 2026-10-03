import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../services/api';
import { FORECAST_HOURS } from '../types';
import type { ForecastState, ScenarioPersistence, RobustnessCell, Cycle } from '../types';

export function useForecastState(hour: number, scaleKm: number) {
  const [data, setData] = useState<ForecastState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api.getForecastState(hour, scaleKm)
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [hour, scaleKm]);

  return { data, loading, error };
}

export function useScenarios(scaleKm: number) {
  const [scenarios, setScenarios] = useState<ScenarioPersistence[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.getScenarios(scaleKm)
      .then(setScenarios)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [scaleKm]);

  return { scenarios, loading };
}

export function useScaleAnalysis() {
  const [matrix, setMatrix] = useState<RobustnessCell[]>([]);

  useEffect(() => {
    api.getScaleAnalysis()
      .then(setMatrix)
      .catch(console.error);
  }, []);

  return { matrix };
}

export function useCycles() {
  const [cycles, setCycles] = useState<Cycle[]>([]);

  useEffect(() => {
    api.getCycles()
      .then(setCycles)
      .catch(console.error);
  }, []);

  return { cycles };
}

export function useForecastReplay(onHourChange: (h: number) => void) {
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hourIndexRef = useRef(0);

  const start = useCallback((startHour: number) => {
    hourIndexRef.current = FORECAST_HOURS.indexOf(startHour);
    if (hourIndexRef.current < 0) hourIndexRef.current = 0;
    setIsPlaying(true);
  }, []);

  const stop = useCallback(() => {
    setIsPlaying(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        hourIndexRef.current += 1;
        if (hourIndexRef.current >= FORECAST_HOURS.length) {
          stop();
          return;
        }
        onHourChange(FORECAST_HOURS[hourIndexRef.current]);
      }, 1200);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isPlaying, onHourChange, stop]);

  return { isPlaying, start, stop };
}
