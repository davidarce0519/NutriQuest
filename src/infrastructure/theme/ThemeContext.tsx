import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNotificationStore } from '../stores/notificationStore';
import { isDarkModeActiveUseCase } from '../../domain/usecases/notifications';

interface ThemeContextType {
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType>({ isDark: false });

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const settings = useNotificationStore((s) => s.settings);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const evaluate = () => {
      if (!settings) {
        setIsDark(false);
        return;
      }
      setIsDark(isDarkModeActiveUseCase(settings));
    };

    evaluate();

    // Re-evaluar cada minuto para el cambio automático por hora
    const timer = setInterval(evaluate, 60_000);
    return () => clearInterval(timer);
  }, [settings]);

  return (
    <ThemeContext.Provider value={{ isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
