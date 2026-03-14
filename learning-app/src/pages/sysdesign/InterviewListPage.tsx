import { Link } from 'react-router-dom';
import { useProgress } from '../../context/ProgressContext';
import { interviews } from '../../data/sysdesign-interviews';

export default function InterviewListPage() {
  const { progress } = useProgress();

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link to="/sysdesign" className="text-sm dark:text-slate-400 text-slate-500 hover:text-purple-500 transition-colors">
        &#x2190; System Design
      </Link>
      <h1 className="text-3xl font-bold mb-2 mt-2">Mock Interviews</h1>
      <p className="dark:text-slate-400 text-slate-500 mb-8">
        Practice system design interviews with guided walkthroughs. Each session simulates a real interview with progressive design steps.
      </p>

      <div className="space-y-4">
        {interviews.map(interview => {
          const completedSteps = progress.sysdesign.interviewSteps[interview.slug]?.length || 0;
          const totalSteps = interview.steps.length;
          const isStarted = completedSteps > 0;
          const isComplete = completedSteps >= totalSteps;

          return (
            <Link
              key={interview.slug}
              to={`/sysdesign/interview/${interview.slug}`}
              className="block rounded-xl dark:bg-slate-800 bg-white border dark:border-slate-700 border-slate-200 p-6 hover:border-purple-500/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h2 className="text-lg font-semibold">{interview.title}</h2>
                  <div className="flex items-center gap-3 mt-1 text-xs">
                    <span className={`px-2 py-0.5 rounded-full font-medium ${
                      interview.difficulty === 'advanced'
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {interview.difficulty}
                    </span>
                    <span className="dark:text-slate-500 text-slate-400">~{interview.estimatedMinutes} min</span>
                    <span className="dark:text-slate-500 text-slate-400">{totalSteps} steps</span>
                  </div>
                </div>
                {isComplete ? (
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">Completed</span>
                ) : isStarted ? (
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400">{completedSteps}/{totalSteps}</span>
                ) : null}
              </div>
              <p className="text-sm dark:text-slate-400 text-slate-500 line-clamp-2">{interview.briefing}</p>

              {isStarted && (
                <div className="mt-3 h-1.5 dark:bg-slate-700 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full transition-all"
                    style={{ width: `${(completedSteps / totalSteps) * 100}%` }}
                  />
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
