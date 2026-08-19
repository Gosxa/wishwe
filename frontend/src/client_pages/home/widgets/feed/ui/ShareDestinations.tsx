'use client';

import type { CSSProperties, MouseEvent, RefObject } from 'react';
import clsx from 'clsx';
import type { FeedEvent } from '@client_pages/home/model/types';
import { shareImageFilename } from '@client_pages/home/model/shareImage';
import type { ShareFormat } from '@client_pages/home/model/shareImage';
import type {
  PreparedShareImage,
  ShareNetwork,
  SocialShareUrls,
} from '@client_pages/home/model/shareEvent';
import s from './shareEventModal.module.scss';

type Props = {
  event: FeedEvent;
  activeFormat: ShareFormat;
  socialUrls: SocialShareUrls | null;
  storyImage: PreparedShareImage | null;
  storyUrl?: string;
  storiesLinkRef: RefObject<HTMLAnchorElement | null>;
  onStoriesClick: (event: MouseEvent<HTMLAnchorElement>) => void;
};

const iconStyle = (path: string) =>
  ({ '--share-icon': `url("${path}")` }) as CSSProperties;

const NETWORKS: {
  id: ShareNetwork;
  label: string;
  icon: string;
}[] = [
  {
    id: 'telegram',
    label: 'Telegram',
    icon: '/icons/share/telegram.svg',
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    icon: '/icons/share/whatsapp.svg',
  },
  { id: 'x', label: 'X', icon: '/icons/share/x.svg' },
  {
    id: 'facebook',
    label: 'Facebook',
    icon: '/icons/share/facebook.svg',
  },
];

export const ShareDestinations = ({
  event,
  activeFormat,
  socialUrls,
  storyImage,
  storyUrl,
  storiesLinkRef,
  onStoriesClick,
}: Props) => {
  const handleSocialClick = (
    clickEvent: MouseEvent<HTMLAnchorElement>,
    network: ShareNetwork,
  ) => {
    if (!socialUrls) {
      clickEvent.preventDefault();

      return;
    }

    if (network !== 'telegram') return;

    clickEvent.preventDefault();
    window.open(
      socialUrls.telegram,
      'wishwe-telegram-share',
      'popup,width=620,height=640,noopener,noreferrer',
    );
  };

  return (
    <>
      <div className={s.sectionLabel}>
        <span />
        <p>POST TO</p>
        <span />
      </div>

      <div className={s.networks}>
        {NETWORKS.map(network => (
          <a
            key={network.id}
            className={s.networkItem}
            href={socialUrls?.[network.id] ?? '#'}
            target="_blank"
            rel="noopener noreferrer"
            aria-disabled={!socialUrls}
            onClick={clickEvent => handleSocialClick(clickEvent, network.id)}
          >
            <span className={s.networkButton}>
              <span
                className={s.networkGlyph}
                style={iconStyle(network.icon)}
              />
            </span>
            <span>{network.label}</span>
          </a>
        ))}

        <a
          ref={storiesLinkRef}
          className={clsx(
            s.networkItem,
            s.stories,
            activeFormat === 'story' && s.networkActive,
          )}
          href={storyUrl ?? '#'}
          download={storyImage ? shareImageFilename(event, 'story') : undefined}
          aria-disabled={!storyImage || !storyUrl}
          data-tooltip="Saves the 9:16 image — post it in the app"
          onClick={onStoriesClick}
        >
          <span className={s.networkButton}>
            <span
              className={s.networkGlyph}
              style={iconStyle('/icons/share/stories.svg')}
            />
          </span>
          <span>Stories</span>
        </a>
      </div>
    </>
  );
};
