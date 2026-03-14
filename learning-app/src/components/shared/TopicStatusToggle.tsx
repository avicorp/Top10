import { useProgress } from '../../context/ProgressContext';
import type { TopicStatus } from '../../types';

const statuses: { value: TopicStatus; label: string; color: string }[] = [
  { value: 'learned', label: 'Learned', color: 'bg-green-500 text-white' },
  { value: 'read-later', label: 'Read Later', color: 'bg-amber-500 text-white' },
  { value: 'unread', label: 'Unread', color: 'dark:bg-slate-700 bg-slate-200 dark:text-slate-300 text-slate-600' },
];

export default function TopicStatusToggle({ slug }: { slug: string }) {
  const { getTopicStatus, dispatch } = useProgress();
  const current = getTopicStatus(slug);

  return (
    <div className="flex gap-1">
      {statuses.map(({ value, label, color }) => (
        <button
          key={value}
          onClick={() => dispatch({ type: 'SET_TOPIC_STATUS', slug, status: value })}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
            current === value ? color : 'dark:bg-slate-800 bg-slate-100 dark:text-slate-500 text-slate-400 hover:opacity-80'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
