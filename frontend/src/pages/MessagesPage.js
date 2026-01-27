import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Send, ArrowLeft, Search, User, MoreVertical, Phone, Video } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ScrollArea } from '../components/ui/scroll-area';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { toast } from 'sonner';
import { io } from 'socket.io-client';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function MessagesPage() {
  const navigate = useNavigate();
  const { conversationId } = useParams();
  const { user, isAuthenticated } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/messages' } });
      return;
    }

    fetchConversations();
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (conversationId) {
      fetchMessages(conversationId);
    }
  }, [conversationId]);

  useEffect(() => {
    // Initialize Socket.IO
    socketRef.current = io(BACKEND_URL, { path: '/api/socket.io' });

    socketRef.current.on('connect', () => {
      console.log('Connected to chat');
      if (conversationId) {
        socketRef.current.emit('join_room', { room_id: conversationId });
      }
    });

    socketRef.current.on('new_message', (message) => {
      setMessages(prev => [...prev, message]);
    });

    return () => {
      if (socketRef.current?.connected) {
        socketRef.current.disconnect();
      }
    };
  }, [conversationId]);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const response = await api.getConversations();
      setConversations(response.data.conversations || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (convId) => {
    try {
      const response = await api.getMessages(convId);
      setMessages(response.data.messages || []);
      setCurrentConversation(response.data.conversation);
      
      // Join room
      if (socketRef.current?.connected) {
        socketRef.current.emit('join_room', { room_id: convId });
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !conversationId) return;

    try {
      await api.sendMessage({
        conversation_id: conversationId,
        content: newMessage.trim()
      });
      setNewMessage('');
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true;
    const otherName = conv.other_user?.name || '';
    return otherName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <div className="container-app py-4">
        <div className="card-base overflow-hidden" style={{ height: 'calc(100vh - 120px)' }}>
          <div className="flex h-full">
            {/* Conversations List */}
            <div className={`w-full md:w-80 border-r border-slate-100 flex flex-col ${conversationId ? 'hidden md:flex' : 'flex'}`}>
              <div className="p-4 border-b border-slate-100">
                <h2 className="text-lg font-semibold text-[#0F172A] mb-4">Messages</h2>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
                  <Input
                    data-testid="search-conversations"
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <ScrollArea className="flex-1">
                {loading ? (
                  <div className="p-4 text-center text-[#64748B]">Loading...</div>
                ) : filteredConversations.length === 0 ? (
                  <div className="p-8 text-center">
                    <User className="h-12 w-12 mx-auto text-[#94A3B8] mb-4" />
                    <p className="text-[#64748B]">No conversations yet</p>
                    <p className="text-sm text-[#94A3B8] mt-1">
                      Start a conversation by contacting a helper
                    </p>
                  </div>
                ) : (
                  filteredConversations.map((conv) => (
                    <div
                      key={conv.conversation_id}
                      data-testid={`conversation-${conv.conversation_id}`}
                      onClick={() => navigate(`/messages/${conv.conversation_id}`)}
                      className={`p-4 border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors ${
                        conversationId === conv.conversation_id ? 'bg-[#0052CC]/5' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden">
                          {conv.other_user?.picture ? (
                            <img
                              src={conv.other_user.picture}
                              alt={conv.other_user.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="h-6 w-6 text-[#94A3B8]" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-[#0F172A] truncate">
                            {conv.other_user?.name || 'Unknown'}
                          </p>
                          <p className="text-sm text-[#64748B] truncate">
                            {conv.last_message?.content || 'No messages yet'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </ScrollArea>
            </div>

            {/* Chat Area */}
            {conversationId ? (
              <div className="flex-1 flex flex-col">
                {/* Chat Header */}
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="md:hidden"
                      onClick={() => navigate('/messages')}
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden">
                      {currentConversation?.other_user?.picture ? (
                        <img
                          src={currentConversation.other_user.picture}
                          alt={currentConversation.other_user.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="h-5 w-5 text-[#94A3B8]" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-[#0F172A]">
                        {currentConversation?.other_user?.name || 'Chat'}
                      </p>
                      <p className="text-xs text-[#10B981]">Online</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon">
                      <Phone className="h-5 w-5 text-[#64748B]" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Video className="h-5 w-5 text-[#64748B]" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-5 w-5 text-[#64748B]" />
                    </Button>
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.message_id}
                        className={`flex ${message.sender_id === user?.user_id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] p-3 rounded-2xl ${
                            message.sender_id === user?.user_id
                              ? 'bg-[#0052CC] text-white rounded-br-md'
                              : 'bg-slate-100 text-[#0F172A] rounded-bl-md'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p className={`text-xs mt-1 ${
                            message.sender_id === user?.user_id ? 'text-blue-200' : 'text-[#94A3B8]'
                          }`}>
                            {new Date(message.created_at).toLocaleTimeString('en-GB', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Message Input */}
                <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100">
                  <div className="flex items-center gap-3">
                    <Input
                      data-testid="message-input"
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      type="submit"
                      size="icon"
                      className="bg-[#0052CC] hover:bg-[#0043A6] rounded-full"
                      data-testid="send-message"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="hidden md:flex flex-1 items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto rounded-full bg-slate-100 flex items-center justify-center mb-4">
                    <User className="h-8 w-8 text-[#94A3B8]" />
                  </div>
                  <p className="text-[#64748B]">Select a conversation to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
