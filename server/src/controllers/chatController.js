import { generateGeminiReply } from '../services/geminiService.js';
import { supabase } from '../config/supabase.js';

// Regex to detect email or phone numbers in messages to auto-capture leads
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const PHONE_REGEX = /(\+?\d{1,4}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\b\d{10}\b/;

export async function handleChatMessage(req, res) {
  try {
    const { message, sessionId = 'default-session', history = [], pageId = 'general' } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required and must be a string' });
    }

    // 1. Generate reply from Gemini AI
    const reply = await generateGeminiReply(message, history, pageId);

    // 2. Asynchronously log to Supabase (if Supabase is configured)
    if (supabase) {
      try {
        // Log conversation
        const { error: chatLogError } = await supabase.from('chat_messages').insert([
          { session_id: sessionId, role: 'user', content: message },
          { session_id: sessionId, role: 'model', content: reply }
        ]);
        if (chatLogError) throw chatLogError;

        // Auto-detect lead info (email or phone)
        const emailMatch = message.match(EMAIL_REGEX);
        const phoneMatch = message.match(PHONE_REGEX);

        if (emailMatch || phoneMatch) {
          const { error: leadError } = await supabase.from('leads').insert([
            {
              session_id: sessionId,
              email: emailMatch ? emailMatch[0] : null,
              phone: phoneMatch ? phoneMatch[0] : null,
              message: message,
              source: 'chatbot'
            }
          ]);
          if (leadError) throw leadError;
          console.log('📌 Captured lead in Supabase:', emailMatch?.[0] || phoneMatch?.[0]);
        }
      } catch (dbError) {
        // Non-blocking log error
        console.warn('⚠️ Supabase logging warning:', dbError.message);
      }
    }

    return res.json({
      reply,
      sessionId
    });
  } catch (error) {
    console.error('Chat controller error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to process chat message'
    });
  }
}

export async function handleSaveLead(req, res) {
  try {
    const { name, email, phone, service, message, sessionId } = req.body;

    if (!email && !phone && !message) {
      return res.status(400).json({ error: 'At least an email, phone, or message is required' });
    }

    if (supabase) {
      const { error } = await supabase.from('leads').insert([
        {
          name: name || null,
          email: email || null,
          phone: phone || null,
          service: service || null,
          message: message || null,
          session_id: sessionId || null,
          source: 'form'
        }
      ]).select();

      if (error) {
        throw error;
      }

      return res.status(201).json({ success: true });
    } else {
      console.warn('⚠️ Lead received, but Supabase is not configured yet:', { name, email, phone, service });
      return res.json({
        success: true,
        note: 'Lead received (configure Supabase in .env to persist permanently)'
      });
    }
  } catch (error) {
    console.error('Save lead error:', error);
    return res.status(500).json({ error: error.message || 'Failed to save lead' });
  }
}

export function handleHealth(req, res) {
  const rawKey = (process.env.GEMINI_API_KEY || '').trim().replace(/^["']|["']$/g, '');
  const supabaseUrl = (process.env.SUPABASE_URL || '').trim();
  const supabaseKey = (process.env.SUPABASE_ANON_KEY || '').trim();
  const geminiConfigured = Boolean(rawKey && rawKey !== 'your_gemini_api_key_here');
  const supabaseConfigured = Boolean(
    supabaseUrl &&
    supabaseKey &&
    supabaseUrl !== 'https://your-project-id.supabase.co' &&
    supabaseKey !== 'your_supabase_anon_key_here'
  );

  return res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    geminiConfigured,
    geminiKeyPrefix: geminiConfigured ? `${rawKey.substring(0, 6)}...` : null,
    geminiKeyLength: geminiConfigured ? rawKey.length : 0,
    geminiModel: process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite (default)',
    supabaseConfigured,
    isVercel: Boolean(process.env.VERCEL)
  });
}

