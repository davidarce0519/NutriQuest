import { create } from 'zustand';
import { HealthProfile, HealthMeasurement } from '../../domain/models';

interface HealthState {
  profile:      HealthProfile | null;
  measurements: HealthMeasurement[];
  setProfile:   (p: HealthProfile) => void;
  setMeasurements: (m: HealthMeasurement[]) => void;
  addMeasurement:  (m: HealthMeasurement) => void;
  clear: () => void;
}

export const useHealthStore = create<HealthState>((set) => ({
  profile:      null,
  measurements: [],

  setProfile:      (p) => set({ profile: p }),
  setMeasurements: (m) => set({ measurements: m }),
  addMeasurement:  (m) => set((s) => ({ measurements: [m, ...s.measurements] })),
  clear:           ()  => set({ profile: null, measurements: [] }),
}));
