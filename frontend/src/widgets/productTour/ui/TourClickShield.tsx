import type { CSSProperties, MouseEventHandler } from 'react';
import type { AnchorRect } from '../model/types';
import s from './productTour.module.scss';

const clampToViewport = (value: number, maximum: number) =>
  Math.min(Math.max(value, 0), maximum);

const clickShieldStyles = (rect: AnchorRect | null): CSSProperties[] => {
  if (!rect) return [{ inset: 0 }];

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const top = clampToViewport(rect.top, viewportHeight);
  const left = clampToViewport(rect.left, viewportWidth);
  const right = clampToViewport(rect.left + rect.width, viewportWidth);
  const bottom = clampToViewport(rect.top + rect.height, viewportHeight);

  if (right <= left || bottom <= top) return [{ inset: 0 }];

  return [
    { top: 0, right: 0, left: 0, height: top },
    { top, left: 0, width: left, height: bottom - top },
    { top, right: 0, left: right, height: bottom - top },
    { top: bottom, right: 0, bottom: 0, left: 0 },
  ];
};

type Props = {
  rect: AnchorRect | null;
  onClick: MouseEventHandler<HTMLDivElement>;
};

export const TourClickShield = ({ rect, onClick }: Props) => (
  <>
    {clickShieldStyles(rect).map((style, index) => (
      <div
        key={index}
        aria-hidden
        className={s.clickShield}
        onClick={onClick}
        style={style}
      />
    ))}
  </>
);
