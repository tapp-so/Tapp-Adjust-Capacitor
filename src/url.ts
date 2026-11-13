/**
 * Validate and trim a URL using the JavaScript URL parser.
 * Rejects non-string, blank, or unparsable input and the javascript:, data:, and
 * file: schemes by returning null. This checks URL syntax and allowed schemes;
 * it does not check whether the native Adjust adapter can process the link.
 * Does not require start() and never calls the native SDK.
 * @platform JavaScript, including the web fallback; native URL parsers may differ.
 * @param value - Candidate URL to validate without coercion.
 * @returns The trimmed URL, or null for invalid input; validation does not throw.
 * @example
 * const url = validateTappUrl(incomingUrl);
 * if (url === null) return;
 */
export function validateTappUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    const { protocol } = new URL(trimmed);
    if (!protocol || ['javascript:', 'data:', 'file:'].includes(protocol.toLowerCase()))
      return null;
    return trimmed;
  } catch {
    return null;
  }
}
