'use client';

import { useEffect } from 'react';

export default function GoogleCallbackPage() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const idToken = params.get('id_token');
    const error = params.get('error');

    if (idToken) {
      window.opener?.postMessage(
        { type: 'google-id-token', token: idToken },
        window.location.origin,
      );
    } else {
      window.opener?.postMessage(
        { type: 'google-error', error: error ?? 'Unknown error' },
        window.location.origin,
      );
    }

    window.close();
  }, []);

  return null;
}
