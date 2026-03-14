import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProgress } from '../../context/ProgressContext';
import MermaidDiagram from '../../components/shared/MermaidDiagram';
import { interviews } from '../../data/sysdesign-interviews';
import type { InterviewStep } from '../../types';

function StepCard({ step, stepNumber, totalSteps, isCompleted, onComplete }: {
  step: InterviewStep;
  stepNumber: number;
  totalSteps: number;
  isCompleted: boolean;
  onComplete: () => void;
}) {
  const [showGuidance, setShowGuidance] = useState(isCompleted);

  return (
    <div className={`rounded-xl border p-6 transition-all ${
      isCompleted
        ? 'dark:border-green-500/30 border-green-200 dark:bg-green-500/5 bg-green-50'
        : 'dark:border-slate-700 border-slate-200 dark:bg-slate-800 bg-white'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
            isCompleted ? 'bg-green-500 text-white' : 'dark:bg-slate-700 bg-slate-200 dark:text-slate-300 text-slate-600'
          }`}>
            {isCompleted ? '\u2713' : stepNumber}
          </span>
          <h3 className="font-semibold">{step.title}</h3>
        </div>
        <span className="text-xs dark:text-slate-500 text-slate-400">Step {stepNumber}/{totalSteps}</span>
      </div>

      <div className="mb-4 p-4 rounded-lg dark:bg-slate-900/50 bg-slate-50 border dark:border-slate-700 border-slate-200">
        <p className="text-sm font-medium dark:text-slate-300 text-slate-600 italic">
          "{step.prompt}"
        </p>
      </div>

      {!showGuidance ? (
        <button
          onClick={() => setShowGuidance(true)}
          className="w-full py-3 rounded-lg border-2 border-dashed dark:border-slate-600 border-slate-300 text-sm dark:text-slate-400 text-slate-500 hover:border-purple-500/50 hover:text-purple-500 transition-colors"
        >
          Think about your answer, then click to reveal guidance
        </button>
      ) : (
        <div className="space-y-4">
          <div className="sysdesign-content dark:text-slate-300 text-slate-600 text-sm" dangerouslySetInnerHTML={{ __html: step.guidanceHtml }} />

          {step.mermaidDiagram && (
            <MermaidDiagram chart={step.mermaidDiagram} />
          )}

          {step.tips.length > 0 && (
            <div className="p-3 rounded-lg dark:bg-purple-500/10 bg-purple-50 border dark:border-purple-500/20 border-purple-200">
              <p className="text-xs font-semibold uppercase tracking-wider dark:text-purple-400 text-purple-600 mb-1">Tips</p>
              <ul className="text-xs dark:text-slate-300 text-slate-600 space-y-1">
                {step.tips.map((tip, i) => (
                  <li key={i}>&#x2022; {tip}</li>
                ))}
              </ul>
            </div>
          )}

          {!isCompleted && (
            <button
              onClick={onComplete}
              className="px-4 py-2 rounded-lg bg-purple-500 text-white text-sm font-medium hover:bg-purple-600 transition-colors"
            >
              Mark Step Complete
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function InterviewSessionPage() {
  const { slug } = useParams<{ slug: string }>();
  const interview = interviews.find(i => i.slug === slug);
  const { progress, dispatch, getInterviewSteps } = useProgress();
  const [showFinalDiagram, setShowFinalDiagram] = useState(false);

  if (!interview) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Interview not found</h1>
        <Link to="/sysdesign/interview" className="text-purple-500 hover:text-purple-400">
          Back to interviews
        </Link>
      </div>
    );
  }

  const completedSteps = getInterviewSteps(interview.slug);
  const allComplete = completedSteps.length >= interview.steps.length;

  const handleCompleteStep = (stepId: string) => {
    dispatch({ type: 'MARK_INTERVIEW_STEP', interviewSlug: interview.slug, stepId });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link to="/sysdesign/interview" className="text-sm dark:text-slate-400 text-slate-500 hover:text-purple-500 transition-colors">
          &#x2190; All Interviews
        </Link>
        <h1 className="text-2xl font-bold mt-2">{interview.title}</h1>
        <div className="flex items-center gap-3 mt-2 text-sm">
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            interview.difficulty === 'advanced'
              ? 'bg-red-500/20 text-red-400'
              : 'bg-amber-500/20 text-amber-400'
          }`}>
            {interview.difficulty}
          </span>
          <span className="dark:text-slate-500 text-slate-400">~{interview.estimatedMinutes} min</span>
          <span className="dark:text-slate-500 text-slate-400">{completedSteps.length}/{interview.steps.length} steps</span>
        </div>
      </div>

      {/* Briefing */}
      <div className="mb-8 p-6 rounded-xl dark:bg-slate-800 bg-white border dark:border-slate-700 border-slate-200">
        <h2 className="text-lg font-semibold mb-3">Problem Statement</h2>
        <p className="dark:text-slate-300 text-slate-600 text-sm leading-relaxed">{interview.briefing}</p>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="h-2 dark:bg-slate-700 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-purple-500 rounded-full transition-all"
            style={{ width: `${(completedSteps.length / interview.steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-4 mb-8">
        {interview.steps.map((step, i) => (
          <StepCard
            key={step.id}
            step={step}
            stepNumber={i + 1}
            totalSteps={interview.steps.length}
            isCompleted={completedSteps.includes(step.id)}
            onComplete={() => handleCompleteStep(step.id)}
          />
        ))}
      </div>

      {/* Final Architecture */}
      {allComplete && (
        <div className="rounded-xl dark:bg-slate-800 bg-white border dark:border-green-500/30 border-green-200 p-6">
          <h2 className="text-lg font-semibold mb-3 text-green-500">Complete Architecture</h2>
          <p className="text-sm dark:text-slate-400 text-slate-500 mb-4">
            Congratulations! Here is the full architecture diagram combining all your design decisions.
          </p>
          {!showFinalDiagram ? (
            <button
              onClick={() => setShowFinalDiagram(true)}
              className="px-4 py-2 rounded-lg bg-green-500 text-white text-sm font-medium hover:bg-green-600 transition-colors"
            >
              Reveal Final Architecture
            </button>
          ) : (
            <MermaidDiagram chart={interview.finalDiagram} />
          )}
        </div>
      )}
    </div>
  );
}
