const errorPatterns: Array<{ pattern: RegExp; message: string }> = [
  { pattern: /duplicate key/i, message: 'This record already exists.' },
  { pattern: /foreign key/i, message: 'Related record not found.' },
  { pattern: /violates.*constraint/i, message: 'Invalid data provided.' },
  { pattern: /row-level security/i, message: 'You do not have permission to perform this action.' },
  { pattern: /jwt/i, message: 'Your session has expired. Please sign in again.' },
  { pattern: /network/i, message: 'Unable to connect. Please check your connection.' },
  { pattern: /timeout/i, message: 'Request timed out. Please try again.' },
  { pattern: /not found/i, message: 'The requested item was not found.' },
  { pattern: /unauthorized|unauthenticated/i, message: 'Please sign in to continue.' },
  { pattern: /forbidden/i, message: 'You do not have permission to access this.' },
  { pattern: /rate limit/i, message: 'Too many requests. Please wait and try again.' },
  { pattern: /invalid.*email/i, message: 'Please enter a valid email address.' },
  { pattern: /invalid.*phone/i, message: 'Please enter a valid phone number.' },
];

const categoryDefaults: Record<string, string> = {
  database: 'Failed to save data. Please try again.',
  network: 'Connection error. Please check your network.',
  auth: 'Authentication error. Please sign in again.',
  validation: 'Please check your input and try again.',
  permission: 'You do not have permission to perform this action.',
  default: 'Something went wrong. Please try again.',
};

export type ErrorCategory = keyof typeof categoryDefaults;

export function getSafeErrorMessage(
  error: unknown,
  category: ErrorCategory = 'default'
): string {
  const errorMessage = getErrorString(error);
  
  for (const { pattern, message } of errorPatterns) {
    if (pattern.test(errorMessage)) {
      return message;
    }
  }
  
  return categoryDefaults[category] || categoryDefaults.default;
}

function getErrorString(error: unknown): string {
  if (!error) return '';
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return String(error);
}

export function handleError(
  error: unknown,
  context: string,
  category: ErrorCategory = 'default'
): string {
  console.error(`[${context}]`, error);
  return getSafeErrorMessage(error, category);
}