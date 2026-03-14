import type { TopicStatus } from '../../types';

const statusConfig: Record<TopicStatus, { label: string; classes: string }> = {
  learned: { label: 'Learned', classes: 'bg-green-500/20 text-green-400' },
  'read-later': { label: 'Read Later', classes: 'bg-amber-500/20 text-amber-400' },
  unread: { label: 'Unread', classes: 'dark:bg-slate-700 bg-slate-200 dark:text-slate-400 text-slate-500' },
};

export default function StatusBadge({ status }: { status: TopicStatus }) {
  const config = statusConfig[status];
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.classes}`}>
      {config.label}
    </span>
  );
}
