import { useState, useRef } from 'react';
import axios from 'axios';
import initialLayout from '../data/initialLayout.json';

const API_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL + '/api/chat'
  : window.location.origin.includes('localhost')
    ? 'http://localhost:3001/api/chat'
    : '/api/chat';

export function useLayoutAgent() {
  const [layout, setLayout] = useState(initialLayout);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: '👋 Hi! I\'m your Layout Agent. Try instructions like:\n• "Convert to 9:16"\n• "Move the headline to the top"\n• "Make the discount badge bigger"\n• "Change the badge color to red"',
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastActions, setLastActions] = useState([]);
  const historyRef = useRef([]);

  const lastRequestRef = useRef(0);

  const sendMessage = async (text) => {
    const now = Date.now();
    const gap = now - lastRequestRef.current;
    if (gap < 4000) await new Promise((r) => setTimeout(r, 4000 - gap));
    lastRequestRef.current = Date.now();

    const userMsg = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    setError(null);

    try {
      const { data } = await axios.post(API_URL, {
        message: text,
        layout,
        history: historyRef.current.slice(-6),
      });

      const assistantMsg = { role: 'assistant', content: data.assistantMessage };
      setMessages((prev) => [...prev, assistantMsg]);
      setLayout(data.updatedLayout);
      setLastActions(data.actions || []);

      // Update conversation history for follow-up context
      historyRef.current = [
        ...historyRef.current,
        { role: 'user', content: text },
        { role: 'assistant', content: data.assistantMessage },
      ];
    } catch (err) {
      const errMsg =
        err.response?.data?.detail ||
        err.response?.data?.error ||
        'Something went wrong. Please check the server and try again.';
      setError(errMsg);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `❌ ${errMsg}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const resetLayout = () => {
    setLayout(initialLayout);
    historyRef.current = [];
    setLastActions([]);
    setMessages([
      {
        role: 'assistant',
        content: '✅ Layout reset to original. What would you like to change?',
      },
    ]);
  };

  return { layout, messages, loading, error, lastActions, sendMessage, resetLayout };
}
