import { ReactNode } from 'react';
import { AppSidebar } from './AppSidebar';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen flex w-full bg-[#1d2125]">
      <AppSidebar />
      <main className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

