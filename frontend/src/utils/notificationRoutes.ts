/** Resolve in-app route for a platform notification (backend `type` + `data`). */
export function getNotificationHref(
  type: string,
  data?: Record<string, unknown>,
): string | null {
  const taskId = typeof data?.taskId === 'string' ? data.taskId : undefined;
  const conversationId =
    typeof data?.conversationId === 'string' ? data.conversationId : undefined;
  const taskerId = typeof data?.taskerId === 'string' ? data.taskerId : undefined;

  switch (type) {
    case 'job_application':
      if (taskId && taskerId) return `/messages?jobId=${taskId}&taskerId=${taskerId}`;
      return taskId ? `/jobs/${taskId}` : null;
    case 'job_accepted':
    case 'job_cancelled':
    case 'job_started':
    case 'job_completed':
    case 'job_deleted':
    case 'job_application_rejected':
      return taskId ? `/jobs/${taskId}` : null;
    case 'new_message':
      if (conversationId) return `/messages?conversationId=${conversationId}`;
      return '/messages';
    case 'escrow_release':
      return '/latelier';
    case 'verification_approved':
    case 'verification_rejected':
      return '/profile';
    default:
      if (typeof data?.link === 'string') return data.link;
      return taskId ? `/jobs/${taskId}` : null;
  }
}