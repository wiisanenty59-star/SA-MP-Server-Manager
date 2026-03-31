import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Shield, 
  Map, 
  Trophy, 
  Terminal, 
  Settings as SettingsIcon,
  LogOut,
  Server,
  Swords,
  Crown
} from 'lucide-react';
import { Button } from './ui/button';

function Layout({ children, onLogout, serverConfig }) {
  const location = useLocation();

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/players', label: 'Players', icon: Users },
    { path: '/gangs', label: 'Gangs', icon: Swords },
    { path: '/gang-rankings', label: 'Gang Rankings', icon: Crown },
    { path: '/admins', label: 'Admins', icon: Shield },
    { path: '/territories', label: 'Territories', icon: Map },
    { path: '/rankings', label: 'Rankings', icon: Trophy },
    { path: '/server-control', label: 'Server Control', icon: Server },
    { path: '/console', label: 'Console', icon: Terminal },
    { path: '/settings', label: 'Settings', icon: SettingsIcon },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-zinc-950 border-r border-zinc-800 fixed h-full flex flex-col" data-testid="sidebar">
        <div className="p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <Server className="w-8 h-8 text-amber-500" />
            <div>
              <h1 className="text-xl font-black text-zinc-50" style={{ fontFamily: 'Chivo, sans-serif' }}>
                SAMP Panel
              </h1>
              <p className="text-xs text-zinc-500 font-mono">Admin Control</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto scrollbar-thin">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    data-testid={`nav-${item.label.toLowerCase()}`}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm font-bold uppercase tracking-wider transition-all
                      ${active 
                        ? 'bg-amber-500 text-zinc-950' 
                        : 'text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-50'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-zinc-800">
          <div className="mb-3 p-3 bg-zinc-900 rounded-sm">
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1">Connected to</p>
            <p className="text-sm text-zinc-50 font-mono">{serverConfig?.host}:{serverConfig?.port}</p>
          </div>
          <Button
            onClick={onLogout}
            data-testid="logout-button"
            className="w-full bg-red-900/20 hover:bg-red-900/40 text-red-500 border border-red-900 rounded-sm font-bold uppercase text-xs"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Disconnect
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64">
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

export default Layout;
