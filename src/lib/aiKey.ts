// Every student brings their own Gemini key; the server never falls back to one of its own.
// Shared by the AI routes (to refuse keyless requests) and the pages (to show the key prompt).

export const NO_KEY = 'NO_KEY';

/** Code an AI route returns when Gemini refused the student's key as not valid. */
export const INVALID_KEY = 'INVALID_KEY';

export const MISSING_KEY_MESSAGE = 'Add your Gemini API key in Settings to use marking and tutoring.';

/** Body of the 401 an AI route returns when the request carries no Gemini key. */
export const missingKeyBody = { error: MISSING_KEY_MESSAGE, code: NO_KEY } as const;

/** Thrown by a page when an AI route answered with the NO_KEY code. */
export class MissingKeyError extends Error {
  constructor() {
    super(MISSING_KEY_MESSAGE);
    this.name = 'MissingKeyError';
  }
}

/** Reads the student's own keys from the request headers. */
export function readClientKeys(headers: Headers): { geminiKey?: string; zaiKey?: string } {
  return {
    geminiKey: headers.get('x-gemini-key')?.trim() || undefined,
    zaiKey: headers.get('x-zai-key')?.trim() || undefined,
  };
}
