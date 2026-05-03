"use client";

import React, { useState } from 'react';
import Sidebar from '@/app/components/Sidebar';
import { Bell, Search, User } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [appColors] = useState({
    sidebarTop: "#14060a",
    sidebarMiddle: "#a00c1c",
    sidebarBottom: "#060203",
    primaryAccent: "#f05340",
    pageBg: "#0f172a",
    cardBg: "#1e293b"
  });

  return (
    <div className="flex bg-slate-950 min-h-screen text-slate-200">
      <Sidebar appColors={appColors} />
      
      <main className="flex-1 ml-72 p-8 overflow-y-auto">
        <header className="flex items-center justify-between mb-12">
          <div className="relative w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search anything..." 
              className="w-full bg-slate-900/50 border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-white/10 transition-all"
            />
          </div>
          
          <div className="flex items-center gap-6">
            <div className="relative p-3 bg-slate-900 border border-white/5 rounded-2xl cursor-pointer hover:bg-slate-800 transition-colors">
              <Bell className="w-5 h-5 text-slate-400" />
              <div className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-slate-900" />
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs font-bold text-white">Admin User</p>
                <p className="text-[10px] text-slate-500">Super Admin</p>
              </div>
              <div className="p-3 bg-slate-900 border border-white/5 rounded-2xl">
                <User className="w-5 h-5 text-slate-400" />
              </div>
            </div>
          </div>
        </header>
        
        {children}
      </main>
    </div>
  );
}
