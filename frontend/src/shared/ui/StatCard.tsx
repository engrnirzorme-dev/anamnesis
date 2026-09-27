import clsx from 'clsx';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { haptic } from '@/shared/lib/haptic';

/**
 * Card статистики на Dashboard. Применяет классы `.stat-card.{color}` of app.css.
 *
 * Используется в Dashboard for 4 главных цифр: Left / Completed / Errors / Diagnoses.
 *
 * Принимает либо `to` (for навигации in Router) либо `onClick` for кастомной обработки.
 */

export type StatColor = 'blue' | 'green' | 'orange' | 'red' | 'purple';

interface StatCardProps {
  value: number | string;
  label: string;
  icon?: ReactNode;
  color: StatColor;
  to?: string;
  onClick?: () => void;
  className?: string;
}

export function StatCard({ value, label, icon, color, to, onClick, className }: StatCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    haptic('light');
    if (to) navigate(to);
    else if (onClick) onClick();
  };

  const isInteractive = !!(to || onClick);

  return (
    <button
      type="button"
      className={clsx('stat-card', color, className)}
      onClick={isInteractive ? handleClick : undefined}
      disabled={!isInteractive}
      style={isInteractive ? undefined : { cursor: 'default' }}
    >
      <div className="stat-value">{value}</div>
      <div className="stat-label">
        {icon}
        {label}
      </div>
    </button>
  );
}
