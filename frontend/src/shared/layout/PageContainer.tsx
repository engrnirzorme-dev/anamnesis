import type { ReactNode } from 'react';
import clsx from 'clsx';

/**
 * Обёртка for контента страницы. Yesёт правильные padding'и (учёт header + tab-bar)
 * и классы for page-transition анимации.
 *
 * ИСПОЛЬЗОВАНИЕ: оборачивай содержимое каждой страницы:
 * ```tsx
 * export function PlanPage() {
 *   return (
 *     <PageContainer>
 *       <PlanContent />
 *       <Outlet />
 *     </PageContainer>
 *   );
 * }
 * ```
 */

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

export function PageContainer({ children, className }: PageContainerProps) {
  return <div className={clsx('page-container', className)}>{children}</div>;
}
