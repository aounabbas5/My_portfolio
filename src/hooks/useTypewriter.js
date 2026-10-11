import { useState, useEffect } from 'react';

/**
 * Types and deletes each word in `words` in a loop.
 * With reduced motion enabled it shows the first word, unchanged.
 */
export function useTypewriter(words, { typeMs = 90, deleteMs = 45, pauseMs = 1600 } = {}) {
  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const [text, setText] = useState(reduced ? words[0] : '');
  const [wordIndex, setWordIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (reduced) return;
    const word = words[wordIndex % words.length];

    let delay = deleting ? deleteMs : typeMs;
    if (!deleting && text === word) delay = pauseMs;

    const timer = setTimeout(() => {
      if (!deleting && text === word) {
        setDeleting(true);
      } else if (deleting && text === '') {
        setDeleting(false);
        setWordIndex((i) => (i + 1) % words.length);
      } else {
        setText(deleting ? word.slice(0, text.length - 1) : word.slice(0, text.length + 1));
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [text, deleting, wordIndex, words, reduced, typeMs, deleteMs, pauseMs]);

  return text;
}
