"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  Zap, 
  Sparkles, 
  Target,
  ArrowUpRight,
  MessageSquare,
  Monitor,
  Settings
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/src/lib/supabase';

const appColors = {
  sidebarTop: "#14060a",
  sidebarMiddle: "#a00c1c",
  sidebarBottom: "#060203",
  primaryAccent: "#f05340",
  pageBg: "#0f172a",
  cardBg: "#1e293b"
};

export default function DashboardOverview() {
  const [stats, setStats] = useState([
    { label: 'Total Engagement', val: '48.2k', trend: '+12.5%', icon: TrendingUp, color: 'text-emerald-400' },
    { label: 'Avg. Response Time', val: '2.4m', trend: '-18%', icon: Zap, color: 'text-indigo-400' },
    { label: 'AI Resolution Rate', val: '92%', trend: '+4%', icon: Sparkles, color: 'text-purple-400' },
    { label: 'Comment to Lead', val: '14.8%', trend: '+2.1%', icon: Target, color: 'text-blue-400' },
  ]);

  const [recentEngagement, setRecentEngagement] = useState<any[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      if (!isSupabaseConfigured) return;
      
      // Real-time stats calculation
      const { count: chatCount } = await supabase.from('chats').select('*', { count: 'exact', head: true });
      const { count: msgCount } = await supabase.from('messages').select('*', { count: 'exact', head: true });
      
      setStats([
        { label: 'Total Conversations', val: chatCount ? chatCount.toString() : '0', trend: '+12.5%', icon: MessageSquare, color: 'text-emerald-400' },
        { label: 'Total Messages', val: msgCount ? msgCount.toString() : '0', trend: '+8.2%', icon: TrendingUp, color: 'text-indigo-400' },
        { label: 'AI Resolution Rate', val: '92%', trend: '+4%', icon: Sparkles, color: 'text-purple-400' },
        { label: 'Performance Score', val: '88/100', trend: '+2.1%', icon: Target, color: 'text-blue-400' },
      ]);
    };

    const loadRecentEngagement = async () => {
      if (!isSupabaseConfigured) return;
      const { data } = await supabase
        .from('chats')
        .select('*')
        .order('last_time', { ascending: false })
        .limit(3);
      if (data) setRecentEngagement(data);
    };

    fetchStats();
    loadRecentEngagement();

    if (isSupabaseConfigured) {
      const channel = supabase.channel('dashboard-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'chats' }, () => {
          fetchStats();
          loadRecentEngagement();
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
          fetchStats();
        })
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, []);

  return (
    <div className="space-y-12">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-8 bg-slate-900/40 rounded-[2.5rem] border border-white/5 relative overflow-hidden group shadow-2xl"
          >
             <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{s.label}</span>
                <s.icon className={`w-4 h-4 ${s.color}`} />
             </div>
             <div className="flex items-baseline gap-3">
                <h3 className="text-4xl font-black text-white tracking-tighter">{s.val}</h3>
                <span className={`text-[10px] font-black ${s.trend.startsWith('+') ? 'text-emerald-400' : 'text-rose-400'}`}>{s.trend}</span>
             </div>
             <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none transform translate-x-4 -translate-y-4 group-hover:translate-x-0 group-hover:translate-y-0 transition-all">
                <s.icon className="w-20 h-20" />
             </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-8">
           <div className="rounded-[2.5rem] border border-white/5 p-8 bg-slate-900/40">
              <div className="flex items-center justify-between mb-8">
                <div>
                   <h3 className="text-2xl font-bold text-white tracking-tight">Recent Engagement</h3>
                   <p className="text-xs text-slate-500 mt-1">Real-time activities across all connected platforms</p>
                </div>
                <button className="flex items-center gap-2 text-xs font-bold text-rose-500">
                   View Full Record
                   <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-4">
                 {recentEngagement.length > 0 ? recentEngagement.map((chat) => (
                   <div key={chat.id} className="p-6 bg-slate-950/40 rounded-3xl border border-white/5 flex items-center justify-between hover:border-white/10 transition-colors">
                      <div className="flex items-center gap-5">
                         <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center font-bold text-white border border-white/10">
                            {chat.avatar ? <img src={chat.avatar} alt="" className="w-full h-full rounded-2xl object-cover" /> : (chat.name?.charAt(0) || '?')}
                         </div>
                         <div>
                            <p className="text-sm text-slate-200 font-medium">
                               <span className="font-bold text-white">{chat.name}</span>: {chat.last_msg}
                            </p>
                            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-1">Platform: {chat.platform}</p>
                         </div>
                      </div>
                      <div className="flex items-center gap-4">
                         <span className="text-[10px] font-black px-3 py-1 rounded-lg border border-emerald-400/20 text-emerald-400">
                            ACTIVE
                         </span>
                         <button className="p-3 bg-rose-500/10 text-rose-500 rounded-2xl">
                            <MessageSquare className="w-4 h-4" />
                         </button>
                      </div>
                   </div>
                 )) : (
                   <p className="text-center py-12 text-slate-500">No recent engagement found.</p>
                 )}
              </div>
           </div>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-8">
            <div className="p-8 rounded-[2.5rem] relative overflow-hidden shadow-2xl bg-gradient-to-br from-rose-500 to-rose-700">
               <div className="relative z-10 space-y-6">
                  <div className="p-3 bg-white/10 rounded-2xl w-fit border border-white/20">
                     <Monitor className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-3xl font-black text-white tracking-tight leading-tight">AI Automation Active</h3>
                  <p className="text-sm text-white/80 leading-relaxed">
                     Omni AI is monitoring 12 active streams. Real-time websocket connected.
                  </p>
                  <button className="w-full py-5 bg-white text-rose-600 font-black rounded-2xl shadow-2xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
                     Configure AI Logic
                     <Settings className="w-5 h-5" />
                  </button>
               </div>
               <div className="absolute -bottom-10 -right-10 opacity-10">
                  <Zap className="w-48 h-48 text-white" />
               </div>
            </div>
        </div>
      </div>
    </div>
  );
}
