/* eslint-disable no-param-reassign */

import type { FeedEvent } from '../types';
import {
  COLORS,
  drawAvatar,
  drawCover,
  drawPill,
  drawScrim,
  drawTextLines,
  ellipsize,
  font,
  getShareDateParts,
  watermarkColor,
  wrapText,
} from './drawing';
import type { CanvasImage, FontFamilies } from './drawing';

const CONFIG = {
  width: 1200,
  height: 630,
  scrim: { startY: 250, height: 380 },
  pill: {
    y: 44,
    startX: 48,
    textSize: 32,
    horizontalPadding: 26,
    height: 56,
    borderWidth: 2,
    gap: 14,
  },
  watermark: { x: 1152, y: 44, fontSize: 34 },
  title: {
    x: 48,
    singleLineY: 384,
    multiLineY: 310,
    maxWidth: 1040,
    maxLines: 2,
    fontSize: 66,
    lineHeight: 74,
  },
  details: {
    x: 48,
    y: 476,
    maxWidth: 1000,
    fontSize: 32,
    opacity: 0.88,
  },
  avatar: { x: 48, y: 542, size: 44 },
  host: { x: 106, y: 564, fontSize: 26, opacity: 0.74 },
};

export const renderPoster = (
  context: CanvasRenderingContext2D,
  event: FeedEvent,
  cover: CanvasImage,
  avatar: CanvasImage,
  fonts: FontFamilies,
) => {
  const {
    width,
    height,
    scrim,
    pill,
    watermark,
    title,
    details,
    avatar: avatarConfig,
    host,
  } = CONFIG;
  const date = getShareDateParts(event.date);

  drawCover(context, cover, width, height);
  drawScrim(context, width, scrim.startY, scrim.height);

  let pillX = pill.startX;
  const isWish = event.type === 'wish';
  const typeFill = isWish ? COLORS.yellow : COLORS.purple;
  const typeWidth = drawPill(
    context,
    event.type,
    {
      x: pillX,
      y: pill.y,
      height: pill.height,
      textSize: pill.textSize,
      horizontalPadding: pill.horizontalPadding,
      fill: typeFill,
      borderWidth: pill.borderWidth,
      isDashed: isWish,
    },
    fonts,
  );

  pillX += typeWidth + pill.gap;

  if (event.hashtag) {
    drawPill(
      context,
      event.hashtag,
      {
        x: pillX,
        y: pill.y,
        height: pill.height,
        textSize: pill.textSize,
        horizontalPadding: pill.horizontalPadding,
        fill: COLORS.neutral50,
        borderWidth: pill.borderWidth,
      },
      fonts,
    );
  }

  context.textAlign = 'right';
  context.textBaseline = 'top';
  context.fillStyle = watermarkColor(event);
  context.font = font(700, watermark.fontSize, fonts.sans);
  context.fillText('WishWe', watermark.x, watermark.y);

  context.textAlign = 'left';
  context.textBaseline = 'top';
  context.fillStyle = COLORS.neutral50;
  context.font = font(700, title.fontSize, fonts.sans);
  const titleLines = wrapText(
    context,
    event.title,
    title.maxWidth,
    title.maxLines,
  );
  const titleY = titleLines.length > 1 ? title.multiLineY : title.singleLineY;

  drawTextLines(context, titleLines, title.x, titleY, title.lineHeight);

  context.globalAlpha = details.opacity;
  context.font = font(500, details.fontSize, fonts.sans);
  const schedule = [date.date, date.time].filter(Boolean).join(' · ');
  const detailText = [schedule, event.location].filter(Boolean).join('      ');

  context.fillText(
    ellipsize(context, detailText, details.maxWidth),
    details.x,
    details.y,
  );
  context.globalAlpha = 1;

  drawAvatar(
    context,
    avatar,
    avatarConfig.x,
    avatarConfig.y,
    avatarConfig.size,
  );
  context.globalAlpha = host.opacity;
  context.font = font(400, host.fontSize, fonts.sans);
  context.textBaseline = 'middle';
  context.fillText(`hosted by ${event.host.username}`, host.x, host.y);
  context.globalAlpha = 1;
};
