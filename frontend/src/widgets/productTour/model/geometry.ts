import type {
  AnchorRect,
  CardPosition,
  TourPlacement,
  TourStep,
} from './types';

export const TOUR_ATTR = 'data-tour';

const GAP = 16;
const MARGIN = 20;
const ARROW_INSET = 28;

const DEFAULT_PADDING = 8;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export const findAnchors = (anchor: TourStep['anchor']): HTMLElement[] => {
  if (!anchor) return [];

  for (const key of Array.isArray(anchor) ? anchor : [anchor]) {
    const elements = Array.from(
      document.querySelectorAll<HTMLElement>(
        `[${TOUR_ATTR}="${CSS.escape(key)}"]`,
      ),
    ).filter(element => element.getBoundingClientRect().width > 0);

    if (elements.length) return elements;
  }

  return [];
};

export const isStepAvailable = (step: TourStep) =>
  !step.anchor || findAnchors(step.anchor).length > 0;

export const measureAnchors = (
  elements: HTMLElement[],
  step: TourStep,
): AnchorRect => {
  const boxes = elements.map(element => element.getBoundingClientRect());
  const top = Math.min(...boxes.map(box => box.top));
  const left = Math.min(...boxes.map(box => box.left));
  const right = Math.max(...boxes.map(box => box.right));
  const bottom = Math.max(...boxes.map(box => box.bottom));

  const padding = step.padding ?? DEFAULT_PADDING;
  const ownRadius =
    Number.parseFloat(getComputedStyle(elements[0]).borderTopLeftRadius) || 0;

  return {
    top: top - padding,
    left: left - padding,
    width: right - left + padding * 2,
    height: bottom - top + padding * 2,
    radius: step.radius ?? ownRadius + padding,
  };
};

export const centerRect = (): AnchorRect => ({
  top: window.innerHeight / 2,
  left: window.innerWidth / 2,
  width: 0,
  height: 0,
  radius: 0,
});

const fits = (
  placement: TourPlacement,
  rect: AnchorRect,
  card: { width: number; height: number },
  viewport: { width: number; height: number },
) => {
  switch (placement) {
    case 'bottom':
      return (
        rect.top + rect.height + GAP + card.height <= viewport.height - MARGIN
      );
    case 'top':
      return rect.top - GAP - card.height >= MARGIN;
    case 'right':
      return (
        rect.left + rect.width + GAP + card.width <= viewport.width - MARGIN
      );
    case 'left':
      return rect.left - GAP - card.width >= MARGIN;
  }
};

const OPPOSITE: Record<TourPlacement, TourPlacement> = {
  top: 'bottom',
  bottom: 'top',
  left: 'right',
  right: 'left',
};

export const placeCard = (
  rect: AnchorRect,
  card: { width: number; height: number },
  preferred: TourPlacement,
  viewport: { width: number; height: number },
): CardPosition => {
  const order: TourPlacement[] = [
    preferred,
    OPPOSITE[preferred],
    ...(['bottom', 'top', 'right', 'left'] as TourPlacement[]),
  ];

  const placement =
    order.find(candidate => fits(candidate, rect, card, viewport)) ?? preferred;

  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  const alignedLeft = clamp(
    centerX - card.width / 2,
    MARGIN,
    Math.max(MARGIN, viewport.width - MARGIN - card.width),
  );
  const alignedTop = clamp(
    centerY - card.height / 2,
    MARGIN,
    Math.max(MARGIN, viewport.height - MARGIN - card.height),
  );

  const top =
    placement === 'bottom'
      ? rect.top + rect.height + GAP
      : placement === 'top'
        ? rect.top - GAP - card.height
        : alignedTop;

  const left =
    placement === 'right'
      ? rect.left + rect.width + GAP
      : placement === 'left'
        ? rect.left - GAP - card.width
        : alignedLeft;

  const arrow =
    placement === 'top' || placement === 'bottom'
      ? clamp(centerX - left, ARROW_INSET, card.width - ARROW_INSET)
      : clamp(centerY - top, ARROW_INSET, card.height - ARROW_INSET);

  return { top, left, placement, arrow };
};
