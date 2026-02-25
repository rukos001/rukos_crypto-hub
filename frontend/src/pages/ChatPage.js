import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ScrollArea } from '../components/ui/scroll-area';
import { toast } from 'sonner';
import { Send, MessageCircle } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const ChatPage = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const response = await axios.get(`${API}/chat`);
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await axios.post(`${API}/chat`, { content: newMessage });
      setNewMessage('');
      fetchMessages();
    } catch (error) {
      toast.error('Ошибка отправки сообщения');
    }
  };

  const formatTime = (dateStr) => {
    return new Date(dateStr).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="h-[calc(100vh-180px)] animate-fade-in" data-testid="chat-page">
      <Card className="glass-card h-full flex flex-col">
        <CardHeader className="border-b border-white/5 pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-[#F7931A]" />
            Общий чат
            <span className="text-sm font-normal text-muted-foreground ml-2">
              {messages.length} сообщений
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-secondary/50 rounded w-24 mb-2" />
                    <div className="h-10 bg-secondary/50 rounded w-3/4" />
                  </div>
                ))}
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Начните общение!</p>
              </div>
            ) : (
              <div className="space-y-4 flex flex-col-reverse">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.author_id === user?.id ? 'items-end' : 'items-start'}`}
                    data-testid={`chat-message-${msg.id}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-medium ${
                        msg.author_id === user?.id ? 'text-[#F7931A]' : 'text-muted-foreground'
                      }`}>
                        {msg.author_username}
                      </span>
                      <span className="text-xs text-muted-foreground/50">
                        {formatTime(msg.created_at)}
                      </span>
                    </div>
                    <div className={`max-w-[80%] p-3 rounded-2xl ${
                      msg.author_id === user?.id 
                        ? 'bg-[#F7931A]/20 text-white rounded-br-sm' 
                        : 'bg-secondary/50 text-muted-foreground rounded-bl-sm'
                    }`}>
                      <p className="text-sm">{msg.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
          
          <form onSubmit={handleSend} className="p-4 border-t border-white/5">
            <div className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Введите сообщение..."
                className="bg-secondary/50 border-white/10 flex-1"
                data-testid="chat-input"
              />
              <Button 
                type="submit" 
                className="bg-[#F7931A] hover:bg-[#FFAC40] text-black"
                disabled={!newMessage.trim()}
                data-testid="chat-send-btn"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
