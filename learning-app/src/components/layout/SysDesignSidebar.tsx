import { Link, useLocation } from 'react-router-dom';
import { useSysDesignTopics } from '../../hooks/useSysDesignData';
import { useProgress } from '../../context/ProgressContext';
import type { TopicStatus } from '../../types';
import { interviews } from '../../data/sysdesign-interviews';

const statusDot: Record<TopicStatus, string> = {
  learned: 'bg-green-500',
  'read-later': 'bg-amber-500',
  unread: 'dark:bg-slate-600 bg-slate-300',
};

export default function SysDesignSidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const topics = useSysDesignTopics();
  const { getTopicStatus } = useProgress();
  const location = useLocation();

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={`fixed lg:sticky top-14 left-0 z-30 h-[calc(100vh-3.5rem)] w-64 overflow-y-auto border-r
          dark:border-slate-700 dark:bg-slate-800 border-slate-200 bg-white
          transform transition-transform duration-200 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        role="navigation"
        aria-label="System design topics"
      >
        <div className="p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider dark:text-slate-400 text-slate-500 mb-3">
            Topics
          </h2>
          <ul className="space-y-1">
            {topics.map(topic => {
              const isActive = location.pathname.includes(`/topic/${topic.slug}`);
              const status = getTopicStatus(topic.slug);
              return (
                <li key={topic.slug}>
                  <Link
                    to={`/sysdesign/topic/${topic.slug}`}
                    onClick={onClose}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                      isActive
                        ? 'bg-purple-500/20 text-purple-400 font-medium'
                        : 'dark:text-slate-300 text-slate-600 dark:hover:bg-slate-700/50 hover:bg-slate-100'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusDot[status]}`} />
                    <span className="truncate">{topic.title}</span>
                  </Link>
                </li>
              );
            })}
          </ul>

          <h2 className="text-sm font-semibold uppercase tracking-wider dark:text-slate-400 text-slate-500 mb-3 mt-6">
            Interviews
          </h2>
          <ul className="space-y-1">
            {interviews.map(interview => {
              const isActive = location.pathname.includes(`/interview/${interview.slug}`);
              return (
                <li key={interview.slug}>
                  <Link
                    to={`/sysdesign/interview/${interview.slug}`}
                    onClick={onClose}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                      isActive
                        ? 'bg-purple-500/20 text-purple-400 font-medium'
                        : 'dark:text-slate-300 text-slate-600 dark:hover:bg-slate-700/50 hover:bg-slate-100'
                    }`}
                  >
                    <span className="truncate">{interview.title}</span>
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
