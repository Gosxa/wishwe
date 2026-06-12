'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { Asterisk, ChevronLeft, ChevronRight } from '@shared/ui/icons';
import { HelperText } from '@shared/ui/helperText/HelperText';
import type { Category } from '@/shared/client_api/event';
import { formatCategoryDisplayName } from '@/shared/lib/formatCategoryName';
import s from './categoryPicker.module.scss';

type Props = {
  categories: Category[];
  selected: number | null;
  onChange: (id: number | null) => void;
  error?: string;
};

const SCROLL_EDGE_TOLERANCE = 1;

export const CategoryPicker = ({
  categories,
  selected,
  onChange,
  error,
}: Props) => {
  const chipsRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const node = chipsRef.current;

    if (!node) return;

    setCanScrollLeft(node.scrollLeft > SCROLL_EDGE_TOLERANCE);
    setCanScrollRight(
      node.scrollLeft + node.clientWidth <
        node.scrollWidth - SCROLL_EDGE_TOLERANCE,
    );
  }, []);

  useEffect(() => {
    updateScrollState();

    const node = chipsRef.current;

    if (!node) return;

    node.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);

    return () => {
      node.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [categories.length, updateScrollState]);

  const scrollChips = (direction: -1 | 1) => {
    const node = chipsRef.current;

    if (!node) return;

    node.scrollBy({
      left: direction * Math.max(node.clientWidth * 0.8, 120),
      behavior: 'smooth',
    });
  };

  return (
    <div className={s.picker}>
      <span className={s.label}>
        Category
        <Asterisk />
      </span>
      <div className={s.row}>
        {canScrollLeft && (
          <button
            type="button"
            className={s.scrollButton}
            onClick={() => scrollChips(-1)}
            aria-label="Scroll categories left"
          >
            <ChevronLeft />
          </button>
        )}
        <div ref={chipsRef} className={s.chips}>
          {categories.map(category => (
            <button
              key={category.id}
              type="button"
              className={clsx(s.chip, selected === category.id && s.selected)}
              onClick={() =>
                onChange(selected === category.id ? null : category.id)
              }
            >
              {formatCategoryDisplayName(category.name)}
            </button>
          ))}
        </div>
        {canScrollRight && (
          <button
            type="button"
            className={s.scrollButton}
            onClick={() => scrollChips(1)}
            aria-label="Scroll categories right"
          >
            <ChevronRight />
          </button>
        )}
      </div>
      {error && <HelperText text={error} type="error" inline />}
    </div>
  );
};
