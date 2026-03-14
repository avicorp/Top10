import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useProgress } from '../context/ProgressContext';
import { useVersionData } from '../hooks/useContentData';
import { useSysDesignTopics } from '../hooks/useSysDesignData';
import { interviews } from '../data/sysdesign-interviews';
import ProgressRing from '../components/shared/ProgressRing';
import type { OwaspVersion } from '../types';

function OwaspCompletionRing({ version, color }: { version: OwaspVersion; color: string }) {
  const vulns = useVersionData(version);
  const { isRead } = useProgress();
  const readCount = vulns.filter(v => isRead(v.slug, version)).length;
  const percentage = vulns.length > 0 ? Math.round((readCount / vulns.length) * 100) : 0;

  return <ProgressRing percentage={percentage} size={96} colorClass={color} label={version} sublabel={`${readCount}/${vulns.length}`} />;
}

function SysDesignCompletionRing() {
  const topics = useSysDesignTopics();
  const { getTopicStatus } = useProgress();
  const learnedCount = topics.filter(t => getTopicStatus(t.slug) === 'learned').length;
  const percentage = topics.length > 0 ? Math.round((learnedCount / topics.length) * 100) : 0;

  return <ProgressRing percentage={percentage} size={96} colorClass="text-purple-500" label="Topics" sublabel={`${learnedCount}/${topics.length}`} />;
}

function InterviewCompletionRing() {
  const { progress } = useProgress();
  const completedCount = interviews.filter(
    i => (progress.sysdesign.interviewSteps[i.slug]?.length || 0) >= i.steps.length
  ).length;
  const percentage = interviews.length > 0 ? Math.round((completedCount / interviews.length) * 100) : 0;

  return <ProgressRing percentage={percentage} size={96} colorClass="text-pink-500" label="Interviews" sublabel={`${completedCount}/${interviews.length}`} />;
}

export default function ProgressPage() {
  const { progress, dispatch, exportProgress } = useProgress();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  const bookmarked = Object.values(progress.vulnerabilities).filter(v => v.bookmarked);
  const owaspAttempts = [...progress.quizAttempts].sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);
  const sysdesignAttempts = [...progress.sysdesign.quizAttempts].sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);

  const handleExport = () => {
    const blob = new Blob([exportProgress()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `learning-progress-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (data.schemaVersion) {
          dispatch({ type: 'IMPORT_PROGRESS', progress: data });
        }
      } catch { /* ignore invalid files */ }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Your Progress</h1>

      {/* OWASP Completion */}
      <div className="rounded-xl dark:bg-slate-800 bg-white border dark:border-slate-700 border-slate-200 p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">
          <Link to="/owasp" className="hover:text-blue-500 transition-colors">OWASP Top 10</Link>
        </h2>
        <div className="flex justify-around">
          <OwaspCompletionRing version="2017" color="text-amber-500" />
          <OwaspCompletionRing version="2021" color="text-emerald-500" />
          <OwaspCompletionRing version="2025" color="text-blue-500" />
        </div>
      </div>

      {/* System Design Completion */}
      <div className="rounded-xl dark:bg-slate-800 bg-white border dark:border-slate-700 border-slate-200 p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">
          <Link to="/sysdesign" className="hover:text-purple-500 transition-colors">System Design</Link>
        </h2>
        <div className="flex justify-around">
          <SysDesignCompletionRing />
          <InterviewCompletionRing />
        </div>
      </div>

      {/* Quiz History - OWASP */}
      <div className="rounded-xl dark:bg-slate-800 bg-white border dark:border-slate-700 border-slate-200 p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">OWASP Quiz History</h2>
        {owaspAttempts.length === 0 ? (
          <p className="text-sm dark:text-slate-400 text-slate-500">No OWASP quizzes completed yet.{' '}
            <Link to="/owasp/quiz" className="text-blue-500 hover:text-blue-400">Take one now</Link>
          </p>
        ) : (
          <div className="space-y-2">
            {owaspAttempts.map((attempt, i) => {
              const pct = Math.round((attempt.score / attempt.total) * 100);
              return (
                <div key={i} className="flex items-center gap-4 text-sm">
                  <span className="dark:text-slate-500 text-slate-400 min-w-[5rem]">
                    {new Date(attempt.timestamp).toLocaleDateString()}
                  </span>
                  <span className="min-w-[6rem] font-mono dark:text-slate-400 text-slate-500">{attempt.quizId}</span>
                  <div className="flex-1 h-2 dark:bg-slate-700 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${pct >= 80 ? 'bg-green-500' : pct >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="font-medium min-w-[3rem] text-right">{pct}%</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quiz History - System Design */}
      <div className="rounded-xl dark:bg-slate-800 bg-white border dark:border-slate-700 border-slate-200 p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">System Design Quiz History</h2>
        {sysdesignAttempts.length === 0 ? (
          <p className="text-sm dark:text-slate-400 text-slate-500">No system design quizzes completed yet.{' '}
            <Link to="/sysdesign/quiz" className="text-purple-500 hover:text-purple-400">Take one now</Link>
          </p>
        ) : (
          <div className="space-y-2">
            {sysdesignAttempts.map((attempt, i) => {
              const pct = Math.round((attempt.score / attempt.total) * 100);
              return (
                <div key={i} className="flex items-center gap-4 text-sm">
                  <span className="dark:text-slate-500 text-slate-400 min-w-[5rem]">
                    {new Date(attempt.timestamp).toLocaleDateString()}
                  </span>
                  <span className="min-w-[6rem] font-mono dark:text-slate-400 text-slate-500">{attempt.quizId}</span>
                  <div className="flex-1 h-2 dark:bg-slate-700 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${pct >= 80 ? 'bg-green-500' : pct >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="font-medium min-w-[3rem] text-right">{pct}%</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bookmarks */}
      <div className="rounded-xl dark:bg-slate-800 bg-white border dark:border-slate-700 border-slate-200 p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Bookmarks</h2>
        {bookmarked.length === 0 ? (
          <p className="text-sm dark:text-slate-400 text-slate-500">No bookmarked vulnerabilities yet.</p>
        ) : (
          <div className="space-y-1">
            {bookmarked.map(vp => (
              <Link
                key={`${vp.version}:${vp.slug}`}
                to={`/owasp/version/${vp.version}/${vp.slug}`}
                className="flex items-center gap-2 px-3 py-2 rounded-lg dark:hover:bg-slate-700 hover:bg-slate-100 text-sm transition-colors"
              >
                <span className="text-amber-400">&#9733;</span>
                <span className="font-mono dark:text-slate-500 text-slate-400">{vp.version}</span>
                <span>{vp.slug}</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Export/Import */}
      <div className="rounded-xl dark:bg-slate-800 bg-white border dark:border-slate-700 border-slate-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Data Management</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleExport}
            className="px-4 py-2 rounded-lg dark:bg-slate-700 bg-slate-200 text-sm font-medium dark:hover:bg-slate-600 hover:bg-slate-300 transition-colors"
          >
            Export Progress
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 rounded-lg dark:bg-slate-700 bg-slate-200 text-sm font-medium dark:hover:bg-slate-600 hover:bg-slate-300 transition-colors"
          >
            Import Progress
          </button>
          <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />

          {showConfirmReset ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-red-500">Are you sure?</span>
              <button
                onClick={() => { dispatch({ type: 'RESET' }); setShowConfirmReset(false); }}
                className="px-3 py-2 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors"
              >
                Yes, reset
              </button>
              <button
                onClick={() => setShowConfirmReset(false)}
                className="px-3 py-2 rounded-lg dark:bg-slate-700 bg-slate-200 text-sm dark:hover:bg-slate-600 hover:bg-slate-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowConfirmReset(true)}
              className="px-4 py-2 rounded-lg text-sm font-medium text-red-500 border border-red-500/30 hover:bg-red-500/10 transition-colors"
            >
              Reset All Progress
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
