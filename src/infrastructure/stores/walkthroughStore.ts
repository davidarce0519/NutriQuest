import { create } from 'zustand';

export interface TargetMeasure {
  pageX: number;
  pageY: number;
  width: number;
  height: number;
}

interface WalkthroughState {
  active: boolean;
  stepIndex: number;
  measure: TargetMeasure | null;
  setActive: (v: boolean) => void;
  setStepIndex: (i: number) => void;
  setMeasure: (m: TargetMeasure | null) => void;
}

export const useWalkthroughStore = create<WalkthroughState>((set) => ({
  active: false,
  stepIndex: 0,
  measure: null,
  setActive:    (active)    => set({ active }),
  setStepIndex: (stepIndex) => set({ stepIndex }),
  setMeasure:   (measure)   => set({ measure }),
}));
