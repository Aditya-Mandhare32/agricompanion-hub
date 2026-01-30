import { useState, useEffect, useRef } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Send, 
  ArrowLeft, 
  Search,
  Loader2,
  MessageCircle,
  Plus
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface Conversation {
  id: string;
  updated_at: string;
  other_user: {
    id: string;
    username: string;
    avatar_url: string;
  };
  last_message?: {
    content: string;
    created_at: string;
  };
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

export default function Messages() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const targetUserId = searchParams.get('user');
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchConversations();

    // Handle deep link to start conversation with specific user
    if (targetUserId) {
      startConversationWithUser(targetUserId);
    }
  }, [user, targetUserId]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
      
      // Subscribe to new messages
      const channel = supabase
        .channel(`messages_${selectedConversation.id}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${selectedConversation.id}`
        }, (payload) => {
          setMessages(prev => [...prev, payload.new as Message]);
          scrollToBottom();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    if (!user) return;

    const { data: participations } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', user.id);

    if (!participations || participations.length === 0) {
      setLoading(false);
      return;
    }

    const conversationIds = participations.map(p => p.conversation_id);

    const conversationsWithDetails = await Promise.all(
      conversationIds.map(async (convId) => {
        // Get other participant
        const { data: participants } = await supabase
          .from('conversation_participants')
          .select('user_id')
          .eq('conversation_id', convId)
          .neq('user_id', user.id);

        if (!participants || participants.length === 0) return null;

        const otherUserId = participants[0].user_id;

        // Get other user's profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_id, username, avatar_url')
          .eq('user_id', otherUserId)
          .maybeSingle();

        // Get last message
        const { data: lastMessages } = await supabase
          .from('messages')
          .select('content, created_at')
          .eq('conversation_id', convId)
          .order('created_at', { ascending: false })
          .limit(1);

        // Get unread count
        const { count: unreadCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', convId)
          .neq('sender_id', user.id)
          .eq('read', false);

        // Get conversation details
        const { data: conv } = await supabase
          .from('conversations')
          .select('updated_at')
          .eq('id', convId)
          .maybeSingle();

        return {
          id: convId,
          updated_at: conv?.updated_at || '',
          other_user: {
            id: profile?.user_id || otherUserId,
            username: profile?.username || 'Unknown',
            avatar_url: profile?.avatar_url || '',
          },
          last_message: lastMessages?.[0],
          unread_count: unreadCount || 0,
        };
      })
    );

    const validConversations = conversationsWithDetails.filter(
      (c): c is NonNullable<typeof c> => c !== null && c.other_user !== undefined
    ) as Conversation[];
    
    setConversations(
      validConversations.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    );
    setLoading(false);
  };

  const fetchMessages = async (conversationId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    setMessages(data || []);

    // Mark messages as read
    if (user) {
      await supabase
        .from('messages')
        .update({ read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', user.id);
    }
  };

  const startConversationWithUser = async (otherUserId: string) => {
    if (!user || otherUserId === user.id) return;

    // Check if conversation already exists
    const { data: myConvs } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', user.id);

    if (myConvs) {
      for (const conv of myConvs) {
        const { data: otherPart } = await supabase
          .from('conversation_participants')
          .select('user_id')
          .eq('conversation_id', conv.conversation_id)
          .eq('user_id', otherUserId)
          .maybeSingle();

        if (otherPart) {
          // Conversation exists, select it
          const { data: profile } = await supabase
            .from('profiles')
            .select('user_id, username, avatar_url')
            .eq('user_id', otherUserId)
            .maybeSingle();

          setSelectedConversation({
            id: conv.conversation_id,
            updated_at: new Date().toISOString(),
            other_user: {
              id: otherUserId,
              username: profile?.username || 'Unknown',
              avatar_url: profile?.avatar_url || '',
            },
            unread_count: 0,
          });
          return;
        }
      }
    }

    // Create new conversation
    const { data: newConv, error: convError } = await supabase
      .from('conversations')
      .insert({})
      .select()
      .single();

    if (convError || !newConv) return;

    // Add participants
    await supabase.from('conversation_participants').insert([
      { conversation_id: newConv.id, user_id: user.id },
      { conversation_id: newConv.id, user_id: otherUserId },
    ]);

    const { data: profile } = await supabase
      .from('profiles')
      .select('user_id, username, avatar_url')
      .eq('user_id', otherUserId)
      .maybeSingle();

    const newConversation: Conversation = {
      id: newConv.id,
      updated_at: newConv.updated_at,
      other_user: {
        id: otherUserId,
        username: profile?.username || 'Unknown',
        avatar_url: profile?.avatar_url || '',
      },
      unread_count: 0,
    };

    setConversations(prev => [newConversation, ...prev]);
    setSelectedConversation(newConversation);
    setShowSearch(false);
    setSearchQuery('');
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user) return;

    const { error } = await supabase.from('messages').insert({
      conversation_id: selectedConversation.id,
      sender_id: user.id,
      content: newMessage.trim(),
    });

    if (!error) {
      setNewMessage('');
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', selectedConversation.id);
    }
  };

  const searchUsers = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    const { data } = await supabase
      .from('profiles')
      .select('user_id, username, avatar_url')
      .ilike('username', `%${query}%`)
      .neq('user_id', user?.id)
      .limit(10);

    setSearchResults(data || []);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container max-w-4xl mx-auto h-[calc(100vh-8rem)] md:h-[calc(100vh-4rem)] flex flex-col pb-16 md:pb-0">
        <div className="flex-1 flex overflow-hidden rounded-lg border bg-card">
          {/* Conversations List */}
          <div className={cn(
            "w-full md:w-80 border-r flex flex-col",
            selectedConversation ? "hidden md:flex" : "flex"
          )}>
            <div className="p-4 border-b">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-lg">Messages</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSearch(!showSearch)}
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
              {showSearch && (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => searchUsers(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  {searchResults.length > 0 && (
                    <div className="bg-popover border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {searchResults.map((profile) => (
                        <button
                          key={profile.user_id}
                          className="w-full flex items-center gap-3 p-3 hover:bg-muted transition-colors"
                          onClick={() => startConversationWithUser(profile.user_id)}
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={profile.avatar_url} />
                            <AvatarFallback>{profile.username[0]?.toUpperCase()}</AvatarFallback>
                          </Avatar>
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
                  <p>No conversations yet</p>
                  <p className="text-sm">Start chatting with other farmers!</p>
                </div>
              ) : (
                conversations.map((conv) => (
                  <button
                    key={conv.id}
                    className={cn(
                      "w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors border-b",
                      selectedConversation?.id === conv.id && "bg-muted"
                    )}
                    onClick={() => setSelectedConversation(conv)}
                  >
                    <div className="relative">
                      <Avatar>
                        <AvatarImage src={conv.other_user.avatar_url} />
                        <AvatarFallback>{conv.other_user.username[0]?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                      {conv.unread_count > 0 && (
                        <span className="absolute -top-1 -right-1 h-5 w-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="font-medium text-sm truncate">{conv.other_user.username}</p>
                      {conv.last_message && (
                        <p className="text-xs text-muted-foreground truncate">
                          {conv.last_message.content}
                        </p>
                      )}
                    </div>
                    {conv.last_message && (
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(conv.last_message.created_at), { addSuffix: false })}
                      </span>
                    )}
                  </button>
                ))
              )}
            </ScrollArea>
          </div>

          {/* Chat Area */}
          <div className={cn(
            "flex-1 flex flex-col",
            !selectedConversation && "hidden md:flex"
          )}>
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    onClick={() => setSelectedConversation(null)}
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <Avatar>
                    <AvatarImage src={selectedConversation.other_user.avatar_url} />
                    <AvatarFallback>{selectedConversation.other_user.username[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{selectedConversation.other_user.username}</p>
                    <p className="text-xs text-muted-foreground">Active now</p>
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={cn(
                          "flex",
                          msg.sender_id === user?.id ? "justify-end" : "justify-start"
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[75%] rounded-2xl px-4 py-2",
                            msg.sender_id === user?.id
                              ? "bg-primary text-primary-foreground rounded-br-md"
                              : "bg-muted rounded-bl-md"
                          )}
                        >
                          <p className="text-sm">{msg.content}</p>
                          <p className={cn(
                            "text-[10px] mt-1",
                            msg.sender_id === user?.id ? "text-primary-foreground/70" : "text-muted-foreground"
                          )}>
                            {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Message Input */}
                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      className="flex-1"
                    />
                    <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Select a conversation</p>
                  <p className="text-sm">Or start a new one</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
