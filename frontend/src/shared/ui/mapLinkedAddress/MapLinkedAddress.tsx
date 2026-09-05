'use client';

import { type MouseEvent, useState } from 'react';
import { buildGoogleMapsUrl } from '@/shared/lib/googleMaps/buildGoogleMapsUrl';
import { ExternalLink } from '@/shared/ui/icons';
import { Tooltip } from '@/shared/ui/tooltip/Tooltip';
import s from './mapLinkedAddress.module.scss';

type Props = {
  address: string;
  placeId?: string | null;
};

export const MapLinkedAddress = ({ address, placeId }: Props) => {
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const mapsUrl = buildGoogleMapsUrl(address, placeId);

  if (!mapsUrl) {
    return <span>{address}</span>;
  }

  const stopCardClick = (event: MouseEvent<HTMLAnchorElement>) => {
    setTooltipOpen(false);
    event.stopPropagation();
  };

  const trimmedEnd = address.trimEnd();
  const trailingSpaces = address.slice(trimmedEnd.length);
  const match = trimmedEnd.match(/^([\s\S]*?)(\s+)(\S+)$/);
  const prefix = match ? match[1] + match[2] : '';
  const lastWord = match ? match[3] : trimmedEnd;
  const isNowrap = prefix !== '' || lastWord.length <= 25;

  return (
    <Tooltip
      text="Open in Google Maps"
      className={s.tooltip}
      open={tooltipOpen}
    >
      <a
        className={s.link}
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Open ${address} in Google Maps`}
        onClick={stopCardClick}
        onMouseEnter={() => setTooltipOpen(true)}
        onMouseLeave={() => setTooltipOpen(false)}
      >
        {prefix}
        {isNowrap ? (
          <span className={s.nowrap}>
            {lastWord}
            <span className={s.icon}>
              <ExternalLink />
            </span>
          </span>
        ) : (
          <>
            {lastWord}
            <span className={s.icon}>
              <ExternalLink />
            </span>
          </>
        )}
        {trailingSpaces}
      </a>
    </Tooltip>
  );
};
