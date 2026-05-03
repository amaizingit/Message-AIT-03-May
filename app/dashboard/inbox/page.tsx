"use client";

import React, { useState, useEffect } from 'react';
import UnifiedInbox from '@/src/components/UnifiedInbox';
import { supabase } from '@/src/lib/supabase';

const appColors = {
  sidebarTop: "#14060a",
  sidebarMiddle: "#a00c1c",
  sidebarBottom: "#060203",
  primaryAccent: "#f05340",
  pageBg: "#0f172a",
  cardBg: "#1e293b"
};

export default function InboxPage() {
  const [comments, setComments] = useState<any[]>([]);

  useEffect(() => {
    // 1. Initial Load
    const fetchChats = async () => {
      const { data } = await supabase
        .from('chats')
        .select('*')
        .order('last_time', { ascending: false });
      
      if (data) {
        // Map to Comment interface
        const mapped = data.map(chat => ({
          id: chat.id.toString(),
          postId: chat.id.toString(),
          platform: chat.platform,
          userName: chat.name,
          userAvatar: chat.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${chat.name}`,
          message: chat.last_msg || '',
          timestamp: chat.last_time,
          status: chat.unread > 0 ? 'unreplied' : 'replied',
          sentiment: 'neutral',
          intent: 'question',
          priority: 'medium'
        }));
        setComments(mapped);
      }
    };

    fetchChats();

    // 2. Real-time Subscription
    const channel = supabase.channel('inbox-realtime')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'chats' }, 
        () => {
          fetchChats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="h-[calc(100vh-200px)]">
      <div className="mb-6">
        <h1 className="text-3xl font-black text-white tracking-tighter">Unified Inbox</h1>
        <p className="text-slate-500 text-sm mt-1">Manage communications from all platforms in real-time.</p>
      </div>
      <UnifiedInbox 
        appColors={appColors} 
        comments={comments} 
        onReply={(id, text) => console.log('Reply to', id, ':', text)}
        onAssign={(id, agent) => console.log('Assign', id, 'to', agent)}
      />
    </div>
  );
}
