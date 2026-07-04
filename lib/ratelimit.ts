export const loginLimiter = null;
export const registerLimiter = null;

export async function checkLimit(
  _limiter: null,
  _identifier: string,
): Promise<boolean> {
  void _limiter;
  void _identifier;
  return true;
}
