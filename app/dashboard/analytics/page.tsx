"use client";

import React from 'react';
import SocialAnalytics from '@/src/components/SocialAnalytics';

const appColors = {
  sidebarTop: "#14060a",
  sidebarMiddle: "#a00c1c",
  sidebarBottom: "#060203",
  primaryAccent: "#f05340",
  pageBg: "#0f172a",
  cardBg: "#1e293b"
};

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tighter">Performance Matrix</h1>
        <p className="text-slate-500 text-sm mt-1">Deep analytics and intelligence across all channels.</p>
      </div>
      <SocialAnalytics appColors={appColors} />
    </div>
  );
}
