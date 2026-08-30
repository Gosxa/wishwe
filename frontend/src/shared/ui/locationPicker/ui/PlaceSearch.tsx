'use client';

import clsx from 'clsx';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type RefObject,
} from 'react';
import { trackLocationPicker } from '@/shared/lib/googleMaps/analytics';
import type { AddressParts } from '@/shared/lib/googleMaps/formatLocation';
import type { MapsLibraries } from '@/shared/lib/googleMaps/loadGoogleMaps';
import {
  createSessionToken,
  fetchPlaceDetails,
  fetchSuggestions,
  type SourcedSuggestion,
} from '@/shared/lib/googleMaps/placesService';
import type { ResolvedPlace } from '@/shared/lib/googleMaps/types';
import { Location, SearchIcon, X } from '../../icons';
import { Spinner } from '../../spinner/Spinner';
import { LOCATION_PICKER_COPY as COPY } from '../copy';
import s from '../locationPicker.module.scss';

const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 3;
const LIST_ID = 'locationPickerSuggestions';

type SearchStatus = 'idle' | 'searching' | 'results' | 'empty' | 'failed';

type Props = {
  libraries: MapsLibraries | null;
  inputRef: RefObject<HTMLInputElement | null>;
  bias: google.maps.LatLngBounds | null;
  onPicked: (result: { place: ResolvedPlace; parts: AddressParts }) => void;
  onListOpenChange: (isOpen: boolean) => void;
};

export const PlaceSearch = ({
  libraries,
  inputRef,
  bias,
  onPicked,
  onListOpenChange,
}: Props) => {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<SearchStatus>('idle');
  const [suggestions, setSuggestions] = useState<SourcedSuggestion[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [listedQuery, setListedQuery] = useState('');

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestId = useRef(0);
  const biasRef = useRef(bias);
  const pendingQuery = useRef<string | null>(null);

  const sessionToken =
    useRef<google.maps.places.AutocompleteSessionToken | null>(null);

  useEffect(() => {
    biasRef.current = bias;
  }, [bias]);

  const getSessionToken = useCallback((places: MapsLibraries['places']) => {
    sessionToken.current ??= createSessionToken(places);

    return sessionToken.current;
  }, []);

  const isListOpen = status !== 'idle' && status !== 'searching';

  useEffect(() => {
    onListOpenChange(isListOpen);
  }, [isListOpen, onListOpenChange]);

  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    [],
  );

  const closeList = useCallback(() => {
    setStatus('idle');
    setSuggestions([]);
    setActiveIndex(-1);
  }, []);

  const runSearch = useCallback(
    async (input: string) => {
      if (!libraries) return;

      const id = ++requestId.current;

      setStatus('searching');

      try {
        const results = await fetchSuggestions({
          places: libraries.places,
          input,
          sessionToken: getSessionToken(libraries.places),
          bias: biasRef.current,
        });

        if (id !== requestId.current) return;

        trackLocationPicker('location_picker_search', {
          query_length: input.length,
          result_count: results.length,
        });

        setSuggestions(results);
        setListedQuery(input);
        setActiveIndex(results.length > 0 ? 0 : -1);
        setStatus(results.length > 0 ? 'results' : 'empty');
      } catch {
        if (id !== requestId.current) return;

        setSuggestions([]);
        setActiveIndex(-1);
        setStatus('failed');
        trackLocationPicker('location_picker_failed', { stage: 'search' });
      }
    },
    [getSessionToken, libraries],
  );

  useEffect(() => {
    if (!libraries) return;

    const pending = pendingQuery.current;

    if (!pending) return;

    pendingQuery.current = null;

    const timer = setTimeout(() => void runSearch(pending), 0);

    return () => clearTimeout(timer);
  }, [libraries, runSearch]);

  const handleChange = (value: string) => {
    setQuery(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.trim().length < MIN_QUERY_LENGTH) {
      requestId.current += 1;
      closeList();

      return;
    }

    debounceRef.current = setTimeout(() => {
      if (!libraries) {
        pendingQuery.current = value.trim();

        return;
      }

      void runSearch(value.trim());
    }, DEBOUNCE_MS);
  };

  const pick = async (suggestion: SourcedSuggestion) => {
    setQuery(suggestion.primary);
    closeList();

    try {
      onPicked(await fetchPlaceDetails(suggestion.prediction));
    } catch {
      setStatus('failed');
      trackLocationPicker('location_picker_failed', { stage: 'search' });
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape' && isListOpen) {
      event.preventDefault();
      event.stopPropagation();
      closeList();

      return;
    }

    if (!isListOpen || suggestions.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex(index => (index + 1) % suggestions.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex(
        index => (index - 1 + suggestions.length) % suggestions.length,
      );
    } else if (event.key === 'Enter') {
      event.preventDefault();

      const chosen = suggestions[activeIndex];

      if (chosen) void pick(chosen);
    }
  };

  const clear = () => {
    setQuery('');
    requestId.current += 1;
    closeList();
    inputRef.current?.focus();
  };

  return (
    <div className={s.searchWrapper}>
      <div className={s.searchField}>
        <span className={s.searchIcon} aria-hidden="true">
          <SearchIcon />
        </span>
        <input
          ref={inputRef}
          type="text"
          className={s.searchInput}
          placeholder={COPY.searchPlaceholder}
          value={query}
          onChange={event => handleChange(event.target.value)}
          onKeyDown={handleKeyDown}
          role="combobox"
          aria-expanded={isListOpen}
          aria-controls={LIST_ID}
          aria-autocomplete="list"
          aria-label={COPY.searchPlaceholder}
          aria-activedescendant={
            activeIndex >= 0 ? `${LIST_ID}-${activeIndex}` : undefined
          }
        />
        {status === 'searching' ? (
          <span className={s.searchSpinner}>
            <Spinner inline compact />
          </span>
        ) : (
          query.length > 0 && (
            <button
              type="button"
              className={s.searchClear}
              onClick={clear}
              aria-label="Clear search"
            >
              <X />
            </button>
          )
        )}
      </div>

      {isListOpen && (
        <div className={s.suggestionPanel}>
          {status === 'results' && (
            <>
              <ul className={s.suggestionList} id={LIST_ID} role="listbox">
                {suggestions.map((suggestion, index) => (
                  <li
                    key={suggestion.placeId}
                    id={`${LIST_ID}-${index}`}
                    role="option"
                    aria-selected={index === activeIndex}
                    className={clsx(
                      s.suggestion,
                      index === activeIndex && s.suggestionActive,
                    )}
                    onMouseEnter={() => setActiveIndex(index)}
                    onMouseDown={event => event.preventDefault()}
                    onClick={() => void pick(suggestion)}
                  >
                    <span className={s.suggestionIcon} aria-hidden="true">
                      <Location size={14} />
                    </span>
                    <span className={s.suggestionText}>
                      <span className={s.suggestionPrimary}>
                        {suggestion.primary}
                      </span>
                      <span className={s.suggestionSecondary}>
                        {suggestion.secondary}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
              <p className={s.suggestionMeta}>
                <span>{COPY.searchMeta.resultCount(suggestions.length)}</span>
                <span>{COPY.searchMeta.poweredBy}</span>
              </p>
            </>
          )}

          {status === 'empty' && (
            <div className={s.suggestionState} id={LIST_ID}>
              <span className={s.suggestionStateIcon} aria-hidden="true">
                <SearchIcon />
              </span>
              <p className={s.suggestionStateTitle}>
                {COPY.errors.noResults.title(listedQuery)}
              </p>
              <p className={s.suggestionStateBody}>
                {COPY.errors.noResults.body}
              </p>
            </div>
          )}

          {status === 'failed' && (
            <div className={s.suggestionState} id={LIST_ID}>
              <p className={s.suggestionStateTitle}>
                {COPY.errors.searchFailed.title}
              </p>
              <p className={s.suggestionStateBody}>
                {COPY.errors.searchFailed.body}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
