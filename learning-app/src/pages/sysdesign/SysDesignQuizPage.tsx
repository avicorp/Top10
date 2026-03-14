import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSysDesignQuizzes, useSysDesignTopic } from '../../hooks/useSysDesignData';
import { useProgress } from '../../context/ProgressContext';
import type { SysDesignQuizQuestion } from '../../types';

function QuestionCard({ question, onAnswer, answered, selectedIndex }: {
  question: SysDesignQuizQuestion;
  onAnswer: (idx: number) => void;
  answered: boolean;
  selectedIndex: number | null;
}) {
  return (
    <div className="rounded-xl dark:bg-slate-800 bg-white border dark:border-slate-700 border-slate-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
          question.difficulty === 'easy' ? 'bg-green-500/20 text-green-400' :
          question.difficulty === 'medium' ? 'bg-amber-500/20 text-amber-400' :
          'bg-red-500/20 text-red-400'
        }`}>
          {question.difficulty}
        </span>
      </div>

      <h3 className="text-lg font-semibold mb-4 whitespace-pre-line">{question.question}</h3>

      <div className="space-y-2">
        {question.options.map((option, i) => {
          let classes = 'w-full text-left px-4 py-3 rounded-lg text-sm transition-all border ';
          if (!answered) {
            classes += 'dark:border-slate-700 border-slate-200 dark:hover:border-purple-500/50 hover:border-purple-400 dark:hover:bg-slate-700/50 hover:bg-purple-50 cursor-pointer';
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

export default function SysDesignQuizPage() {
  const { slug } = useParams<{ slug: string }>();
  const questions = useSysDesignQuizzes(slug);
  const topic = useSysDesignTopic(slug || '');
  const { dispatch } = useProgress();

  const quizId = `sysdesign:${slug}`;
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [showResults, setShowResults] = useState(false);

  const shuffled = useMemo(() => {
    const arr = [...questions].sort(() => 0.5 - Math.random()).slice(0, Math.min(10, questions.length));
    return arr;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizId]);

  // Initialize answers array
  if (answers.length !== shuffled.length && shuffled.length > 0) {
    setAnswers(new Array(shuffled.length).fill(null));
    return null;
  }

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
      type: 'RECORD_SYSDESIGN_QUIZ',
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
      <div className="max-w-3xl mx-auto px-4 py-8 text-center">
        <p className="dark:text-slate-400 text-slate-500">No questions available for this topic.</p>
        <Link to="/sysdesign/quiz" className="text-purple-500 hover:text-purple-400 mt-4 inline-block">
          Back to quiz selection
        </Link>
      </div>
    );
  }

  if (showResults) {
    const percentage = Math.round((score / shuffled.length) * 100);
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
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
              </div>
            );
          })}
        </div>

        <div className="flex justify-center gap-4">
          <Link to="/sysdesign/quiz" className="px-4 py-2 rounded-lg dark:bg-slate-700 bg-slate-200 text-sm font-medium transition-colors dark:hover:bg-slate-600 hover:bg-slate-300">
            Back to Quizzes
          </Link>
          <button
            onClick={() => { setShowResults(false); setCurrentIdx(0); setAnswers(new Array(shuffled.length).fill(null)); }}
            className="px-4 py-2 rounded-lg bg-purple-500 text-white text-sm font-medium transition-colors hover:bg-purple-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link to="/sysdesign/quiz" className="text-sm dark:text-slate-400 text-slate-500 hover:text-purple-500 transition-colors">
          &#x2190; All quizzes
        </Link>
        <h1 className="text-2xl font-bold mt-2">
          {topic ? `${topic.title} Quiz` : slug === 'mixed' ? 'Mixed Quiz' : 'System Design Quiz'}
        </h1>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-4 mb-6">
        <span className="text-sm dark:text-slate-400 text-slate-500">
          {currentIdx + 1} / {shuffled.length}
        </span>
        <div className="flex-1 h-2 dark:bg-slate-700 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-purple-500 rounded-full transition-all"
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
            className="px-4 py-2 rounded-lg bg-purple-500 text-white text-sm disabled:opacity-40 transition-colors hover:bg-purple-600"
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
