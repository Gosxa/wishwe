/* eslint-disable no-param-reassign */

import type { FeedEvent } from '../types';
import {
  COLORS,
  drawCover,
  drawTextLines,
  ellipsize,
  eventTypeLabel,
  fillRoundedRect,
  font,
  getShareDateParts,
  getWhereLabel,
  wrapText,
} from './drawing';
import type { CanvasImage, FontFamilies } from './drawing';

const CONFIG = {
  width: 1200,
  height: 630,
  card: {
    x: 140,
    y: 108,
    width: 920,
    height: 414,
    radius: 32,
    shadowColor: 'rgba(26, 28, 30, 0.32)',
    shadowBlur: 48,
    shadowOffsetY: 16,
  },
  brand: {
    logoX: 194,
    logoY: 154,
    logoSize: 30,
    dotX: 208,
    dotY: 169,
    dotRadius: 8,
    textX: 232,
    textY: 169,
    fontSize: 28,
  },
  title: {
    x: 196,
    y: 214,
    maxWidth: 808,
    maxLines: 1,
    fontSize: 60,
    lineHeight: 68,
  },
  subline: {
    x: 196,
    y: 302,
    maxWidth: 780,
    fontSize: 28,
  },
  stats: {
    startX: 196,
    top: 376,
    totalWidth: 808,
    separatorHeight: 78,
    paddingLeft: 24,
    labelOffsetY: 50,
    valueFontSize: 36,
    labelFontSize: 24,
    valuePaddingRight: 32,
  },
};

export const renderCard = (
  context: CanvasRenderingContext2D,
  event: FeedEvent,
  cover: CanvasImage,
  logo: CanvasImage,
  fonts: FontFamilies,
) => {
  const { width, height, card, brand, title, subline, stats } = CONFIG;
  const date = getShareDateParts(event.date);

  drawCover(context, cover, width, height);
  context.fillStyle = 'rgba(26, 28, 30, 0.68)';
  context.fillRect(0, 0, width, height);

  context.save();
  context.shadowColor = card.shadowColor;
  context.shadowBlur = card.shadowBlur;
  context.shadowOffsetY = card.shadowOffsetY;
  fillRoundedRect(
    context,
    card.x,
    card.y,
    card.width,
    card.height,
    card.radius,
    COLORS.neutral50,
  );
  context.restore();

  if (logo && logo.width && logo.height) {
    context.drawImage(
      logo,
      brand.logoX,
      brand.logoY,
      brand.logoSize,
      brand.logoSize,
    );
  } else {
    context.fillStyle = COLORS.primary;
    context.beginPath();
    context.arc(brand.dotX, brand.dotY, brand.dotRadius, 0, Math.PI * 2);
    context.fill();
  }

  context.fillStyle = COLORS.primary;
  context.font = font(700, brand.fontSize, fonts.sans);
  context.textBaseline = 'middle';
  context.fillText('WishWe', brand.textX, brand.textY);

  context.textBaseline = 'top';
  context.fillStyle = COLORS.neutral900;
  context.font = font(700, title.fontSize, fonts.sans);
  const titleLines = wrapText(
    context,
    event.title,
    title.maxWidth,
    title.maxLines,
  );

  drawTextLines(context, titleLines, title.x, title.y, title.lineHeight);

  context.fillStyle = COLORS.neutral700;
  context.font = font(400, subline.fontSize, fonts.sans);
  const sublineText = `${eventTypeLabel(event)}  ·  hosted by ${event.host.username}`;

  context.fillText(
    ellipsize(context, sublineText, subline.maxWidth),
    subline.x,
    subline.y,
  );

  const statValues: [string, string][] = [
    [date.date || event.date || '—', 'Date'],
    [date.time || '—', event.type === 'plan' ? 'Starts' : 'When'],
    [getWhereLabel(event.location), 'Where'],
  ];
  const statColWidth = Math.floor(stats.totalWidth / statValues.length);

  statValues.forEach(([value, label], index) => {
    const colX = stats.startX + statColWidth * index;

    if (index > 0) {
      context.fillStyle = COLORS.neutral200;
      context.fillRect(colX, stats.top, 1, stats.separatorHeight);
    }

    context.fillStyle = COLORS.neutral900;
    context.font = font(700, stats.valueFontSize, fonts.sans);
    context.fillText(
      ellipsize(context, value, statColWidth - stats.valuePaddingRight),
      colX + stats.paddingLeft,
      stats.top,
    );
    context.fillStyle = COLORS.neutral500;
    context.font = font(400, stats.labelFontSize, fonts.sans);
    context.fillText(
      label,
      colX + stats.paddingLeft,
      stats.top + stats.labelOffsetY,
    );
  });
};
