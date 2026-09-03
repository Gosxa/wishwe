import { isGeolocationSupported } from './requestPosition';
import type { GeolocationPermission } from './types';

export const readGeolocationPermission =
  async (): Promise<GeolocationPermission> => {
    if (!isGeolocationSupported()) return 'unsupported';

    const query = navigator.permissions?.query;

    if (!query) return 'unknown';

    try {
      const status = await query.call(navigator.permissions, {
        name: 'geolocation',
      });

      return status.state;
    } catch {
      return 'unknown';
    }
  };
