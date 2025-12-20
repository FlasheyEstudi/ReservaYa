'use client';

import { UserRole } from '@prisma/client';
import { AdminSidebar } from './AdminSidebar';
import { ManagerSidebar } from './ManagerSidebar';

interface RoleLayoutProps {
  children: React.ReactNode;
  userRole: UserRole;
}

export function RoleLayout({ children, userRole }: RoleLayoutProps) {
  const renderSidebar = () => {
    // Cast to string to avoid IDE false positives if UserRole enum isn't perfectly synced
    switch (userRole as string) {
      case 'ADMIN':
        return <AdminSidebar />;
      case 'MANAGER':
        return <ManagerSidebar />;
      case 'BARTENDER':
        return null; // Bartender view is full screen
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-background">
      {renderSidebar()}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}