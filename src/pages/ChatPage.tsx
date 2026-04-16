import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Send, Paperclip, MoreVertical, Search, Check, CheckCheck } from 'lucide-react';
import { NavLink } from 'react-router-dom';

interface Conversation {
  id: string;
  type: 'direct' | 'class_group' | 'campus_broadcast';
  title: string;
  last_message?: string;
  last_message_time?: string;
  unread_count: number;
  participants: any[];
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: string;
  created_at: string;
  sender_name?: string;
  read_by?: string[];
}

export default function ChatPage({ profile }: { profile: any }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
    const subscription = supabase
      .channel('chat_messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload: any) => {
        if (payload.new.conversation_id === activeConv) {
          setMessages(prev => [...prev, payload.new]);
        }
        fetchConversations(); // refresh conversation list
      })
      .subscribe();
    return () => { supabase.removeChannel(subscription); };
  }, [activeConv]);

  useEffect(() => {
    if (activeConv) fetchMessages(activeConv);
  }, [activeConv]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async () => {
    const { data: parts } = await supabase
      .from('chat_participants')
      .select('conversation_id, conversations(*)')
      .eq('user_id', profile.id);

    if (!parts) return;

    const convos: Conversation[] = [];
    for (const p of parts) {
      const conv = p.conversations;
      if (!conv || !conv.is_active) continue;

      // Get last message
      const { data: lastMsg } = await supabase
        .from('chat_messages')
        .select('content, created_at')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // Get unread count
      const { count } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', conv.id)
        .neq('sender_id', profile.id);

      // Get other participants for direct chats
      const { data: otherParts } = await supabase
        .from('chat_participants')
        .select('user_id, profiles(full_name)')
        .eq('conversation_id', conv.id)
        .neq('user_id', profile.id);

      let title = conv.title || '';
      if (conv.type === 'direct' && otherParts && otherParts.length > 0) {
        title = otherParts[0].profiles?.full_name || 'Unknown';
      }

      convos.push({
        id: conv.id,
        type: conv.type,
        title: title || (conv.type === 'class_group' ? 'Class Group' : 'Announcement'),
        last_message: lastMsg?.content,
        last_message_time: lastMsg?.created_at,
        unread_count: count || 0,
        participants: otherParts || [],
      });
    }
    setConversations(convos.sort((a, b) => (b.last_message_time || '').localeCompare(a.last_message_time || '')));
  };

  const fetchMessages = async (convId: string) => {
    const { data } = await supabase
      .from('chat_messages')
      .select('*, profiles!chat_messages_sender_id_fkey(full_name)')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true })
      .limit(100);
    if (data) {
      setMessages(data.map((m: any) => ({ ...m, sender_name: m.profiles?.full_name })));
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConv) return;
    await supabase.from('chat_messages').insert({
      conversation_id: activeConv,
      sender_id: profile.id,
      content: newMessage.trim(),
      message_type: 'text',
    });
    setNewMessage('');
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) {
      return d.toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString('en-MY', { day: '2-digit', month: '2-digit' });
  };

  const getConvIcon = (type: string) => {
    if (type === 'direct') return '💬';
    if (type === 'class_group') return '👥';
    return '📢';
  };

  const filteredConvs = conversations.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Mobile: show either list or chat
  const showChat = activeConv !== null;

  return (
    <div className="h-[calc(100vh-8rem)] md:h-[calc(100vh-6rem)] flex bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Conversation List */}
      <div className={`${showChat ? 'hidden md:flex' : 'flex'} w-full md:w-80 flex-col border-r`}>
        {/* Header */}
        <div className="bg-emerald-600 text-white px-4 py-3">
          <h2 className="font-bold text-lg">Chats</h2>
          <div className="relative mt-2">
            <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full bg-white/20 rounded-lg pl-9 pr-3 py-2 text-sm placeholder-white/60 outline-none focus:bg-white/30"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConvs.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <p className="text-3xl mb-2">💬</p>
              <p className="text-sm">No conversations yet</p>
              <p className="text-xs mt-1">Chats will appear here when teachers or admins message you</p>
            </div>
          ) : (
            filteredConvs.map(conv => (
              <button
                key={conv.id}
                onClick={() => setActiveConv(conv.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 border-b border-gray-100 text-left ${activeConv === conv.id ? 'bg-emerald-50' : ''}`}
              >
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-xl flex-shrink-0">
                  {getConvIcon(conv.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <span className="font-semibold text-sm truncate">{conv.title}</span>
                    {conv.last_message_time && (
                      <span className="text-xs text-gray-400 ml-2 flex-shrink-0">{formatTime(conv.last_message_time)}</span>
                    )}
                  </div>
                  <div className="flex justify-between items-center mt-0.5">
                    <p className="text-xs text-gray-500 truncate">{conv.last_message || 'No messages yet'}</p>
                    {conv.unread_count > 0 && (
                      <span className="bg-emerald-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center ml-2 flex-shrink-0">
                        {conv.unread_count > 9 ? '9+' : conv.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`${!showChat ? 'hidden md:flex' : 'flex'} flex-1 flex-col`}>
        {!activeConv ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <p className="text-5xl mb-3">💬</p>
              <p className="font-medium">Select a conversation</p>
              <p className="text-sm mt-1">Choose a chat to start messaging</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="bg-emerald-600 text-white px-4 py-3 flex items-center gap-3">
              <button onClick={() => setActiveConv(null)} className="md:hidden">
                <ArrowLeft size={20} />
              </button>
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-lg">
                {getConvIcon(conversations.find(c => c.id === activeConv)?.type || 'direct')}
              </div>
              <div className="flex-1">
                <p className="font-semibold">{conversations.find(c => c.id === activeConv)?.title}</p>
                <p className="text-xs text-emerald-200">
                  {conversations.find(c => c.id === activeConv)?.type === 'direct' ? 'Online' : 
                   conversations.find(c => c.id === activeConv)?.type === 'class_group' ? 'Class Group' : 'Broadcast'}
                </p>
              </div>
              <button className="text-white/70 hover:text-white">
                <MoreVertical size={20} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 bg-gray-50 space-y-2">
              {messages.map((msg, i) => {
                const isMe = msg.sender_id === profile.id;
                const isConsecutive = i > 0 && messages[i-1].sender_id === msg.sender_id;
                const showName = !isMe && !isConsecutive;

                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${!isConsecutive ? 'mt-3' : 'mt-0.5'}`}>
                    <div className={`max-w-[75%] ${isMe ? 'order-2' : ''}`}>
                      {showName && (
                        <p className="text-xs text-emerald-600 font-medium mb-0.5 ml-2">{msg.sender_name}</p>
                      )}
                      <div className={`px-3 py-2 rounded-2xl text-sm ${
                        isMe 
                          ? 'bg-emerald-600 text-white rounded-br-md' 
                          : 'bg-white text-gray-800 rounded-bl-md shadow-sm'
                      }`}>
                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                      </div>
                      <div className={`flex items-center gap-1 mt-0.5 ${isMe ? 'justify-end' : ''}`}>
                        <span className="text-[10px] text-gray-400">{formatTime(msg.created_at)}</span>
                        {isMe && <CheckCheck size={12} className="text-blue-400" />}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="bg-white px-4 py-3 border-t flex items-end gap-2">
              <button className="text-gray-400 hover:text-gray-600 pb-2">
                <Paperclip size={20} />
              </button>
              <div className="flex-1">
                <textarea
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }}}
                  placeholder="Type a message..."
                  rows={1}
                  className="w-full border rounded-2xl px-4 py-2 text-sm resize-none outline-none focus:ring-2 focus:ring-emerald-500 max-h-24"
                  style={{ minHeight: '40px' }}
                />
              </div>
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim()}
                className="bg-emerald-600 text-white p-2.5 rounded-full hover:bg-emerald-700 disabled:opacity-40 flex-shrink-0"
              >
                <Send size={18} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
