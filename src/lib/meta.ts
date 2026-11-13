import { useEffect } from 'react';

/** Keeps <title> and meta description right during client-side navigation (the server already renders them for first load). */
export function useMeta(title: string, description?: string) {
  useEffect(() => {
    document.title = title;
    if (description !== undefined) {
      let m = document.querySelector('meta[name="description"]');
      if (!m) { m = document.createElement('meta'); m.setAttribute('name', 'description'); document.head.appendChild(m); }
      m.setAttribute('content', description);
    }
  }, [title, description]);
}
