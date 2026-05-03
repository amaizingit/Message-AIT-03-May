"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'motion/react';
import { 
  Home, 
  MessageSquare, 
  BarChart3, 
  Settings, 
  Users, 
  Zap, 
  LogOut,
  Bell
} from 'lucide-react';

const Sidebar = ({ appColors }: { appColors: any }) => {
  const pathname = usePathname();

  const menuItems = [
    { id: 'dashboard', label: 'Overview', icon: Home, href: '/dashboard' },
    { id: 'inbox', label: 'Unified Inbox', icon: MessageSquare, href: '/dashboard/inbox' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, href: '/dashboard/analytics' },
    { id: 'automation', label: 'Automation', icon: Zap, href: '/dashboard/automation' },
    { id: 'users', label: 'Team', icon: Users, href: '/dashboard/team' },
    { id: 'settings', label: 'Settings', icon: Settings, href: '/dashboard/settings' },
  ];

  return (
    <div 
      className="w-72 h-screen fixed left-0 top-0 z-50 flex flex-col border-r border-white/5"
      style={{ 
        background: `linear-gradient(to bottom, ${appColors.sidebarTop}, ${appColors.sidebarMiddle}, ${appColors.sidebarBottom})` 
      }}
    >
      <div className="p-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/10 border border-white/20">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tighter">OMNI</h1>
            <p className="text-[10px] font-black text-white/40 tracking-[0.3em] uppercase">Matrix</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.id} 
              href={item.href}
              className="block"
            >
              <div 
                className={`flex items-center gap-4 px-6 py-4 rounded-[1.5rem] text-sm font-bold transition-all relative group ${isActive ? 'text-white' : 'text-white/50 hover:text-white/80'}`}
                style={{ 
                  backgroundColor: isActive ? `${appColors.primaryAccent}20` : 'transparent',
                }}
              >
                {isActive && (
                  <motion.div 
                    layoutId="activeNav"
                    className="absolute left-0 w-1 h-8 rounded-r-full"
                    style={{ backgroundColor: appColors.primaryAccent }}
                  />
                )}
                <item.icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? '' : 'opacity-60'}`} 
                  style={{ color: isActive ? appColors.primaryAccent : 'currentColor' }} 
                />
                {item.label}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-6 mt-auto border-t border-white/5">
        <div className="p-4 bg-white/5 rounded-2xl flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-white/10" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate">Admin User</p>
            <p className="text-[10px] text-white/40">Super Admin</p>
          </div>
          <LogOut className="w-4 h-4 text-white/40 hover:text-rose-400 cursor-pointer transition-colors" />
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
