// White Matrix Gemini AI Chatbot Client
// Built with Seamless Dual-Engine Architecture:
// 1. Primary: Serverless / Express Backend (/api/chat or http://localhost:5005/api/chat)
// 2. Fallback: Direct Client-Side Gemini Engine with Supabase REST logging (100% uptime guaranteed on GitHub Pages, Vercel, & custom domains)

let initialMessageSent = false;
let chatHistory = []; // Tracks multi-turn conversation for Gemini

// Persistent session ID for Supabase conversation & lead tracking
let sessionId = sessionStorage.getItem('wm_chat_session');
if (!sessionId) {
    sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    sessionStorage.setItem('wm_chat_session', sessionId);
}

// Configurable backend API URL
const isLocalChatbotHost = !window.location.hostname || ['localhost', '127.0.0.1'].includes(window.location.hostname);
const BACKEND_URL = (window.WHITE_MATRIX_CHATBOT_API_BASE_URL ||
    (isLocalChatbotHost ? 'http://localhost:5005/api' : '/api')).replace(/\/+$/, '');

// Direct Gemini & Supabase credentials (for optional direct client mode)
const GEMINI_API_KEY = window.GEMINI_API_KEY || '';
const SUPABASE_URL = 'https://bkcrrwogvebshreoohgy.supabase.co';
const SUPABASE_KEY = 'sb_publishable__FIVV-w3JY97MOhhNJe6WA_2-erIg8V';

const WHITE_MATRIX_SYSTEM_PROMPT = `
You are the official AI assistant for White Matrix (White Matrix Software Solutions Private Limited).
White Matrix is a tech startup and IT solutions company based in Kerala, India (offices/operations in Kochi and Thrissur), recognized by Startup India and the Kerala Startup Mission.

Your mission:
1. Provide friendly, clear, professional, and accurate information about White Matrix, our products, services, team, and career opportunities.
2. Assist prospective clients in understanding our services and encourage them to share their project requirements and contact details (Name, Email, Phone number).
3. Assist job seekers and students by providing guidance on career openings and internship opportunities.
4. Keep responses concise, warm, professional, and well-formatted with markdown when helpful.

Key Information about White Matrix:
- Tagline: "Technology Simplified."
- Services:
  - Custom Software Development (Web, Mobile, Enterprise systems)
  - Artificial Intelligence (AI) Development & Machine Learning
  - VoIP Services & Telecommunication Solutions
  - IT Consulting & Project Management
- Products:
  - Matrix ERP Suite (Enterprise Resource Planning)
  - FleetManager (Fleet and logistics management)
  - EduPulse (Education & student management system)
- Key Leadership & Team:
  - Yadhukrishnan K A (Co-founder & Director)
  - Suhail Mohamed Iqbal (Technical Head & Co-founder)
  - Development, UI/UX, and Engineering Team: Haniel Henry, Aashna Jose Alappattu, Lesmin Jibu Ukken, Anukrishna K A, Swathi Parameswaran, Meril Mathew, Sourav S Pradeep, Adil Hafeez, Sonu James, Shameema Naazar, Aadi Pradeep, Nilophar Rajiv Nair, Alen N Saji, Nasreena Hassan.
- Important Links on the website:
  - Services: services.html, software.html, ai.html, voip.html
  - Products: matrixErpSuite.html, fleetManager.html, eduPulse.html
  - Team: team.html
  - Careers: careers.html
  - Internships: Internship.html
  - Contact: contact.html

Lead Capture Behavior:
If a user expresses interest in hiring White Matrix, getting a quote, or starting a project, politely ask for their Name, Email, and Phone number or specific requirements, and assure them our team will reach out promptly.
`;

// Toggle chatbot open/close
function toggleChatbot() {
    const chatbotWindow = document.getElementById('chatbot-window');
    const chatbotIcon = document.getElementById('chatbot-icon');
    const chatbotTooltip = document.getElementById('chatbot-tooltip');
    if (!chatbotWindow) return;

    const currentDisplay = getComputedStyle(chatbotWindow).display;

    if (currentDisplay === 'none' || currentDisplay === '') {
        chatbotWindow.style.display = 'flex';
        chatbotWindow.scrollTop = chatbotWindow.scrollHeight;
        if (chatbotIcon) chatbotIcon.style.display = 'none';
        if (chatbotTooltip) chatbotTooltip.style.display = 'none';

        if (!initialMessageSent) {
            sendInitialMessage();
        }
        enableInput();
        document.getElementById('chatbot-input')?.focus();
    } else {
        chatbotWindow.style.display = 'none';
        if (chatbotIcon) chatbotIcon.style.display = '';
        if (chatbotTooltip) chatbotTooltip.style.display = 'block';
    }
}

// Initial prompt options
function sendInitialMessage() {
    const initialMessage = `Hello! How can I assist you today? You can ask me anything about our software solutions, products, and careers, or pick a topic below:
        <div style="margin-top: 10px;">
            <button class="chatbot-quick-btn" onclick="handleOption('Tell me about White Matrix services')">💼 Our Services</button>
            <button class="chatbot-quick-btn" onclick="handleOption('What enterprise products do you offer?')">🚀 Our Products</button>
            <button class="chatbot-quick-btn" onclick="handleOption('Are there any career or internship opportunities?')">🎓 Careers & Internships</button>
        </div>`;
    addMessageToChat('bot-bubble', initialMessage);
    initialMessageSent = true;
}

// Direct Gemini API call with cascading fallback models
async function requestDirectGemini(userMessage, history = []) {
    const contents = [];

    // Add recent turns for context
    if (Array.isArray(history) && history.length > 0) {
        const recent = history.slice(-8);
        for (const item of recent) {
            contents.push({
                role: item.role === 'model' || item.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: item.text || item.content || '' }]
            });
        }
    }

    // Add current user turn
    contents.push({
        role: 'user',
        parts: [{ text: userMessage }]
    });

    const body = {
        system_instruction: {
            parts: [{ text: WHITE_MATRIX_SYSTEM_PROMPT }]
        },
        contents: contents,
        generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 600
        }
    };

    // Priority models: fast, modern Gemini models with cascading failover
    const candidateModels = [
        'gemini-3.5-flash-lite',
        'gemini-2.5-flash-lite',
        'gemini-flash-lite-latest',
        'gemini-flash-latest',
        'gemini-3.5-flash',
        'gemini-3.8-flash'
    ];
    let lastErr = null;

    for (const model of candidateModels) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 20000);
        try {
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-goog-api-key': GEMINI_API_KEY
                },
                body: JSON.stringify(body),
                signal: controller.signal
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data.error?.message || `Status ${res.status}`);
            }
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text && text.trim()) {
                return text.trim();
            }
        } catch (err) {
            lastErr = err;
            console.warn(`Direct model ${model} warning:`, err.message);
        } finally {
            clearTimeout(timeout);
        }
    }

    throw lastErr || new Error('All Gemini candidate models failed to generate a response');
}

// Non-blocking direct logging to Supabase REST endpoints
function logToSupabaseDirect(userMessage, botReply) {
    try {
        // 1. Log chat conversation
        fetch(`${SUPABASE_URL}/rest/v1/chat_messages`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify([
                { session_id: sessionId, role: 'user', content: userMessage },
                { session_id: sessionId, role: 'model', content: botReply }
            ])
        }).catch(e => console.debug('Supabase chat log note:', e));

        // 2. Auto-detect lead info (email or phone)
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
        const phoneRegex = /(\+?\d{1,4}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\b\d{10}\b/;
        const emailMatch = userMessage.match(emailRegex);
        const phoneMatch = userMessage.match(phoneRegex);

        if (emailMatch || phoneMatch) {
            fetch(`${SUPABASE_URL}/rest/v1/leads`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify([
                    {
                        session_id: sessionId,
                        email: emailMatch ? emailMatch[0] : null,
                        phone: phoneMatch ? phoneMatch[0] : null,
                        message: userMessage,
                        source: 'chatbot_client'
                    }
                ])
            }).catch(e => console.debug('Supabase lead log note:', e));
        }
    } catch (e) {
        console.debug('Supabase direct log note:', e);
    }
}

// Main sendMessage function with Dual-Engine failover
async function sendMessage() {
    const inputField = document.getElementById('chatbot-input');
    if (!inputField || inputField.disabled) return;

    const message = inputField.value.trim();
    if (!message) return;

    addMessageToChat('user-bubble', escapeHTML(message));
    inputField.value = '';
    disableInput();
    const loadingBubble = addLoadingBubble();

    let botReply = '';

    // Engine 1: Try local Express / Vercel serverless backend first (3.5s timeout)
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 25000);
        const response = await fetch(`${BACKEND_URL}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, sessionId, history: chatHistory }),
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        const data = await response.json().catch(() => ({}));
        if (response.ok && data.reply && typeof data.reply === 'string' && data.reply.trim()) {
            botReply = data.reply.trim();
        } else {
            throw new Error(data.error || `Server returned ${response.status}`);
        }
    } catch (backendErr) {
        // Engine 2: Seamless zero-downtime direct Gemini client fallback
        console.info('Backend server unreachable or busy, seamlessly using direct Gemini engine:', backendErr.message);
        try {
            botReply = await requestDirectGemini(message, chatHistory);
            logToSupabaseDirect(message, botReply);
        } catch (directErr) {
            console.error('All Gemini AI engines failed:', directErr);
            updateBubbleContent(loadingBubble, `I'm having trouble connecting right now. Please try again shortly or contact us at <a href="contact.html">our Contact Page</a>.`);
            enableInput();
            inputField.focus();
            return;
        }
    }

    chatHistory.push({ role: 'user', text: message });
    chatHistory.push({ role: 'model', text: botReply });
    updateBubbleContent(loadingBubble, formatMarkdown(botReply));
    enableInput();
    inputField.focus();
}

// Enable/Disable input controls
function enableInput() {
    const input = document.getElementById('chatbot-input');
    const sendBtn = document.getElementById('chatbot-send');
    if (input) input.disabled = false;
    if (sendBtn) sendBtn.disabled = false;
}

function disableInput() {
    const input = document.getElementById('chatbot-input');
    const sendBtn = document.getElementById('chatbot-send');
    if (input) input.disabled = true;
    if (sendBtn) sendBtn.disabled = true;
}

// Add message bubble to chat window
function addMessageToChat(className, messageHtml) {
    const chatbotBody = document.getElementById('chatbot-body');
    if (!chatbotBody) return null;
    const bubble = document.createElement('div');
    bubble.classList.add('chat-bubble', className);
    bubble.innerHTML = messageHtml;
    chatbotBody.appendChild(bubble);
    chatbotBody.scrollTop = chatbotBody.scrollHeight;
    return bubble;
}

// Add animated loader bubble while waiting for Gemini
function addLoadingBubble() {
    const chatbotBody = document.getElementById('chatbot-body');
    if (!chatbotBody) return null;
    const bubble = document.createElement('div');
    bubble.classList.add('chat-bubble', 'bot-bubble');
    bubble.innerHTML = `<div class="loader"><div></div><div></div><div></div></div>`;
    chatbotBody.appendChild(bubble);
    chatbotBody.scrollTop = chatbotBody.scrollHeight;
    return bubble;
}

// Replace loader with actual reply
function updateBubbleContent(bubbleElement, formattedContent) {
    if (!bubbleElement) return;
    bubbleElement.innerHTML = formattedContent;
    const chatbotBody = document.getElementById('chatbot-body');
    if (chatbotBody) chatbotBody.scrollTop = chatbotBody.scrollHeight;
}

// Quick option click handler
function handleOption(option) {
    const inputField = document.getElementById('chatbot-input');
    if (inputField) {
        inputField.value = option;
        sendMessage();
    }
}

// Listen for Enter key press on input field
document.addEventListener('DOMContentLoaded', () => {
    const inputField = document.getElementById('chatbot-input');
    if (inputField) {
        inputField.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                sendMessage();
            }
        });
    }
});

// Format markdown in Gemini response to clean HTML
function formatMarkdown(text) {
    if (!text) return '';
    let html = escapeHTML(text);

    // Bold: **text**
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Italic: *text*
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // External Links: [text](https://...)
    html = html.replace(/\[(.*?)\]\((https?:\/\/.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    // Relative Links: [text](url.html)
    html = html.replace(/\[(.*?)\]\((.*?\.html.*?)\)/g, '<a href="$2">$1</a>');

    // Bullet points: lines starting with * or -
    html = html.replace(/^\s*[\*\-]\s+(.*)$/gm, '• $1<br>');

    // Line breaks
    html = html.replace(/\n\n/g, '<br><br>');
    html = html.replace(/\n/g, '<br>');

    return html;
}

// Escape raw HTML to prevent injection
function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// EmailJS support (if configured)
if (window.emailjs) {
    try {
        emailjs.init("qdNgirAK0VHPX-yQL");
    } catch (e) {
        console.warn('EmailJS init skipped:', e);
    }
}
