'use client';

import { useState } from 'react';
import { LocationField } from '@/features/eventForm/ui/LocationField';
import type { LocationPin } from '@/shared/lib/googleMaps/types';

export default function TestLocationPage() {
  const [value, setValue] = useState('');
  const [pin, setPin] = useState<LocationPin | null>(null);
  const [wasCleared, setWasCleared] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  const onChange = (next: string) => {
    setValue(next);
    setAnnouncement('');

    if (pin && next !== pin.formatted) {
      setPin(null);
      setWasCleared(true);
    }
  };

  return (
    <div style={{ maxWidth: 480, padding: 32 }}>
      <h1 style={{ marginBottom: 24 }}>Location picker test</h1>

      <LocationField
        mode="create"
        placeholder="Add a place or an address"
        input={{ value, onChange }}
        picker={{
          pin,
          status: pin ? 'pinned' : wasCleared ? 'edited' : 'none',
          announcement,
          apply: next => {
            setValue(next.formatted);
            setPin(next);
            setWasCleared(false);
            setAnnouncement(`Location set to ${next.formatted}`);
          },
          clear: () => {
            setValue('');
            setPin(null);
            setWasCleared(false);
            setAnnouncement('');
          },
        }}
      />

      <pre
        style={{
          marginTop: 32,
          padding: 16,
          background: '#e8e4d8',
          borderRadius: 8,
          fontSize: 12,
          whiteSpace: 'pre-wrap',
        }}
      >
        {JSON.stringify({ value, pin }, null, 2)}
      </pre>
    </div>
  );
}
