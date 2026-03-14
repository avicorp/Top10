import { Link } from 'react-router-dom';
import { useSysDesignTopics } from '../../hooks/useSysDesignData';
import { useProgress } from '../../context/ProgressContext';
import StatusBadge from '../../components/shared/StatusBadge';
import { interviews } from '../../data/sysdesign-interviews';

const topicDescriptions: Record<string, string> = {
  'caching-strategies': 'Cache placement, population strategies, eviction policies, and failure patterns.',
  'data-structures': 'Bloom filters, skip lists, LSM-trees, tries, and other structures used at scale.',
  'db-design': 'Relational, document, key-value, wide-column, graph, and time-series databases.',
  'message-queues': 'Kafka, RabbitMQ, SQS, messaging patterns, and delivery guarantees.',
  'decision-framework': 'Quick-reference decision trees for choosing the right technology.',
};

export default function SysDesignHomePage() {
  const topics = useSysDesignTopics();
  const { getTopicStatus, progress } = useProgress();

  const learnedCount = topics.filter(t => getTopicStatus(t.slug) === 'learned').length;
  const quizCount = progress.sysdesign.quizAttempts.length;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          <span className="text-purple-500">System Design</span> Learning
        </h1>
        <p className="dark:text-slate-400 text-slate-500">
          Master the building blocks of distributed systems. Study topics, test with quizzes, and practice with mock interviews.
        </p>
        <div className="flex gap-4 mt-3 text-sm dark:text-slate-400 text-slate-500">
          <span>{learnedCount}/{topics.length} topics learned</span>
          {quizCount > 0 && <span>{quizCount} quizzes completed</span>}
        </div>
      </div>

      {/* Topics Grid */}
      <h2 className="text-xl font-semibold mb-4">Topics</h2>
      <div className="grid md:grid-cols-2 gap-4 mb-10">
        {topics.map(topic => {
          const status = getTopicStatus(topic.slug);
          return (
            <Link
              key={topic.slug}
              to={`/sysdesign/topic/${topic.slug}`}
              className="group block rounded-xl border dark:border-slate-700 border-slate-200 dark:bg-slate-800 bg-white p-5 transition-all hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/5"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold dark:group-hover:text-purple-400 group-hover:text-purple-600 transition-colors">
                  {topic.title}
                </h3>
                <StatusBadge status={status} />
              </div>
              <p className="text-sm dark:text-slate-400 text-slate-500 mb-3">
                {topicDescriptions[topic.slug] || `${topic.sections.length} sections to explore.`}
              </p>
              <div className="flex gap-3 text-xs dark:text-slate-500 text-slate-400">
                <span>{topic.sections.length} sections</span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Interview Sessions */}
      <h2 className="text-xl font-semibold mb-4">Mock Interviews</h2>
      <div className="grid md:grid-cols-2 gap-4 mb-10">
        {interviews.map(interview => {
          const completedSteps = progress.sysdesign.interviewSteps[interview.slug]?.length || 0;
          const totalSteps = interview.steps.length;
          return (
            <Link
              key={interview.slug}
              to={`/sysdesign/interview/${interview.slug}`}
              className="group block rounded-xl border dark:border-slate-700 border-slate-200 dark:bg-slate-800 bg-white p-5 transition-all hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/5"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold dark:group-hover:text-purple-400 group-hover:text-purple-600 transition-colors">
                  {interview.title}
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  interview.difficulty === 'advanced'
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-amber-500/20 text-amber-400'
                }`}>
                  {interview.difficulty}
                </span>
              </div>
              <p className="text-sm dark:text-slate-400 text-slate-500 mb-3 line-clamp-2">
                {interview.briefing}
              </p>
              <div className="flex gap-3 text-xs dark:text-slate-500 text-slate-400">
                <span>~{interview.estimatedMinutes} min</span>
                <span>{totalSteps} steps</span>
                {completedSteps > 0 && <span className="text-green-500">{completedSteps}/{totalSteps} completed</span>}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick Links */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Link
          to="/sysdesign/quiz"
          className="rounded-xl dark:bg-slate-800 bg-white border dark:border-slate-700 border-slate-200 p-5 hover:border-amber-500/50 transition-colors"
        >
          <h3 className="font-semibold mb-1">Test Your Knowledge</h3>
          <p className="text-sm dark:text-slate-400 text-slate-500">
            {quizCount > 0 ? `${quizCount} quizzes completed` : 'Take a quiz on any topic'}
          </p>
        </Link>
        <Link
          to="/progress"
          className="rounded-xl dark:bg-slate-800 bg-white border dark:border-slate-700 border-slate-200 p-5 hover:border-green-500/50 transition-colors"
        >
          <h3 className="font-semibold mb-1">Your Progress</h3>
          <p className="text-sm dark:text-slate-400 text-slate-500">
            Track your learning across all domains
          </p>
        </Link>
      </div>
    </div>
  );
}
