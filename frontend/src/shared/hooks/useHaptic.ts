import { useCallback } from 'react';
import { haptic, type HapticKind } from '@/shared/lib/haptic';

/**
 * React-обёртка над `haptic()` of `shared/lib/haptic.ts`.
 * Возвращает мемоofированную функцию, удобно передавать в onClick.
 *
 * Пример:
 * ```tsx
 * const hap = useHaptic();
 * <button onClick={() => { hap('light'); doSomething(); }}>
 * ```
 *
 * Для самых hourтых случаев (Button, TabBar) haptic уже встроен — используй этот
 * хук только когда нужно вызвать тактильную вибрацию of кастомного кода.
 */
export function useHaptic(): (kind?: HapticKind) => void {
  return useCallback((kind?: HapticKind) => haptic(kind), []);
}
