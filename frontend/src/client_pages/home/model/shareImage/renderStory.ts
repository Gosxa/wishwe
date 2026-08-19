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
  fillRoundedRect,
  font,
  getShareDateParts,
  watermarkColor,
  wrapText,
} from './drawing';
import type { CanvasImage, FontFamilies } from './drawing';

const CONFIG = {
  width: 1080,
  height: 1920,
  scrim: { startY: 900, height: 1020 },
  pill: {
    y: 104,
    startX: 72,
    textSize: 40,
    horizontalPadding: 32,
    height: 68,
    borderWidth: 2.5,
    gap: 18,
  },
  watermark: { x: 1008, y: 106, fontSize: 44 },
  title: {
    x: 72,
    y: 1168,
    maxWidth: 900,
    maxLines: 2,
    fontSize: 92,
    lineHeight: 102,
  },
  content: {
    x: 72,
    minStartY: 1372,
    titleSpacing: 26,
    scheduleFontSize: 46,
    scheduleOpacity: 0.9,
    scheduleGap: 82,
    locationMaxWidth: 900,
    locationGap: 86,
  },
  avatar: {
    x: 72,
    size: 64,
    hostX: 156,
    hostOffsetY: 32,
    hostFontSize: 36,
    hostOpacity: 0.74,
    nextGap: 92,
  },
  cta: {
    x: 72,
    height: 107,
    radius: 54,
    paddingHorizontal: 112,
    textPaddingLeft: 56,
    textOffsetY: 54,
    fontSize: 42,
  },
};

export const renderStory = (
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
    content,
    avatar: avatarConfig,
    cta,
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

  context.fillStyle = watermarkColor(event);
  context.textAlign = 'right';
  context.textBaseline = 'top';
  context.font = font(700, watermark.fontSize, fonts.sans);
  context.fillText('WishWe', watermark.x, watermark.y);

  context.textAlign = 'left';
  context.fillStyle = COLORS.neutral50;
  context.font = font(700, title.fontSize, fonts.sans);
  const titleLines = wrapText(
    context,
    event.title,
    title.maxWidth,
    title.maxLines,
  );
  const titleBottom = drawTextLines(
    context,
    titleLines,
    title.x,
    title.y,
    title.lineHeight,
  );

  let currentY = Math.max(
    titleBottom + content.titleSpacing,
    content.minStartY,
  );

  context.globalAlpha = content.scheduleOpacity;
  context.font = font(500, content.scheduleFontSize, fonts.sans);
  const schedule = [date.date, date.time].filter(Boolean).join('  ·  ');

  context.fillText(schedule || event.date, content.x, currentY);
  currentY += content.scheduleGap;

  context.fillText(
    ellipsize(context, event.location, content.locationMaxWidth),
    content.x,
    currentY,
  );
  currentY += content.locationGap;

  context.globalAlpha = 1;
  drawAvatar(context, avatar, avatarConfig.x, currentY, avatarConfig.size);
  context.globalAlpha = avatarConfig.hostOpacity;
  context.font = font(400, avatarConfig.hostFontSize, fonts.sans);
  context.textBaseline = 'middle';
  context.fillText(
    `hosted by ${event.host.username}`,
    avatarConfig.hostX,
    currentY + avatarConfig.hostOffsetY,
  );
  currentY += avatarConfig.nextGap;

  context.globalAlpha = 1;
  context.font = font(700, cta.fontSize, fonts.sans);
  const ctaText = event.type === 'plan' ? 'Join on WishWe' : 'View on WishWe';
  const ctaWidth = context.measureText(ctaText).width + cta.paddingHorizontal;

  fillRoundedRect(
    context,
    cta.x,
    currentY,
    ctaWidth,
    cta.height,
    cta.radius,
    COLORS.neutral50,
  );
  context.fillStyle = COLORS.primary;
  context.textBaseline = 'middle';
  context.fillText(
    ctaText,
    cta.x + cta.textPaddingLeft,
    currentY + cta.textOffsetY,
  );
};
