import { useState } from 'react';
import type { AttackScenario } from '../../types';

export default function CodePlayground({ scenarios }: { scenarios: AttackScenario[] }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const scenario = scenarios[activeIdx];
  if (!scenario || scenario.codeBlocks.length === 0) return null;

  return (
    <div className="rounded-xl dark:bg-slate-800 bg-white border dark:border-slate-700 border-slate-200 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b dark:border-slate-700 border-slate-200">
        <h3 className="text-sm font-semibold uppercase tracking-wider dark:text-slate-400 text-slate-500">
          Code Examples
        </h3>
        {scenarios.length > 1 && (
          <div className="flex gap-1">
            {scenarios.filter(s => s.codeBlocks.length > 0).map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveIdx(i)}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  i === activeIdx
                    ? 'bg-blue-500 text-white'
                    : 'dark:bg-slate-700 bg-slate-200 dark:text-slate-400 text-slate-500'
                }`}
              >
                #{i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="p-4">
        <p className="text-sm dark:text-slate-300 text-slate-600 mb-3">{scenario.description.slice(0, 200)}</p>
        {scenario.codeBlocks.map((block, i) => (
          <div key={i} className="mb-3">
            {block.label && (
              <span className="text-xs dark:text-slate-500 text-slate-400 mb-1 block">{block.label}</span>
            )}
            <pre className="!m-0 rounded-lg overflow-x-auto">
              <code className={block.language ? `language-${block.language}` : ''}>
                {block.code}
              </code>
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}
