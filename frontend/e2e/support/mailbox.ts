import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { expect } from '@playwright/test';
import { MAILBOX_DIR } from './constants';

const decodeSoftBreaks = (raw: string) => raw.replace(/=\r?\n/g, '');

const messagesIn = (raw: string) =>
  decodeSoftBreaks(raw)
    .split(/^-{10,}\r?\n/m)
    .filter(message => message.trim().length > 0);

const isAddressedTo = (message: string, email: string) => {
  const to = /^To:\s*(.+)$/m.exec(message)?.[1] ?? '';

  return to.toLowerCase().includes(email.toLowerCase());
};

const codeIn = (message: string) =>
  /verif-code[\s\S]{0,600}?(\d{6})/.exec(message)?.[1] ?? null;

const readMailbox = async () => {
  let entries: string[];

  try {
    entries = await readdir(MAILBOX_DIR);
  } catch {
    return [];
  }

  const files = await Promise.all(
    entries
      .filter(entry => entry.endsWith('.log'))
      .map(async entry => {
        const filePath = path.join(MAILBOX_DIR, entry);
        const { mtimeMs } = await stat(filePath);

        return { mtimeMs, raw: await readFile(filePath, 'utf8') };
      }),
  );

  return files.sort((a, b) => a.mtimeMs - b.mtimeMs);
};

const findVerificationCode = async (email: string) => {
  const files = await readMailbox();

  for (const file of [...files].reverse()) {
    for (const message of messagesIn(file.raw).reverse()) {
      if (!isAddressedTo(message, email)) continue;

      const code = codeIn(message);

      if (code) return code;
    }
  }

  return null;
};

export const waitForVerificationCode = async (email: string) => {
  let code: string | null = null;

  await expect
    .poll(
      async () => {
        code = await findVerificationCode(email);

        return code;
      },
      { message: `no verification email arrived for ${email}` },
    )
    .not.toBeNull();

  return code as unknown as string;
};
