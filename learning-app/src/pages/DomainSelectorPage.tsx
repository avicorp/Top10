import { Link } from 'react-router-dom';
import { useProgress } from '../context/ProgressContext';
import { useVersionData } from '../hooks/useContentData';
import { useSysDesignTopics } from '../hooks/useSysDesignData';
import ProgressRing from '../components/shared/ProgressRing';

function OwaspProgress() {
  const v2025 = useVersionData('2025');
  const { isRead } = useProgress();
  const readCount = v2025.filter(v => isRead(v.slug, '2025')).length;
  const percentage = v2025.length > 0 ? Math.round((readCount / v2025.length) * 100) : 0;
  return <ProgressRing percentage={percentage} size={80} colorClass="text-blue-500" />;
}

function SysDesignProgress() {
  const topics = useSysDesignTopics();
  const { getTopicStatus } = useProgress();
  const learnedCount = topics.filter(t => getTopicStatus(t.slug) === 'learned').length;
  const percentage = topics.length > 0 ? Math.round((learnedCount / topics.length) * 100) : 0;
  return <ProgressRing percentage={percentage} size={80} colorClass="text-purple-500" />;
}

export default function DomainSelectorPage() {
  const { progress, dispatch } = useProgress();

  const toggleTheme = () => {
    dispatch({ type: 'SET_THEME', theme: progress.theme === 'dark' ? 'light' : 'dark' });
  };

  return (
    <div className="min-h-screen dark:bg-slate-900 dark:text-slate-100 bg-slate-50 text-slate-900 flex flex-col">
      <div className="absolute top-4 right-4">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-md dark:hover:bg-slate-800 hover:bg-slate-200 transition-colors"
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
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <h1 className="text-4xl font-bold mb-2 text-center">Interactive Learning</h1>
        <p className="text-lg dark:text-slate-400 text-slate-500 mb-12 text-center max-w-xl">
          Choose a learning track to begin studying. Track your progress across both domains.
        </p>

        <div className="grid md:grid-cols-2 gap-8 max-w-3xl w-full">
          {/* OWASP Card */}
          <Link
            to="/owasp"
            className="group rounded-2xl border-2 border-blue-500/30 hover:border-blue-500/60 bg-gradient-to-b from-blue-500/10 to-transparent p-8 transition-all hover:scale-[1.02]"
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="text-4xl mb-3">
                  <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold">OWASP Top 10</h2>
                <p className="text-sm dark:text-slate-400 text-slate-500 mt-2">
                  Web application security risks across three editions (2017, 2021, 2025)
                </p>
              </div>
              <OwaspProgress />
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-2 py-1 rounded-full dark:bg-slate-800 bg-slate-200">30 Vulnerabilities</span>
              <span className="px-2 py-1 rounded-full dark:bg-slate-800 bg-slate-200">102+ Quiz Questions</span>
              <span className="px-2 py-1 rounded-full dark:bg-slate-800 bg-slate-200">Version Comparison</span>
            </div>
          </Link>

          {/* System Design Card */}
          <Link
            to="/sysdesign"
            className="group rounded-2xl border-2 border-purple-500/30 hover:border-purple-500/60 bg-gradient-to-b from-purple-500/10 to-transparent p-8 transition-all hover:scale-[1.02]"
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="text-4xl mb-3">
                  <svg className="w-12 h-12 text-purple-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 01.9-2.7L5.737 5.1a3.375 3.375 0 012.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 01.9 2.7m0 0a3 3 0 01-3 3m0 3h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008zm-3 6h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold">System Design</h2>
                <p className="text-sm dark:text-slate-400 text-slate-500 mt-2">
                  Databases, caching, message queues, data structures, and interview prep
                </p>
              </div>
              <SysDesignProgress />
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-2 py-1 rounded-full dark:bg-slate-800 bg-slate-200">5 Topic Guides</span>
              <span className="px-2 py-1 rounded-full dark:bg-slate-800 bg-slate-200">36 Quiz Questions</span>
              <span className="px-2 py-1 rounded-full dark:bg-slate-800 bg-slate-200">4 Mock Interviews</span>
            </div>
          </Link>
        </div>

        <Link
          to="/progress"
          className="mt-8 text-sm dark:text-slate-400 text-slate-500 hover:text-blue-500 transition-colors"
        >
          View unified progress across both domains &#x2192;
        </Link>
      </div>
    </div>
  );
}
