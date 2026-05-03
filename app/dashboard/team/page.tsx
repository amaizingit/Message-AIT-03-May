"use client";

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Shield, UserPlus, Trash2, CheckCircle2 } from 'lucide-react';

export default function TeamPage() {
  const [team, setTeam] = useState([
    { id: 1, name: "Admin", email: "admin@example.com", role: "Administrator", status: "Active", joined: "Apr 18, 2026" },
    { id: 2, name: "Agent Smith", email: "smith@example.com", role: "Support Agent", status: "Active", joined: "Apr 20, 2026" },
    { id: 3, name: "Anika", email: "anika@test.com", role: "Sales Executive", status: "Away", joined: "Apr 22, 2026" },
  ]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tighter">Team Matrix</h1>
          <p className="text-slate-500 text-sm mt-1">Manage employee roles and core platform permissions.</p>
        </div>
        <button className="px-6 py-3 bg-rose-500 text-white rounded-2xl font-bold flex items-center gap-2 shadow-xl hover:shadow-rose-500/20 transition-all">
          <UserPlus className="w-5 h-5" />
          Add Member
        </button>
      </div>

      <div className="bg-slate-900/40 rounded-[2.5rem] border border-white/5 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/5 bg-slate-950/20">
              <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Member</th>
              <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Role</th>
              <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Status</th>
              <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Joined Date</th>
              <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {team.map((m, i) => (
              <motion.tr 
                key={m.id} 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group hover:bg-white/5 transition-colors"
              >
                <td className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center font-bold text-white">
                      {m.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white tracking-tight">{m.name}</p>
                      <p className="text-xs text-slate-500 font-medium">{m.email}</p>
                    </div>
                  </div>
                </td>
                <td className="p-6">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                    <Shield className="w-3.5 h-3.5 text-rose-400" />
                    {m.role}
                  </div>
                </td>
                <td className="p-6">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${m.status === 'Active' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-700'}`} />
                    <span className="text-xs font-bold text-slate-200">{m.status}</span>
                  </div>
                </td>
                <td className="p-6 text-xs text-slate-400 font-mono italic">
                  {m.joined}
                </td>
                <td className="p-6">
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 transition-all">
                      <Mail className="w-4 h-4" />
                    </button>
                    <button className="p-2.5 bg-rose-500/10 hover:bg-rose-500/20 rounded-xl text-rose-500 transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
