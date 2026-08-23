export type TourPlacement = 'top' | 'bottom' | 'left' | 'right';

export type TourQuickFill = {
  label: string;
  value: string;
};

export type TourStep = {
  id: string;
  anchor?: string | string[];
  title: string;
  body: string;
  hint?: string;
  placement?: TourPlacement;
  padding?: number;
  radius?: number;
  primaryLabel?: string;
  secondaryLabel?: string;
  awaitAction?: boolean;
  passthrough?: boolean;
  quickFill?: TourQuickFill;
};

export type AnchorRect = {
  top: number;
  left: number;
  width: number;
  height: number;
  radius: number;
};

export type CardPosition = {
  top: number;
  left: number;
  placement: TourPlacement;
  arrow: number;
};

export type TourEndReason = 'finished' | 'skipped';

export const isPassthrough = (step: TourStep) =>
  step.passthrough ?? step.awaitAction ?? false;
