"use client";

import React from 'react';
import { Settings as SettingsIcon, Shield, CreditCard, Bell, Globe } from 'lucide-react';

export default function SettingsPage() {
  const sections = [
    { title: 'General', desc: 'Manage your app name, logo and base colors', icon: Globe },
    { title: 'Security', desc: 'Configure two-factor auth and session limits', icon: Shield },
    { title: 'Billing', desc: 'Manage your subscription and API usage', icon: CreditCard },
    { title: 'Notifications', desc: 'Configure webhook and email alerts', icon: Bell },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tighter">System Configuration</h1>
        <p className="text-slate-500 text-sm mt-1">Control the Omni Matrix behavior and visual identity.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {sections.map((s, i) => (
          <div key={i} className="p-8 bg-slate-900/40 rounded-[2.5rem] border border-white/5 flex items-start gap-6 group hover:border-white/10 transition-all cursor-pointer">
            <div className="p-4 bg-slate-800 rounded-2xl border border-white/5 group-hover:bg-rose-500 transition-colors">
              <s.icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">{s.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed mt-1">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
