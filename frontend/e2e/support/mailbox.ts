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

const verificationCodesFor = async (email: string) => {
  const files = await readMailbox();
  const codes: string[] = [];

  for (const file of files) {
    for (const message of messagesIn(file.raw)) {
      if (!isAddressedTo(message, email)) continue;

      const code = codeIn(message);

      if (code) codes.push(code);
    }
  }

  return codes;
};

export const waitForVerificationCode = async (email: string) => {
  let code: string | null = null;

  await expect
    .poll(
      async () => {
        const codes = await verificationCodesFor(email);

        code = codes.at(-1) ?? null;

        return code;
      },
      { message: `no verification email arrived for ${email}` },
    )
    .not.toBeNull();

  return code as unknown as string;
};

export const countVerificationCodes = async (email: string) =>
  (await verificationCodesFor(email)).length;

export const waitForVerificationCodeAfter = async (
  email: string,
  seen: number,
) => {
  let code: string | null = null;

  await expect
    .poll(
      async () => {
        const codes = await verificationCodesFor(email);

        code = codes.length > seen ? (codes.at(-1) ?? null) : null;

        return code;
      },
      {
        message: `no verification email followed the first ${seen} sent to ${email}`,
      },
    )
    .not.toBeNull();

  return code as unknown as string;
};
