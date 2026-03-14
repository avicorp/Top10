import { Link } from 'react-router-dom';
import { useProgress } from '../context/ProgressContext';
import { useVersionData } from '../hooks/useContentData';
import type { OwaspVersion } from '../types';

const versionInfo: { version: OwaspVersion; color: string; description: string }[] = [
  { version: '2025', color: 'blue', description: 'The latest edition with expanded supply chain and exceptional condition coverage.' },
  { version: '2021', color: 'emerald', description: 'Introduced Insecure Design and Server-Side Request Forgery categories.' },
  { version: '2017', color: 'amber', description: 'The classic edition covering injection, XSS, and XXE as standalone categories.' },
];

function VersionCard({ version, color, description }: { version: OwaspVersion; color: string; description: string }) {
  const vulns = useVersionData(version);
  const { progress, isRead } = useProgress();
  const readCount = vulns.filter(v => isRead(v.slug, version)).length;
  const percentage = vulns.length > 0 ? Math.round((readCount / vulns.length) * 100) : 0;

  const quizAttempts = progress.quizAttempts.filter(a => a.quizId.includes(version));
  const avgScore = quizAttempts.length > 0
    ? Math.round(quizAttempts.reduce((s, a) => s + (a.score / a.total) * 100, 0) / quizAttempts.length)
    : 0;

  const colorMap: Record<string, string> = {
    blue: 'from-blue-500/20 to-blue-600/5 border-blue-500/30 hover:border-blue-500/60',
    emerald: 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/30 hover:border-emerald-500/60',
    amber: 'from-amber-500/20 to-amber-600/5 border-amber-500/30 hover:border-amber-500/60',
  };

  const ringColor: Record<string, string> = {
    blue: 'text-blue-500',
    emerald: 'text-emerald-500',
    amber: 'text-amber-500',
  };

  return (
    <Link
      to={`/owasp/version/${version}`}
      className={`block rounded-xl border bg-gradient-to-b p-6 transition-all duration-200 hover:scale-[1.02] ${colorMap[color]}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-2xl font-bold">{version} Edition</h3>
          <p className="text-sm dark:text-slate-400 text-slate-500 mt-1">{description}</p>
        </div>
        <div className="relative w-16 h-16">
          <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              className="dark:text-slate-700 text-slate-200"
            />
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeDasharray={`${percentage}, 100`}
              className={ringColor[color]}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">
            {percentage}%
          </span>
        </div>
      </div>
      <div className="flex gap-4 text-sm dark:text-slate-400 text-slate-500">
        <span>{readCount}/{vulns.length} studied</span>
        {quizAttempts.length > 0 && <span>Avg quiz: {avgScore}%</span>}
      </div>
    </Link>
  );
}

export default function HomePage() {
  const { progress } = useProgress();
  const totalAttempts = progress.quizAttempts.length;
  const bookmarkedCount = Object.values(progress.vulnerabilities).filter(v => v.bookmarked).length;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">
          <span className="text-blue-500">OWASP</span> Top 10 Interactive Learning
        </h1>
        <p className="text-lg dark:text-slate-400 text-slate-500 max-w-2xl mx-auto">
          Study the most critical web application security risks across three editions.
          Take quizzes, compare versions, and track your progress.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-12">
        {versionInfo.map(info => (
          <VersionCard key={info.version} {...info} />
        ))}
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-12">
        <Link
          to="/owasp/quiz"
          className="rounded-xl dark:bg-slate-800 bg-white border dark:border-slate-700 border-slate-200 p-6 hover:border-amber-500/50 transition-colors"
        >
          <div className="text-3xl mb-2">&#x1F9E0;</div>
          <h3 className="font-semibold mb-1">Test Your Knowledge</h3>
          <p className="text-sm dark:text-slate-400 text-slate-500">
            {totalAttempts > 0 ? `${totalAttempts} quizzes completed` : 'Take a quiz on any version or topic'}
          </p>
        </Link>
        <Link
          to="/owasp/compare"
          className="rounded-xl dark:bg-slate-800 bg-white border dark:border-slate-700 border-slate-200 p-6 hover:border-blue-500/50 transition-colors"
        >
          <div className="text-3xl mb-2">&#x1F504;</div>
          <h3 className="font-semibold mb-1">Compare Versions</h3>
          <p className="text-sm dark:text-slate-400 text-slate-500">
            See how vulnerabilities evolved across 2017, 2021, and 2025
          </p>
        </Link>
        <Link
          to="/progress"
          className="rounded-xl dark:bg-slate-800 bg-white border dark:border-slate-700 border-slate-200 p-6 hover:border-green-500/50 transition-colors"
        >
          <div className="text-3xl mb-2">&#x1F4CA;</div>
          <h3 className="font-semibold mb-1">Your Progress</h3>
          <p className="text-sm dark:text-slate-400 text-slate-500">
            {bookmarkedCount > 0 ? `${bookmarkedCount} bookmarked` : 'Track your learning journey'}
          </p>
        </Link>
      </div>

      <div className="rounded-xl dark:bg-slate-800/50 bg-white border dark:border-slate-700 border-slate-200 p-6">
        <h2 className="text-lg font-semibold mb-3">Quick Start</h2>
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          <Link to="/owasp/version/2025" className="flex items-center gap-2 dark:text-slate-300 text-slate-600 dark:hover:text-white hover:text-slate-900 transition-colors">
            <span className="text-blue-500">&#x2192;</span> Start with the latest 2025 edition
          </Link>
          <Link to="/owasp/quiz/2025" className="flex items-center gap-2 dark:text-slate-300 text-slate-600 dark:hover:text-white hover:text-slate-900 transition-colors">
            <span className="text-amber-500">&#x2192;</span> Jump straight to a quiz
          </Link>
          <Link to="/owasp/compare" className="flex items-center gap-2 dark:text-slate-300 text-slate-600 dark:hover:text-white hover:text-slate-900 transition-colors">
            <span className="text-emerald-500">&#x2192;</span> See what changed between versions
          </Link>
          <Link to="/owasp/version/2025/a05-2025-injection" className="flex items-center gap-2 dark:text-slate-300 text-slate-600 dark:hover:text-white hover:text-slate-900 transition-colors">
            <span className="text-red-500">&#x2192;</span> Study Injection vulnerabilities
          </Link>
        </div>
      </div>
    </div>
  );
}
