import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuizQuestions, useVersionData } from '../hooks/useContentData';
import { useProgress } from '../context/ProgressContext';
import type { OwaspVersion, QuizQuestion } from '../types';

function QuizSelection() {
  const v2025 = useVersionData('2025');
  const v2021 = useVersionData('2021');
  const v2017 = useVersionData('2017');

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Quiz</h1>

      <div className="space-y-6">
        {[
          { version: '2025' as const, vulns: v2025, color: 'blue' },
          { version: '2021' as const, vulns: v2021, color: 'emerald' },
          { version: '2017' as const, vulns: v2017, color: 'amber' },
        ].map(({ version, vulns, color }) => (
          <div key={version} className="rounded-xl dark:bg-slate-800 bg-white border dark:border-slate-700 border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">{version} Edition</h2>
              <Link
                to={`/quiz/${version}`}
                className={`px-4 py-2 rounded-lg text-sm font-medium bg-${color}-500 text-white hover:bg-${color}-600 transition-colors`}
              >
                All {version} Questions
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 gap-2">
              {vulns.map(v => (
                <Link
                  key={v.slug}
                  to={`/quiz/${version}/${v.slug}`}
                  className="px-3 py-2 rounded-lg text-sm dark:hover:bg-slate-700 hover:bg-slate-100 transition-colors dark:text-slate-300 text-slate-600"
                >
                  <span className="font-mono dark:text-slate-500 text-slate-400 mr-2">{v.id}</span>
                  {v.title}
                </Link>
              ))}
            </div>
          </div>
        ))}

        <Link
          to="/quiz/cross-version"
          className="block rounded-xl dark:bg-slate-800 bg-white border dark:border-slate-700 border-slate-200 p-5 hover:border-purple-500/50 transition-colors"
        >
          <h2 className="text-xl font-bold mb-1">Cross-Version Quiz</h2>
          <p className="text-sm dark:text-slate-400 text-slate-500">Test your knowledge of how vulnerabilities evolved across editions</p>
        </Link>
      </div>
    </div>
  );
}

function QuestionCard({ question, onAnswer, answered, selectedIndex }: {
  question: QuizQuestion;
  onAnswer: (idx: number) => void;
  answered: boolean;
  selectedIndex: number | null;
}) {
  return (
    <div className="rounded-xl dark:bg-slate-800 bg-white border dark:border-slate-700 border-slate-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
          question.difficulty === 'beginner' ? 'bg-green-500/20 text-green-400' :
          question.difficulty === 'intermediate' ? 'bg-amber-500/20 text-amber-400' :
          'bg-red-500/20 text-red-400'
        }`}>
          {question.difficulty}
        </span>
        <span className="px-2 py-0.5 rounded-full text-xs font-medium dark:bg-slate-700 bg-slate-200 dark:text-slate-400 text-slate-500">
          {question.type.replace('_', ' ')}
        </span>
      </div>

      <h3 className="text-lg font-semibold mb-2 whitespace-pre-line">{question.question}</h3>

      {question.codeSnippet && (
        <pre className="rounded-lg my-3 overflow-x-auto">
          <code>{question.codeSnippet}</code>
        </pre>
      )}

      <div className="space-y-2 mt-4">
        {question.options.map((option, i) => {
          let classes = 'w-full text-left px-4 py-3 rounded-lg text-sm transition-all border ';
          if (!answered) {
            classes += 'dark:border-slate-700 border-slate-200 dark:hover:border-blue-500/50 hover:border-blue-400 dark:hover:bg-slate-700/50 hover:bg-blue-50 cursor-pointer';
          } else if (i === question.correctIndex) {
            classes += 'border-green-500 bg-green-500/10 text-green-400';
          } else if (i === selectedIndex) {
            classes += 'border-red-500 bg-red-500/10 text-red-400';
          } else {
            classes += 'dark:border-slate-700 border-slate-200 opacity-50';
          }

          return (
            <button
              key={i}
              onClick={() => !answered && onAnswer(i)}
              disabled={answered}
              className={classes}
            >
              <span className="font-mono mr-2 dark:text-slate-500 text-slate-400">{String.fromCharCode(65 + i)}.</span>
              {option}
            </button>
          );
        })}
      </div>

      {answered && (
        <div className={`mt-4 p-4 rounded-lg text-sm ${
          selectedIndex === question.correctIndex
            ? 'bg-green-500/10 dark:text-green-300 text-green-700 border border-green-500/20'
            : 'bg-red-500/10 dark:text-red-300 text-red-700 border border-red-500/20'
        }`}>
          <p className="font-medium mb-1">
            {selectedIndex === question.correctIndex ? 'Correct!' : 'Incorrect'}
          </p>
          <p>{question.explanation}</p>
        </div>
      )}
    </div>
  );
}

function QuizRunner({ questions, quizId }: { questions: QuizQuestion[]; quizId: string }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(new Array(questions.length).fill(null));
  const [showResults, setShowResults] = useState(false);
  const { dispatch } = useProgress();

  const shuffled = useMemo(() => {
    // Shuffle questions but keep them stable during the quiz
    return [...questions].sort(() => 0.5 - Math.random()).slice(0, Math.min(10, questions.length));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizId]);

  const currentQ = shuffled[currentIdx];
  const answered = answers[currentIdx] !== null;
  const score = answers.reduce<number>((s, a, i) => s + (a !== null && a === shuffled[i]?.correctIndex ? 1 : 0), 0);

  const handleAnswer = (idx: number) => {
    const newAnswers = [...answers];
    newAnswers[currentIdx] = idx;
    setAnswers(newAnswers);
  };

  const handleFinish = () => {
    setShowResults(true);
    dispatch({
      type: 'RECORD_QUIZ',
      attempt: {
        quizId,
        score,
        total: shuffled.length,
        timestamp: Date.now(),
        answers: answers.map(a => a ?? -1),
      },
    });
  };

  if (shuffled.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="dark:text-slate-400 text-slate-500">No questions available for this selection.</p>
        <Link to="/quiz" className="text-blue-500 hover:text-blue-400 mt-4 inline-block">
          Back to quiz selection
        </Link>
      </div>
    );
  }

  if (showResults) {
    const percentage = Math.round((score / shuffled.length) * 100);
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="text-6xl font-bold mb-2">{percentage}%</div>
          <p className="text-lg dark:text-slate-400 text-slate-500">
            {score} of {shuffled.length} correct
          </p>
          <p className={`text-sm mt-2 ${percentage >= 80 ? 'text-green-500' : percentage >= 60 ? 'text-amber-500' : 'text-red-500'}`}>
            {percentage >= 80 ? 'Excellent work!' : percentage >= 60 ? 'Good job, keep studying!' : 'Review the material and try again.'}
          </p>
        </div>

        <div className="space-y-3 mb-8">
          {shuffled.map((q, i) => {
            const correct = answers[i] === q.correctIndex;
            return (
              <div key={i} className={`p-3 rounded-lg text-sm border ${
                correct ? 'dark:border-green-500/30 border-green-200 bg-green-500/5' : 'dark:border-red-500/30 border-red-200 bg-red-500/5'
              }`}>
                <span className={correct ? 'text-green-500' : 'text-red-500'}>{correct ? '\u2713' : '\u2717'}</span>
                <span className="ml-2">{q.question.slice(0, 80)}...</span>
                {q.vulnerabilitySlug && (
                  <Link to={`/version/${q.version}/${q.vulnerabilitySlug}`} className="ml-2 text-blue-500 hover:text-blue-400 text-xs">
                    Study &#x2192;
                  </Link>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex justify-center gap-4">
          <Link to="/quiz" className="px-4 py-2 rounded-lg dark:bg-slate-700 bg-slate-200 text-sm font-medium transition-colors dark:hover:bg-slate-600 hover:bg-slate-300">
            Back to Quizzes
          </Link>
          <button
            onClick={() => { setShowResults(false); setCurrentIdx(0); setAnswers(new Array(shuffled.length).fill(null)); }}
            className="px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium transition-colors hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress bar */}
      <div className="flex items-center gap-4 mb-6">
        <span className="text-sm dark:text-slate-400 text-slate-500">
          {currentIdx + 1} / {shuffled.length}
        </span>
        <div className="flex-1 h-2 dark:bg-slate-700 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all"
            style={{ width: `${((currentIdx + 1) / shuffled.length) * 100}%` }}
          />
        </div>
        <span className="text-sm dark:text-slate-400 text-slate-500">
          Score: {score}
        </span>
      </div>

      <QuestionCard
        question={currentQ}
        onAnswer={handleAnswer}
        answered={answered}
        selectedIndex={answers[currentIdx]}
      />

      <div className="flex justify-between mt-6">
        <button
          onClick={() => setCurrentIdx(i => Math.max(0, i - 1))}
          disabled={currentIdx === 0}
          className="px-4 py-2 rounded-lg dark:bg-slate-700 bg-slate-200 text-sm disabled:opacity-40 transition-colors dark:hover:bg-slate-600 hover:bg-slate-300"
        >
          Previous
        </button>
        {currentIdx < shuffled.length - 1 ? (
          <button
            onClick={() => setCurrentIdx(i => i + 1)}
            disabled={!answered}
            className="px-4 py-2 rounded-lg bg-blue-500 text-white text-sm disabled:opacity-40 transition-colors hover:bg-blue-600"
          >
            Next
          </button>
        ) : (
          <button
            onClick={handleFinish}
            disabled={answers.some(a => a === null)}
            className="px-4 py-2 rounded-lg bg-green-500 text-white text-sm disabled:opacity-40 transition-colors hover:bg-green-600"
          >
            Finish Quiz
          </button>
        )}
      </div>
    </div>
  );
}

export default function QuizPage() {
  const { version, slug } = useParams<{ version: string; slug: string }>();

  if (!version) return <QuizSelection />;

  const quizId = slug ? `${version}:${slug}` : version;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link to="/quiz" className="text-sm dark:text-slate-400 text-slate-500 hover:text-blue-500 transition-colors">
          &#x2190; All quizzes
        </Link>
        <h1 className="text-2xl font-bold mt-2">
          {slug ? 'Topic Quiz' : version === 'cross-version' ? 'Cross-Version Quiz' : `${version} Edition Quiz`}
        </h1>
      </div>
      <QuizRunnerWrapper version={version} slug={slug} quizId={quizId} />
    </div>
  );
}

function QuizRunnerWrapper({ version, slug, quizId }: { version: string; slug?: string; quizId: string }) {
  const questions = useQuizQuestions(
    version as OwaspVersion | 'cross-version',
    slug
  );
  return <QuizRunner questions={questions} quizId={quizId} />;
}
