import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { useProgress } from '../../context/ProgressContext';

let idCounter = 0;

export default function MermaidDiagram({ chart }: { chart: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState('');
  const [error, setError] = useState('');
  const { progress } = useProgress();

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: progress.theme === 'dark' ? 'dark' : 'default',
      securityLevel: 'loose',
    });

    const id = `mermaid-${++idCounter}`;

    mermaid.render(id, chart)
      .then(({ svg: renderedSvg }) => {
        setSvg(renderedSvg);
        setError('');
      })
      .catch((err) => {
        setError(String(err));
        setSvg('');
      });
  }, [chart, progress.theme]);

  if (error) {
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-400">
        <p className="font-medium mb-1">Diagram render error</p>
        <pre className="text-xs overflow-x-auto">{chart}</pre>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="my-4 flex justify-center overflow-x-auto rounded-lg dark:bg-slate-800/50 bg-slate-100 p-4"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
