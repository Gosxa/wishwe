const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

const birthdayFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});

export type Birthday = {
  label: string;
  hint: string | null;
};

export type SocialLink = {
  href: string;
  label: string;
};

export const getFullName = (
  firstName?: string | null,
  lastName?: string | null,
): string | null => {
  const name = [firstName, lastName]
    .map(part => part?.trim())
    .filter(Boolean)
    .join(' ');

  return name || null;
};

// Birth dates arrive as calendar dates (YYYY-MM-DD). Parse them by hand so the
// viewer's time zone never shifts the day.
export const getBirthday = (
  value?: string | null,
  today: Date = new Date(),
): Birthday | null => {
  const match = value ? ISO_DATE.exec(value.trim()) : null;

  if (!match) return null;

  const [year, month, day] = match.slice(1).map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  const todayMonth = today.getMonth() + 1;
  const todayDay = today.getDate();
  const isBirthdayToday = todayMonth === month && todayDay === day;
  const hadBirthdayThisYear =
    todayMonth > month || (todayMonth === month && todayDay >= day);
  const age = today.getFullYear() - year - (hadBirthdayThisYear ? 0 : 1);

  let hint: string | null = null;

  if (isBirthdayToday && age > 0) {
    hint = `Turns ${age} today`;
  } else if (age > 0) {
    hint = `${age} ${age === 1 ? 'year' : 'years'} old`;
  }

  return { label: birthdayFormatter.format(date), hint };
};

// Only http(s) links are rendered so a stored value can never become a
// javascript: or data: URL in an anchor.
export const getSocialLink = (value?: string | null): SocialLink | null => {
  const raw = value?.trim();

  if (!raw) return null;

  let url: URL;

  try {
    url = new URL(raw);
  } catch {
    return null;
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;

  const host = url.hostname.replace(/^www\./, '');
  const path = url.pathname.replace(/\/+$/, '');

  return { href: url.href, label: `${host}${path}` };
};
