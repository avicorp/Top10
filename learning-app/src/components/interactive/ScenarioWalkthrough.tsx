import { useState } from 'react';
import type { AttackScenario } from '../../types';

const STEPS = ['Setup', 'Vulnerability', 'Attack', 'Impact', 'Fix'] as const;

export default function ScenarioWalkthrough({ scenarios, preventionHtml }: { scenarios: AttackScenario[]; preventionHtml: string }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [currentScenario, setCurrentScenario] = useState(0);
  const scenario = scenarios[currentScenario];

  if (!scenario) return null;

  const stepContent = [
    // Setup
    <div key="setup">
      <h4 className="font-semibold mb-2">Application Context</h4>
      <p className="text-sm dark:text-slate-300 text-slate-600">{scenario.description.split('.').slice(0, 2).join('.') + '.'}</p>
    </div>,
    // Vulnerability
    <div key="vuln">
      <h4 className="font-semibold mb-2">The Vulnerability</h4>
      {scenario.codeBlocks.length > 0 ? (
        <pre className="!m-0 rounded-lg text-sm overflow-x-auto">
          <code>{scenario.codeBlocks[0].code}</code>
        </pre>
      ) : (
        <p className="text-sm dark:text-slate-300 text-slate-600">{scenario.description}</p>
      )}
    </div>,
    // Attack
    <div key="attack">
      <h4 className="font-semibold mb-2">The Attack</h4>
      {scenario.codeBlocks.length > 1 ? (
        <pre className="!m-0 rounded-lg text-sm overflow-x-auto">
          <code>{scenario.codeBlocks[1].code}</code>
        </pre>
      ) : (
        <p className="text-sm dark:text-slate-300 text-slate-600">
          An attacker exploits this vulnerability by manipulating the input or request to bypass intended security controls.
        </p>
      )}
    </div>,
    // Impact
    <div key="impact">
      <h4 className="font-semibold mb-2">Potential Impact</h4>
      <p className="text-sm dark:text-slate-300 text-slate-600">
        {scenario.description.split('.').slice(-3).join('.').trim() || 'Unauthorized access, data exposure, or system compromise.'}
      </p>
    </div>,
    // Fix
    <div key="fix">
      <h4 className="font-semibold mb-2">How to Fix</h4>
      <div className="text-sm dark:text-slate-300 text-slate-600 vuln-content" dangerouslySetInnerHTML={{ __html: preventionHtml }} />
    </div>,
  ];

  return (
    <div className="rounded-xl dark:bg-slate-800 bg-white border dark:border-slate-700 border-slate-200 overflow-hidden">
      <div className="px-4 py-3 border-b dark:border-slate-700 border-slate-200 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider dark:text-slate-400 text-slate-500">
          Scenario Walkthrough
        </h3>
        {scenarios.length > 1 && (
          <select
            value={currentScenario}
            onChange={e => { setCurrentScenario(Number(e.target.value)); setCurrentStep(0); }}
            className="text-xs dark:bg-slate-700 bg-slate-200 rounded px-2 py-1 dark:text-slate-300 text-slate-600"
          >
            {scenarios.map((s, i) => (
              <option key={i} value={i}>{s.title}</option>
            ))}
          </select>
        )}
      </div>

      {/* Step indicators */}
      <div className="flex border-b dark:border-slate-700 border-slate-200">
        {STEPS.map((step, i) => (
          <button
            key={step}
            onClick={() => setCurrentStep(i)}
            className={`flex-1 py-2 text-xs font-medium text-center transition-colors border-b-2 ${
              i === currentStep
                ? 'border-blue-500 text-blue-500'
                : i < currentStep
                ? 'border-green-500/50 dark:text-slate-400 text-slate-500'
                : 'border-transparent dark:text-slate-500 text-slate-400'
            }`}
          >
            {step}
          </button>
        ))}
      </div>

      <div className="p-4 min-h-[120px]">
        {stepContent[currentStep]}
      </div>

      <div className="flex justify-between px-4 py-3 border-t dark:border-slate-700 border-slate-200">
        <button
          onClick={() => setCurrentStep(s => Math.max(0, s - 1))}
          disabled={currentStep === 0}
          className="px-3 py-1.5 text-sm rounded-md dark:bg-slate-700 bg-slate-200 disabled:opacity-40 transition-colors dark:hover:bg-slate-600 hover:bg-slate-300"
        >
          Previous
        </button>
        <button
          onClick={() => setCurrentStep(s => Math.min(STEPS.length - 1, s + 1))}
          disabled={currentStep === STEPS.length - 1}
          className="px-3 py-1.5 text-sm rounded-md bg-blue-500 text-white disabled:opacity-40 transition-colors hover:bg-blue-600"
        >
          Next
        </button>
      </div>
    </div>
  );
}
