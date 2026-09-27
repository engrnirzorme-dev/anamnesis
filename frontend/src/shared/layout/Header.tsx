import { useLocation } from 'react-router';
import { PatientSwitcher } from './PatientSwitcher';
import { useIsDesktop } from '@/shared/hooks/useMediaQuery';

/**
 * Хедер приложения.
 *
 * На мобилке — фиксированный сверху, с заголовком и patient switcher справа.
 * На десктопе — упрощённый хедер внутри main area (не фиксированный),
 * т.к. навигация полностью делается in sidebar. Patient switcher уже
 * есть в sidebar, но оставляем и в хедере как задел на будущее.
 */

// Map соответствия роут → заголовок
const TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/plan': 'Plan',
  '/errors': 'Errors',
  '/documents': 'Visits',
  '/diagnoses': 'Diagnoses',
  '/more': 'More',
  '/more/specialists': 'Specialists',
  '/more/medications': 'Medications',
  '/more/vaccinations': 'Vaccinations',
  '/more/growth': 'Growth & Weight',
  '/more/labs': 'Lab Results',
  '/more/reminders': 'Reminders',
  '/more/ai-chat': 'AI Chat',
  '/more/search': 'Search',
  '/more/history': 'History',
  '/graph': 'Health Graph',
};

function getTitleForPath(pathname: string): string {
  // Сначала ищем точное совпадение (длинные пути приоритетнее)
  const sorted = Object.entries(TITLES).sort((a, b) => b[0].length - a[0].length);
  for (const [route, title] of sorted) {
    if (pathname === route || pathname.startsWith(`${route}/`)) return title;
  }
  return 'Health';
}

export function Header() {
  const location = useLocation();
  const isDesktop = useIsDesktop();
  const title = getTitleForPath(location.pathname);

  if (isDesktop) {
    return (
      <header className="ds-header">
        <h1 className="ds-header-title">{title}</h1>
      </header>
    );
  }

  return (
    <header className="header" id="header">
      <div
        className="header-content"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
      >
        <div>
          <h1 className="header-title">{title}</h1>
          <p className="header-subtitle" />
        </div>
        <PatientSwitcher />
      </div>
    </header>
  );
}
