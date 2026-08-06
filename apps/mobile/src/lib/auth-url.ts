export function parseAuthSessionUrl(value: string) {
  const url = new URL(value);
  const params = new URLSearchParams(url.hash.startsWith('#') ? url.hash.slice(1) : url.search);
  const error = params.get('error_description') || params.get('error');
  if (error) throw new Error(error);
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  if (!accessToken || !refreshToken) throw new Error('The sign-in response was incomplete.');
  return { accessToken, refreshToken };
}
