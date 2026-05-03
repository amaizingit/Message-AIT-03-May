"use client";

import React from 'react';
import AutomationSettings from '@/src/components/AutomationSettings';

const appColors = {
  sidebarTop: "#14060a",
  sidebarMiddle: "#a00c1c",
  sidebarBottom: "#060203",
  primaryAccent: "#f05340",
  pageBg: "#0f172a",
  cardBg: "#1e293b"
};

export default function AutomationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tighter">AI Automation</h1>
        <p className="text-slate-500 text-sm mt-1">Configure intelligent auto-replies and routing logic.</p>
      </div>
      <div className="bg-slate-900/40 rounded-[2.5rem] border border-white/5 overflow-hidden">
        <AutomationSettings appColors={appColors} onClose={() => {}} isModal={false} />
      </div>
    </div>
  );
}
