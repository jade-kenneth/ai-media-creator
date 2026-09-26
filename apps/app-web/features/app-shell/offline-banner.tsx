'use client';

import { WifiOffIcon } from 'lucide-react';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

import {
  Alert,
  AlertContent,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { useOnlineStatus } from '@/hooks/use-online-status';

const OfflineDetailContext = createContext<(detail: string | null) => void>(
  () => undefined,
);

/** Lets the current screen set the detail sentence of the offline banner. */
export function useOfflineDetail(detail: string) {
  const setDetail = useContext(OfflineDetailContext);

  useEffect(() => {
    setDetail(detail);

    return () => setDetail(null);
  }, [detail, setDetail]);
}

/**
 * The global offline banner, directly under the top bar on every screen
 * (Design Reference §3): “You're offline.” plus the screen's own detail.
 */
export function OfflineBannerProvider({
  header,
  children,
}: {
  header: ReactNode;
  children: ReactNode;
}) {
  const online = useOnlineStatus();
  const [detail, setDetail] = useState<string | null>(null);

  return (
    <OfflineDetailContext.Provider value={setDetail}>
      {header}
      {online ? null : (
        <Alert variant="warning" edge="flush" className="sticky top-15 z-30">
          <WifiOffIcon />
          <AlertContent>
            <AlertTitle>You’re offline.</AlertTitle>{' '}
            <AlertDescription>
              {detail ?? 'Changes will be possible when you reconnect.'}
            </AlertDescription>
          </AlertContent>
        </Alert>
      )}
      {children}
    </OfflineDetailContext.Provider>
  );
}
