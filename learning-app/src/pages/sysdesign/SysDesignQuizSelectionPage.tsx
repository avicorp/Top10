import { Link } from 'react-router-dom';
import { useSysDesignTopics, useSysDesignQuizzes } from '../../hooks/useSysDesignData';
import { useProgress } from '../../context/ProgressContext';

export default function SysDesignQuizSelectionPage() {
  const topics = useSysDesignTopics();
  const allQuizzes = useSysDesignQuizzes();
  const { progress } = useProgress();

  const getBestScore = (topicSlug: string) => {
    const attempts = progress.sysdesign.quizAttempts.filter(a => a.quizId === `sysdesign:${topicSlug}`);
    if (attempts.length === 0) return null;
    return Math.max(...attempts.map(a => Math.round((a.score / a.total) * 100)));
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link to="/sysdesign" className="text-sm dark:text-slate-400 text-slate-500 hover:text-purple-500 transition-colors">
        &#x2190; System Design
      </Link>
      <h1 className="text-3xl font-bold mb-8 mt-2">System Design Quiz</h1>

      <div className="space-y-4">
        {topics.map(topic => {
          const questionCount = allQuizzes.filter(q => q.topicSlug === topic.slug).length;
          const best = getBestScore(topic.slug);

          return (
            <Link
              key={topic.slug}
              to={`/sysdesign/quiz/${topic.slug}`}
              className="block rounded-xl dark:bg-slate-800 bg-white border dark:border-slate-700 border-slate-200 p-5 hover:border-purple-500/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold">{topic.title}</h2>
                  <p className="text-sm dark:text-slate-400 text-slate-500 mt-1">
                    {questionCount} questions
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {best !== null && (
                    <span className={`text-sm font-medium ${best >= 80 ? 'text-green-500' : best >= 60 ? 'text-amber-500' : 'text-red-500'}`}>
                      Best: {best}%
                    </span>
                  )}
                  <span className="px-4 py-2 rounded-lg text-sm font-medium bg-purple-500 text-white">
                    Start
                  </span>
                </div>
              </div>
            </Link>
          );
        })}

        {/* Mixed quiz */}
        <Link
          to="/sysdesign/quiz/mixed"
          className="block rounded-xl dark:bg-slate-800 bg-white border dark:border-slate-700 border-slate-200 p-5 hover:border-amber-500/50 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Mixed Quiz</h2>
              <p className="text-sm dark:text-slate-400 text-slate-500 mt-1">
                Questions from all topics — {allQuizzes.length} total
              </p>
            </div>
            <span className="px-4 py-2 rounded-lg text-sm font-medium bg-amber-500 text-white">
              Start
            </span>
          </div>
        </Link>
      </div>
    </div>
  );
}
