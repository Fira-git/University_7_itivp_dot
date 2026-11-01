import { useState, useEffect } from 'react';

// Хук задерживает обновление значения на переданный delay (по умолчанию 300мс)
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Очищаем таймаут, если пользователь продолжает печатать
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}