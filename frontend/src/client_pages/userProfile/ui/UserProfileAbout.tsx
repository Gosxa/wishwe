'use client';

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { PublicProfile } from '@/shared/client_api/user/types';
import { useModalTransition } from '@shared/hooks/useModalTransition';
import {
  Cake,
  ExternalLink,
  InfoCircle,
  LinkIcon,
  UserRound,
  X,
} from '@shared/ui/icons';
import { getBirthday, getFullName, getSocialLink } from '../model/aboutDetails';
import s from './userProfileAbout.module.scss';

type Props = {
  profile: PublicProfile;
};

type RowProps = {
  icon: ReactNode;
  tone: 'yellow' | 'beige' | 'purple';
  label: string;
  children: ReactNode;
};

const AboutRow = ({ icon, tone, label, children }: RowProps) => (
  <div className={s.row}>
    <dt className={s.rowLabel}>
      <span className={`${s.rowIcon} ${s[tone]}`} aria-hidden="true">
        {icon}
      </span>
      {label}
    </dt>
    <dd className={s.rowValue}>{children}</dd>
  </div>
);

export const UserProfileAbout = ({ profile }: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const titleId = useId();
  const { requestClose, requestCloseWith, overlayRef, modalTransitionProps } =
    useModalTransition(() => setIsOpen(false));

  const username = profile.username ?? '';
  const fullName = getFullName(profile.first_name, profile.last_name);
  const birthday = getBirthday(profile.date_of_birth);
  const social = getSocialLink(profile.social_media_url);
  const hasDetails = Boolean(fullName || birthday || social);

  const closeAndRestoreFocus = useCallback(() => {
    requestCloseWith(() => {
      setIsOpen(false);
      triggerRef.current?.focus();
    });
  }, [requestCloseWith]);

  useEffect(() => {
    if (!isOpen) return;

    overlayRef.current?.focus();

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        requestClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeAndRestoreFocus();
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, overlayRef, requestClose, closeAndRestoreFocus]);

  const handleToggle = () => {
    if (isOpen) {
      requestClose();
    } else {
      setIsOpen(true);
    }
  };

  return (
    <div className={s.root} ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className={s.trigger}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={isOpen ? panelId : undefined}
        onClick={handleToggle}
      >
        <InfoCircle />
        <span>About</span>
      </button>

      {isOpen && (
        <div
          {...modalTransitionProps}
          id={panelId}
          className={s.panel}
          role="dialog"
          aria-labelledby={titleId}
          tabIndex={-1}
        >
          <div className={s.panelHeader}>
            <h2 id={titleId} className={s.title}>
              About <span className={s.titleUsername}>@{username}</span>
            </h2>
            <button
              type="button"
              className={s.close}
              aria-label="Close"
              onClick={closeAndRestoreFocus}
            >
              <X />
            </button>
          </div>

          {hasDetails ? (
            <dl className={s.list}>
              {fullName && (
                <AboutRow icon={<UserRound />} tone="yellow" label="Name">
                  {fullName}
                </AboutRow>
              )}

              {birthday && (
                <AboutRow icon={<Cake />} tone="purple" label="Birthday">
                  {birthday.label}
                  {birthday.hint && (
                    <span className={s.hint}>{birthday.hint}</span>
                  )}
                </AboutRow>
              )}

              {social && (
                <AboutRow icon={<LinkIcon />} tone="beige" label="Social media">
                  <a
                    className={s.link}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={social.href}
                  >
                    <span className={s.linkText}>{social.label}</span>
                    <ExternalLink size={14} />
                  </a>
                </AboutRow>
              )}
            </dl>
          ) : (
            <p className={s.empty}>
              @{username} hasn&apos;t shared any details yet.
            </p>
          )}
        </div>
      )}
    </div>
  );
};
