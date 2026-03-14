import { Link, useLocation } from 'react-router-dom';
import { useProgress } from '../../context/ProgressContext';
import type { LearningDomain, OwaspVersion } from '../../types';

const versions: { label: string; version: OwaspVersion }[] = [
  { label: '2017', version: '2017' },
  { label: '2021', version: '2021' },
  { label: '2025', version: '2025' },
];

export default function Header({ onToggleSidebar, domain = 'owasp' }: { onToggleSidebar: () => void; domain?: LearningDomain }) {
  const location = useLocation();
  const { progress, dispatch } = useProgress();

  const toggleTheme = () => {
    dispatch({ type: 'SET_THEME', theme: progress.theme === 'dark' ? 'light' : 'dark' });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-700 dark:border-slate-700 bg-slate-800 dark:bg-slate-800 bg-white/80 backdrop-blur-sm" role="banner">
      <div className="flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-md hover:bg-slate-700 dark:hover:bg-slate-700 hover:bg-slate-200"
            aria-label="Toggle sidebar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <Link to="/" className="flex items-center gap-2 font-bold text-lg" title="Back to domain selector">
            <svg className="w-4 h-4 dark:text-slate-400 text-slate-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
          </Link>
          {domain === 'owasp' ? (
            <Link to="/owasp" className="flex items-center gap-2 font-bold text-lg">
              <span className="text-blue-500">OWASP</span>
              <span className="dark:text-white text-slate-900">Top 10</span>
              <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">Learn</span>
            </Link>
          ) : (
            <Link to="/sysdesign" className="flex items-center gap-2 font-bold text-lg">
              <span className="text-purple-500">System</span>
              <span className="dark:text-white text-slate-900">Design</span>
              <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">Learn</span>
            </Link>
          )}
        </div>

        <nav className="flex items-center gap-1" aria-label={domain === 'owasp' ? 'Version navigation' : 'System design navigation'}>
          {domain === 'owasp' ? (
            <>
              {versions.map(({ label, version }) => {
                const isActive = location.pathname.includes(`/version/${version}`);
                return (
                  <Link
                    key={version}
                    to={`/owasp/version/${version}`}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-500 text-white'
                        : 'dark:text-slate-300 text-slate-600 dark:hover:bg-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {label}
                  </Link>
                );
              })}
              <Link
                to="/owasp/quiz"
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  location.pathname.startsWith('/owasp/quiz')
                    ? 'bg-amber-500 text-white'
                    : 'dark:text-slate-300 text-slate-600 dark:hover:bg-slate-700 hover:bg-slate-200'
                }`}
              >
                Quiz
              </Link>
              <Link
                to="/owasp/compare"
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === '/owasp/compare'
                    ? 'bg-blue-500 text-white'
                    : 'dark:text-slate-300 text-slate-600 dark:hover:bg-slate-700 hover:bg-slate-200'
                }`}
              >
                Compare
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/sysdesign/quiz"
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  location.pathname.startsWith('/sysdesign/quiz')
                    ? 'bg-amber-500 text-white'
                    : 'dark:text-slate-300 text-slate-600 dark:hover:bg-slate-700 hover:bg-slate-200'
                }`}
              >
                Quiz
              </Link>
              <Link
                to="/sysdesign/interview"
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  location.pathname.startsWith('/sysdesign/interview')
                    ? 'bg-purple-500 text-white'
                    : 'dark:text-slate-300 text-slate-600 dark:hover:bg-slate-700 hover:bg-slate-200'
                }`}
              >
                Interviews
              </Link>
            </>
          )}
          <Link
            to="/progress"
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              location.pathname === '/progress'
                ? 'bg-blue-500 text-white'
                : 'dark:text-slate-300 text-slate-600 dark:hover:bg-slate-700 hover:bg-slate-200'
            }`}
          >
            Progress
          </Link>
          <button
            onClick={toggleTheme}
            className="ml-2 p-2 rounded-md dark:hover:bg-slate-700 hover:bg-slate-200 transition-colors"
            aria-label={`Switch to ${progress.theme === 'dark' ? 'light' : 'dark'} theme`}
          >
            {progress.theme === 'dark' ? (
              <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-slate-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            )}
          </button>
        </nav>
      </div>
    </header>
  );
}
