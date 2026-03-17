import { useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSysDesignTopic, useSysDesignTopics } from '../../hooks/useSysDesignData';
import TopicStatusToggle from '../../components/shared/TopicStatusToggle';
import MermaidDiagram from '../../components/shared/MermaidDiagram';
import TextToSpeechButton from '../../components/shared/TextToSpeechButton';

function SectionContent({ section }: { section: { id: string; title: string; contentHtml: string; mermaidDiagrams: string[] } }) {
  const ref = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Scroll-spy highlight could be added here
  }, []);

  return (
    <section ref={ref} id={section.id} className="mb-10">
      <div className="flex items-center gap-2 mb-4">
        <h2 ref={headingRef} className="text-xl font-bold dark:text-slate-100 text-slate-900">{section.title}</h2>
        <TextToSpeechButton contentRef={headingRef} />
      </div>
      <div className="sysdesign-content dark:text-slate-300 text-slate-600" dangerouslySetInnerHTML={{ __html: section.contentHtml }} />
      {section.mermaidDiagrams.map((diagram, i) => (
        <MermaidDiagram key={`${section.id}-diagram-${i}`} chart={diagram} />
      ))}
    </section>
  );
}

export default function TopicPage() {
  const { slug } = useParams<{ slug: string }>();
  const topic = useSysDesignTopic(slug || '');
  const topics = useSysDesignTopics();

  if (!topic) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Topic not found</h1>
        <Link to="/sysdesign" className="text-purple-500 hover:text-purple-400">
          Back to System Design
        </Link>
      </div>
    );
  }

  // Navigation
  const currentIdx = topics.findIndex(t => t.slug === topic.slug);
  const prev = currentIdx > 0 ? topics[currentIdx - 1] : null;
  const next = currentIdx < topics.length - 1 ? topics[currentIdx + 1] : null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link to="/sysdesign" className="text-sm dark:text-slate-400 text-slate-500 hover:text-purple-500 transition-colors">
          &#x2190; System Design
        </Link>
        <div className="flex items-start justify-between mt-2">
          <h1 className="text-2xl font-bold">{topic.title}</h1>
          <TopicStatusToggle slug={topic.slug} />
        </div>
      </div>

      {/* Table of Contents */}
      <nav className="mb-8 p-4 rounded-xl dark:bg-slate-800/50 bg-slate-100 border dark:border-slate-700 border-slate-200">
        <h2 className="text-sm font-semibold uppercase tracking-wider dark:text-slate-400 text-slate-500 mb-2">Contents</h2>
        <ul className="space-y-1">
          {topic.sections.map(section => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                className="text-sm dark:text-slate-300 text-slate-600 hover:text-purple-500 transition-colors"
              >
                {section.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Sections */}
      {topic.sections.map(section => (
        <SectionContent key={section.id} section={section} />
      ))}

      {/* External Links */}
      {topic.externalLinks.length > 0 && (
        <div className="mb-8 p-4 rounded-xl dark:bg-slate-800/50 bg-slate-100 border dark:border-slate-700 border-slate-200">
          <h2 className="text-sm font-semibold uppercase tracking-wider dark:text-slate-400 text-slate-500 mb-2">External Resources</h2>
          <ul className="space-y-1">
            {topic.externalLinks.map((link, i) => (
              <li key={i}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-purple-500 hover:text-purple-400 transition-colors"
                >
                  {link.label} &#x2197;
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Quiz CTA */}
      <div className="mb-8 p-4 rounded-xl dark:bg-purple-500/10 bg-purple-50 border dark:border-purple-500/20 border-purple-200">
        <Link to={`/sysdesign/quiz/${topic.slug}`} className="flex items-center justify-between text-purple-500 hover:text-purple-400 transition-colors">
          <span className="font-medium">Test your knowledge of {topic.title}</span>
          <span>&#x2192;</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex justify-between pt-4 border-t dark:border-slate-700 border-slate-200" aria-label="Topic navigation">
        {prev ? (
          <Link to={`/sysdesign/topic/${prev.slug}`} className="text-sm dark:text-slate-400 text-slate-500 hover:text-purple-500 transition-colors">
            &#x2190; {prev.title}
          </Link>
        ) : <span />}
        {next ? (
          <Link to={`/sysdesign/topic/${next.slug}`} className="text-sm dark:text-slate-400 text-slate-500 hover:text-purple-500 transition-colors">
            {next.title} &#x2192;
          </Link>
        ) : <span />}
      </nav>
    </div>
  );
}
