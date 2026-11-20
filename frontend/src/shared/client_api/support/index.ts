import { handleUnauthorized } from '@/shared/client_api/handleResponse';

export type SupportCategory =
  | 'technical_issue'
  | 'account_access'
  | 'feature_idea'
  | 'feedback'
  | 'privacy_data'
  | 'safety_report'
  | 'other';

export type SupportRequestPayload = {
  email: string;
  display_name: string;
  category: SupportCategory;
  message: string;
};

export type SupportRequestResult = {
  id: string;
  delivery_status: 'sent' | 'failed';
  support_email: string;
};

export class SupportRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'SupportRequestError';
  }
}

const getErrorMessage = (body: unknown): string | null => {
  if (!body || typeof body !== 'object') return null;

  const values = Object.values(body);
  for (const value of values) {
    if (typeof value === 'string') return value;
    if (Array.isArray(value)) {
      const message = value.find(item => typeof item === 'string');
      if (typeof message === 'string') return message;
    }
  }

  return null;
};

export const submitSupportRequest = async (
  payload: SupportRequestPayload,
): Promise<SupportRequestResult> => {
  const response = await fetch('/next_api/support', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    handleUnauthorized(response);
    const body = (await response.json().catch(() => null)) as unknown;
    throw new SupportRequestError(
      getErrorMessage(body) ?? 'We could not send your message. Try again.',
      response.status,
    );
  }

  return (await response.json()) as SupportRequestResult;
};
