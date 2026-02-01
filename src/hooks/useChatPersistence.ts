// Chat persistence hook - stores messages in localStorage and syncs with Supabase
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  confidence?: number;
  metadata?: {
    model?: string;
    orchestration?: any;
    dreamInsights?: string[];
  };
}

const STORAGE_KEY = 'lucid-chat-messages';
const SESSION_KEY = 'lucid-chat-session';

export function useChatPersistence() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const sessionIdRef = useRef<string>('');

  // Get or create session ID
  useEffect(() => {
    const storedSession = localStorage.getItem(SESSION_KEY);
    if (storedSession) {
      sessionIdRef.current = storedSession;
    } else {
      const newSession = crypto.randomUUID();
      localStorage.setItem(SESSION_KEY, newSession);
      sessionIdRef.current = newSession;
    }
  }, []);

  // Load messages on mount
  useEffect(() => {
    loadMessages();
  }, []);

  // Save to localStorage whenever messages change
  useEffect(() => {
    if (messages.length > 0 && !isLoading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages, isLoading]);

  const loadMessages = async () => {
    try {
      setIsLoading(true);
      
      // First try localStorage for immediate display
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMessages(parsed);
          }
        } catch (e) {
          console.error('Failed to parse cached messages:', e);
        }
      }

      // Then try to fetch from Supabase
      const { data: latestMessages } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (latestMessages && latestMessages.length > 0) {
        const formattedMessages: ChatMessage[] = latestMessages.reverse().map(msg => ({
          id: msg.id,
          role: msg.role as any,
          content: msg.content,
          timestamp: msg.created_at,
          metadata: msg.metadata as any
        }));
        setMessages(formattedMessages);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(formattedMessages));
      } else if (!cached) {
        // No messages anywhere, create welcome message
        const welcomeMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'system',
          content: 'LUCID AGI initialized. I have persistent memory and full reasoning capabilities.',
          timestamp: new Date().toISOString(),
          confidence: 1.0
        };
        setMessages([welcomeMessage]);
        await saveMessage(welcomeMessage);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
      // Keep cached messages if available
    } finally {
      setIsLoading(false);
    }
  };

  const saveMessage = async (message: ChatMessage) => {
    try {
      await supabase.from('messages').insert({
        id: message.id,
        role: message.role,
        content: message.content,
        metadata: message.metadata || {},
        message_type: 'persistent_chat'
      });
    } catch (error) {
      console.error('Failed to save message to Supabase:', error);
      // Message is still in localStorage, so user won't lose it
    }
  };

  const addMessage = useCallback(async (message: ChatMessage) => {
    setMessages(prev => [...prev, message]);
    await saveMessage(message);
  }, []);

  const clearMessages = useCallback(async () => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const getSessionId = useCallback(() => sessionIdRef.current, []);

  return {
    messages,
    isLoading,
    addMessage,
    clearMessages,
    getSessionId,
    setMessages
  };
}
