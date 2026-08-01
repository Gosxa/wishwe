export type TourPlacement = 'top' | 'bottom' | 'left' | 'right';

export type TourStep = {
  id: string;
  anchor?: string | string[];
  title: string;
  body: string;
  placement?: TourPlacement;
  padding?: number;
  radius?: number;
  primaryLabel?: string;
  secondaryLabel?: string;
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
