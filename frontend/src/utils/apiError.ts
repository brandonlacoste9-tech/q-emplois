import axios from 'axios';

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error ? error.message : fallback;
  }

  if (!error.response) {
    return fallback.includes('error occurred')
      ? 'Cannot reach the server. Check your connection or verify the API is online.'
      : 'Impossible de joindre le serveur. Vérifiez votre connexion ou que l\'API est en ligne.';
  }

  const status = error.response.status;
  const data = error.response.data as {
    message?: string | string[];
    errors?: Array<{ field?: string; message?: string }>;
  };

  if (status === 404) {
    return fallback.includes('error occurred')
      ? 'Backend API not found (404). The Railway server may be offline — update VITE_API_URL in Vercel.'
      : 'API introuvable (404). Le serveur Railway est peut-être hors ligne — mettez à jour VITE_API_URL sur Vercel.';
  }

  if (status === 503) {
    return fallback.includes('error occurred')
      ? 'Server temporarily unavailable. The database may not be connected.'
      : 'Service temporairement indisponible. La base de données n\'est probablement pas connectée.';
  }

  if (Array.isArray(data?.errors) && data.errors.length > 0) {
    return data.errors.map((e) => e.message).filter(Boolean).join(' ');
  }

  if (Array.isArray(data?.message)) {
    return data.message.join(' ');
  }

  if (typeof data?.message === 'string') {
    if (data.message === 'Internal server error') {
      return fallback.includes('error occurred')
        ? 'Server error — the database is probably not connected. Try again later.'
        : 'Erreur serveur — la base de données n\'est probablement pas connectée. Réessayez plus tard.';
    }
    return data.message;
  }

  return fallback;
}
