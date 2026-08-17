/* eslint-disable no-param-reassign */

import type { FeedEvent } from './types';
import { FALLBACK_COVER } from './feedMapper';

export const SHARE_FORMATS = [
  {
    id: 'poster',
    label: 'Poster',
    width: 1200,
    height: 630,
    description: 'link previews, X, Facebook',
  },
  {
    id: 'card',
    label: 'Card',
    width: 1200,
    height: 630,
    description: 'detail-forward',
  },
  {
    id: 'story',
    label: 'Story',
    width: 1080,
    height: 1920,
    description: 'Instagram Stories, WhatsApp status',
  },
] as const;

export type ShareFormat = (typeof SHARE_FORMATS)[number]['id'];

export type GeneratedShareImage = {
  format: ShareFormat;
  blob: Blob;
};

export type ShareDateParts = {
  date: string;
  time: string;
};

type CanvasImage = HTMLImageElement | null;

type FontFamilies = {
  sans: string;
  serif: string;
};

type PillOptions = {
  x: number;
  y: number;
  height: number;
  textSize: number;
  horizontalPadding: number;
  fill: string;
  borderWidth: number;
  isDashed?: boolean;
};

const COLORS = {
  primary: '#474b24',
  purple: '#cbbefa',
  yellow: '#ffeeaa',
  neutral900: '#1a1c1e',
  neutral700: '#484b4f',
  neutral500: '#8a9199',
  neutral200: '#dbddd4',
  neutral50: '#f7f3e3',
};

const FALLBACK_FONT_SANS = 'Arial, sans-serif';
const FALLBACK_FONT_SERIF = 'Georgia, serif';

const AVATAR_SILHOUETTE_PATH =
  'M25.3332 28V25.3333C25.3332 23.9188 24.7713 22.5623 23.7711 21.5621C22.7709 20.5619 21.4143 20 19.9998 20H11.9998C10.5853 20 9.22879 20.5619 8.2286 21.5621C7.22841 22.5623 6.6665 23.9188 6.6665 25.3333V28M21.3332 9.33333C21.3332 12.2789 18.9454 14.6667 15.9998 14.6667C13.0543 14.6667 10.6665 12.2789 10.6665 9.33333C10.6665 6.38781 13.0543 4 15.9998 4C18.9454 4 21.3332 6.38781 21.3332 9.33333Z';

const POSTER_CONFIG = {
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

const CARD_CONFIG = {
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

const STORY_CONFIG = {
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

const font = (weight: number, size: number, family: string, style = 'normal') =>
  `${style} ${weight} ${size}px ${family}`;

const setLineDash = (
  context: CanvasRenderingContext2D,
  pattern: number[] = [],
) => {
  if (typeof context.setLineDash === 'function') {
    context.setLineDash(pattern);
  }
};

const roundedRect = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) => {
  const safeRadius = Math.min(radius, width / 2, height / 2);

  context.beginPath();
  context.moveTo(x + safeRadius, y);
  context.lineTo(x + width - safeRadius, y);
  context.arc(
    x + width - safeRadius,
    y + safeRadius,
    safeRadius,
    -Math.PI / 2,
    0,
    false,
  );
  context.lineTo(x + width, y + height - safeRadius);
  context.arc(
    x + width - safeRadius,
    y + height - safeRadius,
    safeRadius,
    0,
    Math.PI / 2,
    false,
  );
  context.lineTo(x + safeRadius, y + height);
  context.arc(
    x + safeRadius,
    y + height - safeRadius,
    safeRadius,
    Math.PI / 2,
    Math.PI,
    false,
  );
  context.lineTo(x, y + safeRadius);
  context.arc(
    x + safeRadius,
    y + safeRadius,
    safeRadius,
    Math.PI,
    (Math.PI * 3) / 2,
    false,
  );
  context.closePath();
};

const fillRoundedRect = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fill: string,
) => {
  roundedRect(context, x, y, width, height, radius);
  context.fillStyle = fill;
  context.fill();
};

const drawFallbackCover = (
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
) => {
  const gradient = context.createLinearGradient(0, 0, 0, height);

  gradient.addColorStop(0, '#ffb37a');
  gradient.addColorStop(0.38, '#f2542d');
  gradient.addColorStop(0.72, '#562343');
  gradient.addColorStop(1, COLORS.neutral900);
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);
};

const drawCover = (
  context: CanvasRenderingContext2D,
  image: CanvasImage,
  width: number,
  height: number,
) => {
  drawFallbackCover(context, width, height);

  if (!image) return;

  const sourceWidth = image.width;
  const sourceHeight = image.height;

  if (!sourceWidth || !sourceHeight) return;

  const scale = Math.max(width / sourceWidth, height / sourceHeight);
  const drawnWidth = sourceWidth * scale;
  const drawnHeight = sourceHeight * scale;

  context.drawImage(
    image,
    (width - drawnWidth) / 2,
    (height - drawnHeight) / 2,
    drawnWidth,
    drawnHeight,
  );
};

const drawPill = (
  context: CanvasRenderingContext2D,
  text: string,
  options: PillOptions,
  fonts: FontFamilies,
) => {
  const {
    x,
    y,
    height,
    textSize,
    horizontalPadding,
    fill,
    borderWidth,
    isDashed,
  } = options;

  context.font = font(400, textSize, fonts.serif, 'italic');
  const width = context.measureText(text).width + horizontalPadding * 2;

  fillRoundedRect(context, x, y, width, height, height / 2, fill);
  roundedRect(context, x, y, width, height, height / 2);
  context.strokeStyle = COLORS.neutral900;
  context.lineWidth = borderWidth;

  if (isDashed) {
    setLineDash(context, [borderWidth * 3.5, borderWidth * 2.5]);
  } else {
    setLineDash(context, []);
  }

  context.stroke();
  setLineDash(context, []);

  context.fillStyle = COLORS.neutral900;
  context.textBaseline = 'middle';
  context.fillText(text, x + horizontalPadding, y + height / 2 + 1);

  return width;
};

const drawAvatarSilhouetteFallback = (context: CanvasRenderingContext2D) => {
  context.beginPath();
  context.moveTo(25.3332, 28);
  context.lineTo(25.3332, 25.3333);
  context.bezierCurveTo(25.3332, 23.9188, 24.7713, 22.5623, 23.7711, 21.5621);
  context.bezierCurveTo(22.7709, 20.5619, 21.4143, 20, 19.9998, 20);
  context.lineTo(11.9998, 20);
  context.bezierCurveTo(10.5853, 20, 9.22879, 20.5619, 8.2286, 21.5621);
  context.bezierCurveTo(7.22841, 22.5623, 6.6665, 23.9188, 6.6665, 25.3333);
  context.lineTo(6.6665, 28);

  context.moveTo(21.3332, 9.33333);
  context.bezierCurveTo(21.3332, 12.2789, 18.9454, 14.6667, 15.9998, 14.6667);
  context.bezierCurveTo(13.0543, 14.6667, 10.6665, 12.2789, 10.6665, 9.33333);
  context.bezierCurveTo(10.6665, 6.38781, 13.0543, 4, 15.9998, 4);
  context.bezierCurveTo(18.9454, 4, 21.3332, 6.38781, 21.3332, 9.33333);
  context.closePath();

  context.stroke();
};

const drawAvatarSilhouette = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
) => {
  const iconSize = size * 0.7;
  const iconX = x + (size - iconSize) / 2;
  const iconY = y + (size - iconSize) / 2;
  const scale = iconSize / 32;

  context.save();
  context.translate(iconX, iconY);
  context.scale(scale, scale);
  context.strokeStyle = COLORS.neutral500;
  context.lineWidth = 2;
  context.lineCap = 'round';
  context.lineJoin = 'round';

  if (typeof Path2D !== 'undefined') {
    context.stroke(new Path2D(AVATAR_SILHOUETTE_PATH));
  } else {
    drawAvatarSilhouetteFallback(context);
  }

  context.restore();
};

const drawAvatar = (
  context: CanvasRenderingContext2D,
  image: CanvasImage,
  x: number,
  y: number,
  size: number,
) => {
  context.save();
  context.beginPath();
  context.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  context.clip();
  context.fillStyle = COLORS.neutral50;
  context.fillRect(x, y, size, size);

  if (image && image.width && image.height) {
    const scale = Math.max(size / image.width, size / image.height);
    const width = image.width * scale;
    const height = image.height * scale;

    context.drawImage(
      image,
      x + (size - width) / 2,
      y + (size - height) / 2,
      width,
      height,
    );
  } else {
    drawAvatarSilhouette(context, x, y, size);
  }

  context.restore();
};

const drawScrim = (
  context: CanvasRenderingContext2D,
  width: number,
  startY: number,
  height: number,
) => {
  const gradient = context.createLinearGradient(0, startY, 0, startY + height);

  gradient.addColorStop(0, 'rgba(26, 28, 30, 0)');
  gradient.addColorStop(0.55, 'rgba(26, 28, 30, 0.62)');
  gradient.addColorStop(1, 'rgba(26, 28, 30, 0.94)');
  context.fillStyle = gradient;
  context.fillRect(0, startY, width, height);
};

const ellipsize = (
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
) => {
  if (context.measureText(text).width <= maxWidth) return text;

  let shortened = text;

  while (
    shortened.length > 1 &&
    context.measureText(`${shortened}…`).width > maxWidth
  ) {
    shortened = shortened.slice(0, -1);
  }

  return `${shortened.trimEnd()}…`;
};

const wrapText = (
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
) => {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let current = '';

  words.forEach(word => {
    const candidate = current ? `${current} ${word}` : word;

    if (context.measureText(candidate).width <= maxWidth || !current) {
      current = candidate;

      return;
    }

    lines.push(current);
    current = word;
  });

  if (current) lines.push(current);

  if (lines.length <= maxLines) {
    return lines.map(line => ellipsize(context, line, maxWidth));
  }

  const visible = lines.slice(0, maxLines);

  visible[maxLines - 1] = ellipsize(
    context,
    `${visible[maxLines - 1]} ${lines.slice(maxLines).join(' ')}`,
    maxWidth,
  );

  return visible.map(line => ellipsize(context, line, maxWidth));
};

const drawTextLines = (
  context: CanvasRenderingContext2D,
  lines: string[],
  x: number,
  y: number,
  lineHeight: number,
) => {
  lines.forEach((line, index) => {
    context.fillText(line, x, y + index * lineHeight);
  });

  return y + lines.length * lineHeight;
};

export const getShareDateParts = (dateText: string): ShareDateParts => {
  const [rawDate = '', rawTime = ''] = dateText.split(/\s+@\s+/);
  const match = rawDate.match(/^([A-Za-z]+),\s+([A-Za-z]+)\s+(\d{1,2})/);

  if (!match) {
    return { date: rawDate, time: rawTime };
  }

  return {
    date: `${match[1].slice(0, 3)}, ${match[3]} ${match[2].slice(0, 3)}`,
    time: rawTime,
  };
};

const getWhereLabel = (location: string) => {
  const area = location.split('·')[0].trim();
  const parts = area.split(',').map(part => part.trim());

  return parts.at(-1) || area || '—';
};

const eventTypeLabel = (event: FeedEvent) =>
  event.type === 'plan' ? 'Plan' : 'Wish';

const watermarkColor = (event: FeedEvent) =>
  event.image === FALLBACK_COVER ? COLORS.primary : COLORS.neutral50;

const drawPoster = (
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
    avatar: avatarCfg,
    host,
  } = POSTER_CONFIG;
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

  drawAvatar(context, avatar, avatarCfg.x, avatarCfg.y, avatarCfg.size);
  context.globalAlpha = host.opacity;
  context.font = font(400, host.fontSize, fonts.sans);
  context.textBaseline = 'middle';
  context.fillText(`hosted by ${event.host.username}`, host.x, host.y);
  context.globalAlpha = 1;
};

const drawCard = (
  context: CanvasRenderingContext2D,
  event: FeedEvent,
  cover: CanvasImage,
  logo: CanvasImage,
  fonts: FontFamilies,
) => {
  const { width, height, card, brand, title, subline, stats } = CARD_CONFIG;
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

const drawStory = (
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
    avatar: avatarCfg,
    cta,
  } = STORY_CONFIG;
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
  drawAvatar(context, avatar, avatarCfg.x, currentY, avatarCfg.size);
  context.globalAlpha = avatarCfg.hostOpacity;
  context.font = font(400, avatarCfg.hostFontSize, fonts.sans);
  context.textBaseline = 'middle';
  context.fillText(
    `hosted by ${event.host.username}`,
    avatarCfg.hostX,
    currentY + avatarCfg.hostOffsetY,
  );
  currentY += avatarCfg.nextGap;

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

const loadImage = (source: string | null | undefined) => {
  if (!source) return Promise.resolve<CanvasImage>(null);

  return new Promise<CanvasImage>(resolve => {
    const image = new Image();

    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = source;
  });
};

const getFonts = async (): Promise<FontFamilies> => {
  await document.fonts?.ready;

  const styles = getComputedStyle(document.documentElement);
  const sans = styles.getPropertyValue('--font-sk-modernist').trim();
  const serif = styles.getPropertyValue('--font-instrument-serif').trim();

  return {
    sans: sans || FALLBACK_FONT_SANS,
    serif: serif || FALLBACK_FONT_SERIF,
  };
};

const canvasBlob = (canvas: HTMLCanvasElement) =>
  new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(blob => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Could not render the share image.'));
      }
    }, 'image/png');
  });

const renderImage = async (
  format: ShareFormat,
  event: FeedEvent,
  cover: CanvasImage,
  avatar: CanvasImage,
  logo: CanvasImage,
  fonts: FontFamilies,
) => {
  const spec = SHARE_FORMATS.find(item => item.id === format);

  if (!spec) throw new Error(`Unsupported share format: ${format}`);

  const canvas = document.createElement('canvas');

  canvas.width = spec.width;
  canvas.height = spec.height;

  const context = canvas.getContext('2d');

  if (!context) throw new Error('Canvas rendering is not supported.');

  if (format === 'poster') {
    drawPoster(context, event, cover, avatar, fonts);
  } else if (format === 'card') {
    drawCard(context, event, cover, logo, fonts);
  } else {
    drawStory(context, event, cover, avatar, fonts);
  }

  return canvasBlob(canvas);
};

export const generateShareImages = async (
  event: FeedEvent,
): Promise<GeneratedShareImage[]> => {
  const [cover, avatar, logo, fonts] = await Promise.all([
    loadImage(event.image),
    loadImage(event.host.avatar),
    loadImage('/icon.svg'),
    getFonts(),
  ]);

  return Promise.all(
    SHARE_FORMATS.map(async spec => ({
      format: spec.id,
      blob: await renderImage(spec.id, event, cover, avatar, logo, fonts),
    })),
  );
};

export const shareImageFilename = (
  event: Pick<FeedEvent, 'id' | 'title'>,
  format: ShareFormat,
) => {
  const slug = event.title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);

  return `wishwe-${slug || `event-${event.id}`}-${format}.png`;
};
