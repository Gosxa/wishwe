export const extractCookieHeader = (res: Response): string =>
  res.headers
    .getSetCookie()
    .map(c => c.split(';')[0])
    .join('; ');

export const forwardCookies = (response: Response, source: Response) => {
  source.headers.getSetCookie().forEach(cookie => {
    response.headers.append('set-cookie', cookie);
  });
};
