'use client';

import { QueryProvider } from './query-provider';
import { AuthProvider } from '@/hooks/useAuth';
import { Toaster } from 'sonner';
import { Check, Info, TriangleAlert, X } from 'lucide-react';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>
        {children}
        <Toaster
          className="albertus-toaster"
          position="top-right"
          offset={{ top: 20, right: 20 }}
          mobileOffset={{ top: 12, right: 12, left: 12 }}
          visibleToasts={3}
          duration={5000}
          closeButton
          icons={{
            success: <Check aria-hidden="true" size={17} strokeWidth={2.5} />,
            error: <X aria-hidden="true" size={17} strokeWidth={2.5} />,
            warning: <TriangleAlert aria-hidden="true" size={17} strokeWidth={2} />,
            info: <Info aria-hidden="true" size={17} strokeWidth={2} />,
          }}
        />
      </AuthProvider>
    </QueryProvider>
  );
}
