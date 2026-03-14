import { Link, useLocation, useParams } from 'react-router-dom';
import { useVersionData } from '../../hooks/useContentData';
import { useProgress } from '../../context/ProgressContext';
import type { OwaspVersion } from '../../types';

export default function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { version } = useParams<{ version: string }>();
  const currentVersion = (version as OwaspVersion) || '2025';
  const vulns = useVersionData(currentVersion);
  const { isRead } = useProgress();
  const location = useLocation();

  if (!location.pathname.includes('/version/')) return null;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={`fixed lg:sticky top-14 left-0 z-30 h-[calc(100vh-3.5rem)] w-64 overflow-y-auto border-r
          dark:border-slate-700 dark:bg-slate-800 border-slate-200 bg-white
          transform transition-transform duration-200 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        role="navigation"
        aria-label="Vulnerability list"
      >
        <div className="p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider dark:text-slate-400 text-slate-500 mb-3">
            {currentVersion} Top 10
          </h2>
          <ul className="space-y-1">
            {vulns.map(vuln => {
              const isActive = location.pathname.includes(vuln.slug);
              const read = isRead(vuln.slug, currentVersion);
              return (
                <li key={vuln.slug}>
                  <Link
                    to={`/owasp/version/${currentVersion}/${vuln.slug}`}
                    onClick={onClose}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                      isActive
                        ? 'bg-blue-500/20 text-blue-400 font-medium'
                        : 'dark:text-slate-300 text-slate-600 dark:hover:bg-slate-700/50 hover:bg-slate-100'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      read ? 'bg-green-500' : 'dark:bg-slate-600 bg-slate-300'
                    }`} aria-label={read ? 'Read' : 'Unread'} />
                    <span className="font-mono text-xs dark:text-slate-500 text-slate-400">{vuln.id}</span>
                    <span className="truncate">{vuln.title}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </aside>
    </>
  );
}
