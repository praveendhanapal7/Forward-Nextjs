export const loginLimiter = null;
export const registerLimiter = null;

export async function checkLimit(
  _limiter: null,
  _identifier: string,
): Promise<boolean> {
  return true;
}
