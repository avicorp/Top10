import { useState, useEffect, useCallback, useRef } from 'react';

export default function TextToSpeechButton({ contentRef }: { contentRef: React.RefObject<HTMLElement | null> }) {
  const [speaking, setSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const stop = useCallback(() => {
    speechSynthesis.cancel();
    setSpeaking(false);
    utteranceRef.current = null;
  }, []);

  // Stop speech when component unmounts or page navigates
  useEffect(() => {
    return () => {
      speechSynthesis.cancel();
    };
  }, []);

  const toggle = useCallback(() => {
    if (speaking) {
      stop();
      return;
    }

    const el = contentRef.current;
    if (!el) return;

    // Get text from the section (skip the heading itself, get sibling content)
    const section = el.closest('section');
    if (!section) return;

    const text = section.textContent?.trim() || '';
    if (!text) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    utteranceRef.current = utterance;

    speechSynthesis.speak(utterance);
    setSpeaking(true);
  }, [speaking, stop, contentRef]);

  // Don't render if browser doesn't support speech synthesis
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return null;
  }

  return (
    <button
      onClick={toggle}
      className={`ml-auto shrink-0 p-1.5 rounded-lg transition-colors ${
        speaking
          ? 'text-blue-500 dark:bg-blue-500/10 bg-blue-50'
          : 'dark:text-slate-500 text-slate-400 dark:hover:bg-slate-800 hover:bg-slate-100'
      }`}
      aria-label={speaking ? 'Stop reading' : 'Read section aloud'}
      title={speaking ? 'Stop reading' : 'Read section aloud'}
    >
      {speaking ? (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <rect x="6" y="6" width="12" height="12" rx="1" strokeWidth={2} />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M17.95 6.05a8 8 0 010 11.9M11 5L6 9H2v6h4l5 4V5z" />
        </svg>
      )}
    </button>
  );
}
