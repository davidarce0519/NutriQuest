// HU_1.2 — modo oscuro automático por horario configurable
// Evalúa si la hora actual está dentro del rango [startHour, endHour)
// Soporta rangos nocturnos que cruzan la medianoche (ej. 19 → 6)
export const isDarkModeHour = (startHour: number, endHour: number): boolean => {
  const hour = new Date().getHours();
  if (startHour > endHour) {
    return hour >= startHour || hour < endHour;
  }
  return hour >= startHour && hour < endHour;
};

// Colores del tema oscuro
export const DARK_COLORS = {
  BG:             '#121212',
  SURFACE:        '#1e1e1e',
  SURFACE2:       '#252525',
  TEXT_PRIMARY:   '#ffffff',
  TEXT_SECONDARY: '#94a3b8',
  BORDER:         '#334155',
  GREEN:          '#22c55e',
  GREEN_DARK:     '#052e16',
  GREEN_LIGHT:    '#bbf7d0',
};

// Colores del tema claro (paleta NutriQuest)
export const LIGHT_COLORS = {
  BG:             '#f5f5f0',
  SURFACE:        '#ffffff',
  SURFACE2:       '#f8fafc',
  TEXT_PRIMARY:   '#042901',
  TEXT_SECONDARY: '#64748b',
  BORDER:         '#e2e8f0',
  GREEN:          '#1a6b0a',
  GREEN_DARK:     '#042901',
  GREEN_LIGHT:    '#c1d9b7',
};
