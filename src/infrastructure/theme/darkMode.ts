// HU_1.2.1 — modo oscuro automático entre 7:00 p.m. y 6:00 a.m.
export const isDarkModeHour = (): boolean => {
  const hour = new Date().getHours();
  return hour >= 19 || hour < 6;
};

// HU_1.2.2 — duración máxima de transiciones: 300ms
export const TRANSITION_DURATION = 300;
