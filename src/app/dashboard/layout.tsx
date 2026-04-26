'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { 
  LayoutDashboard, 
  Wallet, 
  ArrowLeftRight, 
  Phone, 
  Gift, 
  Settings, 
  LogOut, 
  Menu,
  X,
  ChevronDown,
  User,
  Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Wallet', href: '/dashboard/wallet', icon: Wallet },
  { name: 'Crypto', href: '/dashboard/crypto', icon: ArrowLeftRight },
  { name: 'Bills', href: '/dashboard/bills', icon: Phone },
  { name: 'Gift Cards', href: '/dashboard/giftcards', icon: Gift },
];

const adminNavigation = [
  { name: 'Dashboard', href: '/dashboard/admin', icon: LayoutDashboard },
  { name: 'Users', href: '/dashboard/admin/users', icon: User },
  { name: 'KYC', href: '/dashboard/admin/kyc', icon: Shield },
  { name: 'Gift Cards', href: '/dashboard/admin/giftcards', icon: Gift },
  { name: 'Transactions', href: '/dashboard/admin/transactions', icon: Shield },
  { name: 'Settings', href: '/dashboard/admin/settings', icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const userRole = (session?.user as { role?: string })?.role;
  const isAdmin = userRole === 'admin' || userRole === 'super_admin';

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse text-emerald-600 font-semibold">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r transform transition-transform duration-200 lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-2 p-4 border-b">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
                <span className="text-white font-bold text-sm">CX</span>
              </div>
              <span className="font-bold text-lg text-slate-900">Clexpay</span>
            </Link>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                    isActive 
                      ? "bg-emerald-50 text-emerald-700" 
                      : "text-slate-600 hover:bg-slate-100"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}

            {isAdmin && (
              <>
                <div className="pt-4 pb-2">
                  <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Admin</p>
                </div>
                {adminNavigation.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                        isActive 
                          ? "bg-emerald-50 text-emerald-700" 
                          : "text-slate-600 hover:bg-slate-100"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.name}
                    </Link>
                  );
                })}
              </>
            )}
          </nav>

          <div className="p-4 border-t">
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-3 w-full px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <div className="h-9 w-9 rounded-full bg-emerald-100 flex items-center justify-center">
                  <span className="text-emerald-700 font-semibold text-sm">
                    {session.user?.name?.[0]?.toUpperCase() || session.user?.email?.[0]?.toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {session.user?.name || 'User'}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{session.user?.email}</p>
                </div>
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </button>

              {userMenuOpen && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-xl border shadow-lg p-2">
                  <button
                    onClick={() => signOut({ callbackUrl: '/auth/login' })}
                    className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-40 bg-white border-b">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-100"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            
            <div className="flex-1 lg:flex-none" />
            
            <div className="flex items-center gap-2">
            </div>
          </div>
        </header>

        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
