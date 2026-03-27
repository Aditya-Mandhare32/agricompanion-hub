import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, ArrowLeft, Search, Loader2, MessageCircle, Plus, Image as ImageIcon, Video, Mic, MicOff, X, Play, Pause } from 'lucide-react';
import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Conversation {
  id: string;
  updated_at: string;
  other_user: { id: string; username: string; avatar_url: string };
  last_message?: { content: string; created_at: string };
  unread_count: number;
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  read: boolean;
}

interface Profile {
  user_id: string;
  username: string;
  avatar_url: string;
}

interface CommunityMessagesProps {
  targetUserId?: string | null;
}

function formatMessageTime(dateStr: string) {
  const date = new Date(dateStr);
  if (isToday(date)) return format(date, 'h:mm a');
  if (isYesterday(date)) return 'Yesterday ' + format(date, 'h:mm a');
  return format(date, 'MMM d, h:mm a');
}

function formatConversationDate(dateStr: string) {
  const date = new Date(dateStr);
  if (isToday(date)) return format(date, 'h:mm a');
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMM d');
}

export function CommunityMessages({ targetUserId }: CommunityMessagesProps) {
  const { user } = useAuth();
  const { language } = useApp();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    fetchConversations();
    if (targetUserId) startConversationWithUser(targetUserId);

    // Real-time conversation updates
    const channel = supabase
      .channel('conversations_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        fetchConversations();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, targetUserId]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
      const channel = supabase
        .channel(`messages_${selectedConversation.id}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${selectedConversation.id}` }, (payload) => {
          const newMsg = payload.new as Message;
          setMessages(prev => {
            if (prev.find(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          scrollToBottom();
          // Mark as read
          if (newMsg.sender_id !== user?.id) {
            supabase.from('messages').update({ read: true }).eq('id', newMsg.id).then(() => {});
          }
        })
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [selectedConversation]);

  useEffect(() => { scrollToBottom(); }, [messages]);

  const scrollToBottom = () => setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);

  const fetchConversations = async () => {
    if (!user) return;
    const { data: participations } = await supabase.from('conversation_participants').select('conversation_id').eq('user_id', user.id);
    if (!participations || participations.length === 0) { setLoading(false); return; }

    const conversationsWithDetails = await Promise.all(
      participations.map(async ({ conversation_id: convId }) => {
        const { data: participants } = await supabase.from('conversation_participants').select('user_id').eq('conversation_id', convId).neq('user_id', user.id);
        if (!participants || participants.length === 0) return null;
        const otherUserId = participants[0].user_id;
        const { data: profile } = await supabase.from('profiles').select('user_id, username, avatar_url').eq('user_id', otherUserId).maybeSingle();
        const { data: lastMessages } = await supabase.from('messages').select('content, created_at').eq('conversation_id', convId).order('created_at', { ascending: false }).limit(1);
        const { count: unreadCount } = await supabase.from('messages').select('*', { count: 'exact', head: true }).eq('conversation_id', convId).neq('sender_id', user.id).eq('read', false);
        const { data: conv } = await supabase.from('conversations').select('updated_at').eq('id', convId).maybeSingle();
        return {
          id: convId,
          updated_at: conv?.updated_at || '',
          other_user: { id: profile?.user_id || otherUserId, username: profile?.username || 'Unknown', avatar_url: profile?.avatar_url || '' },
          last_message: lastMessages?.[0],
          unread_count: unreadCount || 0,
        };
      })
    );
    const valid = conversationsWithDetails.filter((c): c is NonNullable<typeof c> => c !== null) as Conversation[];
    setConversations(valid.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()));
    setLoading(false);
  };

  const fetchMessages = async (conversationId: string) => {
    const { data } = await supabase.from('messages').select('*').eq('conversation_id', conversationId).order('created_at', { ascending: true });
    setMessages(data || []);
    if (user) await supabase.from('messages').update({ read: true }).eq('conversation_id', conversationId).neq('sender_id', user.id);
  };

  const startConversationWithUser = async (otherUserId: string) => {
    if (!user || otherUserId === user.id) return;
    const { data: myConvs } = await supabase.from('conversation_participants').select('conversation_id').eq('user_id', user.id);
    if (myConvs) {
      for (const conv of myConvs) {
        const { data: otherPart } = await supabase.from('conversation_participants').select('user_id').eq('conversation_id', conv.conversation_id).eq('user_id', otherUserId).maybeSingle();
        if (otherPart) {
          const { data: profile } = await supabase.from('profiles').select('user_id, username, avatar_url').eq('user_id', otherUserId).maybeSingle();
          setSelectedConversation({ id: conv.conversation_id, updated_at: new Date().toISOString(), other_user: { id: otherUserId, username: profile?.username || 'Unknown', avatar_url: profile?.avatar_url || '' }, unread_count: 0 });
          return;
        }
      }
    }
    const { data: newConv, error: convError } = await supabase.from('conversations').insert({}).select().single();
    if (convError || !newConv) return;
    await supabase.from('conversation_participants').insert([{ conversation_id: newConv.id, user_id: user.id }, { conversation_id: newConv.id, user_id: otherUserId }]);
    const { data: profile } = await supabase.from('profiles').select('user_id, username, avatar_url').eq('user_id', otherUserId).maybeSingle();
    const newConversation: Conversation = { id: newConv.id, updated_at: newConv.updated_at, other_user: { id: otherUserId, username: profile?.username || 'Unknown', avatar_url: profile?.avatar_url || '' }, unread_count: 0 };
    setConversations(prev => [newConversation, ...prev]);
    setSelectedConversation(newConversation);
    setShowSearch(false);
    setSearchQuery('');
  };

  const uploadMedia = async (file: File): Promise<string | null> => {
    if (!user) return null;
    try {
      const fileExt = file.name.split('.').pop() || 'bin';
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const { error } = await supabase.storage.from('community-images').upload(fileName, file, {
        cacheControl: '3600',
        contentType: file.type,
        upsert: false,
      });
      if (error) { console.error('Upload error:', error); toast.error(`Upload failed: ${error.message}`); return null; }
      const { data } = supabase.storage.from('community-images').getPublicUrl(fileName);
      return data.publicUrl;
    } catch (err) {
      console.error('Upload exception:', err);
      return null;
    }
  };

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    if (!isImage && !isVideo) { toast.error('Please select an image or video'); return; }
    if (file.size > 50 * 1024 * 1024) { toast.error('File must be less than 50MB'); return; }
    setSelectedMedia(file);
    const reader = new FileReader();
    reader.onload = (e) => setMediaPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        const file = new File([audioBlob], `voice_${Date.now()}.webm`, { type: 'audio/webm' });
        setUploading(true);
        const url = await uploadMedia(file);
        if (url && selectedConversation && user) {
          await supabase.from('messages').insert({ conversation_id: selectedConversation.id, sender_id: user.id, content: `🎤 ${url}` });
          await supabase.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', selectedConversation.id);
        }
        setUploading(false);
        setIsRecording(false);
      };
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      toast.error('Microphone access denied');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
  };

  const sendMessage = async () => {
    if (!selectedConversation || !user) return;

    if (selectedMedia) {
      setUploading(true);
      const url = await uploadMedia(selectedMedia);
      if (url) {
        const prefix = selectedMedia.type.startsWith('video/') ? '🎬' : '📷';
        const content = newMessage.trim() ? `${prefix} ${url}\n${newMessage.trim()}` : `${prefix} ${url}`;
        await supabase.from('messages').insert({ conversation_id: selectedConversation.id, sender_id: user.id, content });
        await supabase.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', selectedConversation.id);
      }
      setSelectedMedia(null);
      setMediaPreview(null);
      setNewMessage('');
      setUploading(false);
      return;
    }

    if (!newMessage.trim()) return;
    const { error } = await supabase.from('messages').insert({ conversation_id: selectedConversation.id, sender_id: user.id, content: newMessage.trim() });
    if (!error) {
      setNewMessage('');
      await supabase.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', selectedConversation.id);
    }
  };

  const searchUsers = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) { setSearchResults([]); return; }
    const { data } = await supabase.from('profiles').select('user_id, username, avatar_url').ilike('username', `%${query}%`).neq('user_id', user?.id).limit(10);
    setSearchResults(data || []);
  };

  const toggleAudio = (url: string) => {
    if (playingAudio === url) {
      audioRef.current?.pause();
      setPlayingAudio(null);
    } else {
      if (audioRef.current) audioRef.current.pause();
      const audio = new Audio(url);
      audio.onended = () => setPlayingAudio(null);
      audio.play();
      audioRef.current = audio;
      setPlayingAudio(url);
    }
  };

  const renderMessageContent = (msg: Message) => {
    const content = msg.content;
    const isMine = msg.sender_id === user?.id;

    // Voice message
    if (content.startsWith('🎤 ')) {
      const url = content.slice(2).trim();
      return (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleAudio(url)}>
            {playingAudio === url ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <span className="text-xs">{language === 'hi' ? 'वॉइस संदेश' : language === 'mr' ? 'व्हॉइस संदेश' : 'Voice message'}</span>
        </div>
      );
    }

    // Image/video message
    if (content.startsWith('📷 ') || content.startsWith('🎬 ')) {
      const lines = content.split('\n');
      const urlLine = lines[0].slice(2).trim();
      const caption = lines.slice(1).join('\n');
      const isVideo = content.startsWith('🎬');

      return (
        <div>
          {isVideo ? (
            <video src={urlLine} controls className="max-w-[240px] rounded-lg" />
          ) : (
            <img src={urlLine} alt="Shared" className="max-w-[240px] rounded-lg cursor-pointer" onClick={() => window.open(urlLine, '_blank')} />
          )}
          {caption && <p className="text-sm mt-1">{caption}</p>}
        </div>
      );
    }

    return <p className="text-sm">{content}</p>;
  };

  // Group messages by date
  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return language === 'hi' ? 'आज' : language === 'mr' ? 'आज' : 'Today';
    if (isYesterday(date)) return language === 'hi' ? 'कल' : language === 'mr' ? 'काल' : 'Yesterday';
    return format(date, 'MMMM d, yyyy');
  };

  const messagesWithDateSeparators = () => {
    const result: { type: 'date' | 'message'; content: string; msg?: Message }[] = [];
    let lastDate = '';
    for (const msg of messages) {
      const dateLabel = getDateLabel(msg.created_at);
      if (dateLabel !== lastDate) {
        result.push({ type: 'date', content: dateLabel });
        lastDate = dateLabel;
      }
      result.push({ type: 'message', content: '', msg });
    }
    return result;
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[40vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="h-[calc(100vh-16rem)] md:h-[calc(100vh-12rem)] flex overflow-hidden rounded-lg border bg-card">
      {/* Conversations List */}
      <div className={cn("w-full md:w-80 border-r flex flex-col", selectedConversation ? "hidden md:flex" : "flex")}>
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-lg">
              {language === 'hi' ? 'संदेश' : language === 'mr' ? 'संदेश' : 'Messages'}
            </h2>
            <Button variant="ghost" size="icon" onClick={() => setShowSearch(!showSearch)}><Plus className="h-5 w-5" /></Button>
          </div>
          {showSearch && (
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder={language === 'hi' ? 'किसान खोजें...' : language === 'mr' ? 'शेतकरी शोधा...' : 'Search farmers...'} value={searchQuery} onChange={(e) => searchUsers(e.target.value)} className="pl-9" />
              </div>
              {searchResults.length > 0 && (
                <div className="bg-popover border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {searchResults.map((profile) => (
                    <button key={profile.user_id} className="w-full flex items-center gap-3 p-3 hover:bg-muted transition-colors" onClick={() => startConversationWithUser(profile.user_id)}>
                      <Avatar className="h-8 w-8"><AvatarImage src={profile.avatar_url} /><AvatarFallback>{profile.username[0]?.toUpperCase()}</AvatarFallback></Avatar>
                      <span className="font-medium text-sm">{profile.username}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <ScrollArea className="flex-1">
          {conversations.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>{language === 'hi' ? 'कोई बातचीत नहीं' : language === 'mr' ? 'कोणतेही संभाषण नाही' : 'No conversations yet'}</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <button key={conv.id} className={cn("w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors border-b", selectedConversation?.id === conv.id && "bg-muted")} onClick={() => setSelectedConversation(conv)}>
                <div className="relative">
                  <Avatar><AvatarImage src={conv.other_user.avatar_url} /><AvatarFallback>{conv.other_user.username[0]?.toUpperCase()}</AvatarFallback></Avatar>
                  {conv.unread_count > 0 && <span className="absolute -top-1 -right-1 h-5 w-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">{conv.unread_count}</span>}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex justify-between items-center">
                    <p className="font-medium text-sm truncate">{conv.other_user.username}</p>
                    {conv.last_message && <span className="text-[10px] text-muted-foreground shrink-0 ml-2">{formatConversationDate(conv.last_message.created_at)}</span>}
                  </div>
                  {conv.last_message && (
                    <p className="text-xs text-muted-foreground truncate">
                      {conv.last_message.content.startsWith('🎤') ? '🎤 Voice message' : conv.last_message.content.startsWith('📷') ? '📷 Photo' : conv.last_message.content.startsWith('🎬') ? '🎬 Video' : conv.last_message.content}
                    </p>
                  )}
                </div>
              </button>
            ))
          )}
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className={cn("flex-1 flex flex-col", !selectedConversation && "hidden md:flex")}>
        {selectedConversation ? (
          <>
            <div className="p-4 border-b flex items-center gap-3">
              <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSelectedConversation(null)}><ArrowLeft className="h-5 w-5" /></Button>
              <Avatar><AvatarImage src={selectedConversation.other_user.avatar_url} /><AvatarFallback>{selectedConversation.other_user.username[0]?.toUpperCase()}</AvatarFallback></Avatar>
              <div><p className="font-medium">{selectedConversation.other_user.username}</p><p className="text-xs text-muted-foreground">{language === 'hi' ? 'ऑनलाइन' : language === 'mr' ? 'ऑनलाइन' : 'Active now'}</p></div>
            </div>
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3">
                {messagesWithDateSeparators().map((item, idx) => {
                  if (item.type === 'date') {
                    return (
                      <div key={`date-${idx}`} className="flex justify-center my-4">
                        <span className="text-xs bg-muted px-3 py-1 rounded-full text-muted-foreground">{item.content}</span>
                      </div>
                    );
                  }
                  const msg = item.msg!;
                  const isMine = msg.sender_id === user?.id;
                  return (
                    <div key={msg.id} className={cn("flex", isMine ? "justify-end" : "justify-start")}>
                      <div className={cn("max-w-[75%] rounded-2xl px-4 py-2", isMine ? "bg-primary text-primary-foreground rounded-br-md" : "bg-muted rounded-bl-md")}>
                        {renderMessageContent(msg)}
                        <p className={cn("text-[10px] mt-1", isMine ? "text-primary-foreground/70" : "text-muted-foreground")}>
                          {formatMessageTime(msg.created_at)}
                          {isMine && <span className="ml-1">{msg.read ? '✓✓' : '✓'}</span>}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Media preview */}
            {mediaPreview && (
              <div className="px-4 py-2 border-t bg-muted/30">
                <div className="relative inline-block">
                  {selectedMedia?.type.startsWith('video/') ? (
                    <video src={mediaPreview} className="max-h-24 rounded-lg" />
                  ) : (
                    <img src={mediaPreview} alt="Preview" className="max-h-24 rounded-lg" />
                  )}
                  <Button variant="destructive" size="icon" className="absolute -top-2 -right-2 h-5 w-5 rounded-full" onClick={() => { setSelectedMedia(null); setMediaPreview(null); }}><X className="h-3 w-3" /></Button>
                </div>
              </div>
            )}

            <div className="p-4 border-t">
              {/* Media options popup */}
              <div className="flex gap-2 items-center">
                <input ref={fileInputRef} type="file" accept="image/*,video/*" onChange={handleMediaSelect} className="hidden" />
                <div className="relative">
                  <Button variant="ghost" size="icon" className="shrink-0" onClick={() => {
                    const el = document.getElementById('msg-media-popup');
                    if (el) el.classList.toggle('hidden');
                  }}>
                    <Plus className="h-5 w-5 text-muted-foreground" />
                  </Button>
                  <div id="msg-media-popup" className="hidden absolute bottom-12 left-0 bg-popover border rounded-lg shadow-xl p-2 flex gap-1 z-50">
                    <Button variant="ghost" size="sm" className="flex flex-col items-center gap-1 h-auto py-2 px-3" onClick={() => { fileInputRef.current!.accept = 'image/*'; fileInputRef.current?.click(); document.getElementById('msg-media-popup')?.classList.add('hidden'); }}>
                      <ImageIcon className="h-5 w-5 text-primary" />
                      <span className="text-[10px]">{language === 'hi' ? 'फोटो' : language === 'mr' ? 'फोटो' : 'Photo'}</span>
                    </Button>
                    <Button variant="ghost" size="sm" className="flex flex-col items-center gap-1 h-auto py-2 px-3" onClick={() => { fileInputRef.current!.accept = 'video/*'; fileInputRef.current?.click(); document.getElementById('msg-media-popup')?.classList.add('hidden'); }}>
                      <Video className="h-5 w-5 text-primary" />
                      <span className="text-[10px]">{language === 'hi' ? 'वीडियो' : language === 'mr' ? 'व्हिडिओ' : 'Video'}</span>
                    </Button>
                    <Button variant="ghost" size="sm" className="flex flex-col items-center gap-1 h-auto py-2 px-3" onClick={() => { document.getElementById('msg-media-popup')?.classList.add('hidden'); isRecording ? stopRecording() : startRecording(); }}>
                      <Mic className="h-5 w-5 text-primary" />
                      <span className="text-[10px]">{language === 'hi' ? 'ऑडियो' : language === 'mr' ? 'ऑडिओ' : 'Audio'}</span>
                    </Button>
                  </div>
                </div>
                <Input
                  placeholder={language === 'hi' ? 'संदेश लिखें...' : language === 'mr' ? 'संदेश लिहा...' : 'Type a message...'}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  className="flex-1"
                  disabled={isRecording || uploading}
                />
                <Button onClick={sendMessage} disabled={(!newMessage.trim() && !selectedMedia) || uploading || isRecording} size="icon" className="shrink-0 rounded-full">
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
              {isRecording && (
                <p className="text-xs text-red-500 mt-1 animate-pulse text-center">
                  {language === 'hi' ? '🔴 रिकॉर्डिंग... रोकने के लिए दबाएं' : language === 'mr' ? '🔴 रेकॉर्डिंग... थांबवण्यासाठी दाबा' : '🔴 Recording... tap to stop'}
                  <Button variant="ghost" size="sm" className="ml-2 text-red-500" onClick={stopRecording}>Stop</Button>
                </p>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">{language === 'hi' ? 'बातचीत चुनें' : language === 'mr' ? 'संभाषण निवडा' : 'Select a conversation'}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
