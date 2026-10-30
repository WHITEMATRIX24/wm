// White Matrix Gemini AI Chatbot Client
// Built with Seamless Dual-Engine Architecture:
// 1. Primary: Serverless / Express Backend (/api/chat or http://localhost:5005/api/chat)
// 2. Fallback: Direct Client-Side Gemini Engine with Supabase REST logging (100% uptime guaranteed on GitHub Pages, Vercel, & custom domains)

function ensureChatbotWidget() {
    if (document.getElementById('chatbot-container') || !document.body) return;

    const widget = document.createElement('div');
    widget.id = 'chatbot-container';
    widget.innerHTML = `
        <div id="chatbot-welcome" role="status" aria-live="polite">
            <span>Welcome to White Matrix</span>
            <button type="button" onclick="dismissChatbotWelcome()" aria-label="Dismiss welcome message">&times;</button>
        </div>
        <button id="chatbot-icon" type="button" onclick="toggleChatbot()" aria-label="Open M'Bot chat" aria-controls="chatbot-window" aria-expanded="false">
            <span class="chatbot-launcher-mark"><img src="./img/chatbot.svg" alt="" /></span>
        </button>
        <div id="chatbot-window" role="dialog" aria-label="Chat with M'Bot" aria-hidden="true" tabindex="-1">
            <div id="chatbot-header">
                <div class="chatbot-header-identity">
                    <span class="chatbot-avatar"><img src="./img/chatbot.svg" alt="" /></span>
                    <span class="chatbot-header-copy"><strong>M'Bot</strong><span>White Matrix AI assistant</span></span>
                </div>
                <div class="chatbot-header-tools">
                    <span class="chatbot-online"><i aria-hidden="true"></i>AI</span>
                    <button type="button" onclick="toggleChatbot()" aria-label="Close chat">
                        <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5 5 10 10M15 5 5 15" /></svg>
                    </button>
                </div>
            </div>
            <div id="chatbot-body" role="log" aria-live="polite" aria-relevant="additions text" aria-label="Chat messages"></div>
            <div id="chatbot-input-area">
                <input type="text" id="chatbot-input" aria-label="Message M'Bot" placeholder="Ask about this page" autocomplete="off" />
                <button id="chatbot-send" type="button" onclick="sendMessage()" aria-label="Send message">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 12h14M12 5.5 18.5 12 12 18.5" /></svg>
                </button>
            </div>
            <div class="chatbot-composer-note"><span>White Matrix AI</span><span>Enter to send</span></div>
        </div>`;

    document.body.appendChild(widget);
}

ensureChatbotWidget();

let initialMessageSent = false;
let chatHistory = []; // Tracks multi-turn conversation for Gemini
let activeChatbotPageId = null;

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

Accuracy rules:
- Treat the company information in this prompt as the source of truth. Do not replace it with general knowledge or guesses.
- For questions about people, teams, titles, or reporting roles, use only the exact name-to-role groupings listed below. Never move someone into another team or infer a title.
- If a name or role is missing, be honest in plain, natural language (for example, "I don't have that detail handy yet."). Never invent a plausible answer.
- When listing a team, include only the people explicitly listed under that team. Keep team lists separate and preserve name spelling.
- If the visitor asks broadly who is on the team, give a short, natural overview of the listed groups. Mention groups without names only when relevant to the question.
- Do not claim to have live access to an employee directory or current hiring status.

Voice and conversation:
- Sound like a friendly, knowledgeable White Matrix teammate having a real conversation, not a textbook, policy, or company brochure.
- Answer the question directly in everyday language. Use contractions naturally and vary sentence openings so replies do not feel copied from a template.
- Keep simple answers to one or two sentences. Use bullets only when the visitor asks for a list or the details are easier to scan that way.
- Never mention internal sources or how the facts were supplied. Avoid phrases such as "Based on the verified information", "Based on what I have", "According to the information available", or "The information provided says". State known facts plainly.
- When a detail is missing, say so briefly and conversationally. Don't make the answer sound like a disclaimer.
- Don't add a generic "feel free to ask" or repeat an offer to help at the end of every reply. Ask a follow-up only when it naturally moves the conversation forward.
- Be warm and lively without forcing jokes, exclamation marks, or emojis.

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
  - Lead AI Full Stack Developer: Haniel Henry, Aashna Jose Alappattu, Lesmin Jibu Ukken
  - Project Delivery Manager : Swathi Parmeswaran
  - AI Interns: Sourav S Pradeep , Swathi Parmeswaran
  - Associate Flutter Developers: Avany P U, Sadiya Aboobacker
  - Tech Ascent Interns: 
  - UI/UX Team: Adil Hafeez (Lead), Sonu James, Shameema Naazar, Aadi Pradeep, Nilophar Rajiv Nair.
  - Business Development Team: Alen N Saji
  - Business Analysts: Meril Mathew, Nasreena Hassan
  - Human Resources: Anukrishna K A , Swathi Parmeswaran
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

const CHATBOT_PAGE_CONTEXTS = {
    home: {
        title: 'White Matrix',
        summary: 'The homepage introduces White Matrix services, products, company story, and ways to start a project.',
        welcome: 'Welcome to White Matrix.',
        prompts: [
            { label: 'Explore our services', question: 'What services does White Matrix offer?' },
            { label: 'Find the right product', question: 'Which White Matrix product could fit my business?' },
            { label: 'Start a project', question: 'How can I start a project with White Matrix?' },
        ],
    },
    services: {
        title: 'White Matrix services',
        summary: 'This page covers custom software development, artificial intelligence, VoIP and telecommunications, and project consulting.',
        welcome: 'Looking for the right service?',
        prompts: [
            { label: 'Custom software', question: 'How do you scope a custom software project?' },
            { label: 'AI and machine learning', question: 'What AI and machine learning services do you provide?' },
            { label: 'VoIP solutions', question: 'Tell me about White Matrix VoIP solutions.' },
        ],
    },
    software: {
        title: 'Custom software development',
        summary: 'This page describes tailored web, mobile, and enterprise software development for business workflows.',
        welcome: 'Planning custom software?',
        prompts: [
            { label: 'Web and mobile apps', question: 'Can you help scope a web or mobile application?' },
            { label: 'Enterprise software', question: 'How do you build software around an existing workflow?' },
            { label: 'Project process', question: 'What happens during a custom software project?' },
        ],
    },
    application: {
        title: 'Application development',
        summary: 'This page covers custom application development for web and mobile use cases.',
        welcome: 'Exploring an application idea?',
        prompts: [
            { label: 'Mobile application', question: 'How do we plan a mobile application project?' },
            { label: 'Web application', question: 'What information do you need to scope a web app?' },
            { label: 'Talk to the team', question: 'How can I discuss my application requirements?' },
        ],
    },
    ai: {
        title: 'Artificial intelligence and G Matrix',
        summary: 'This page introduces White Matrix AI and machine learning work, including G Matrix and generative AI use cases.',
        welcome: 'Exploring AI for your business?',
        prompts: [
            { label: 'G Matrix', question: 'What can G Matrix help me create?' },
            { label: 'AI use cases', question: 'Where could AI help in my business workflow?' },
            { label: 'Plan an AI project', question: 'How do I scope an AI project with White Matrix?' },
        ],
    },
    voip: {
        title: 'VoIP and communication solutions',
        summary: 'This page covers White Matrix VoIP, telephony, and call-centre solutions.',
        welcome: 'Looking to improve business communications?',
        prompts: [
            { label: 'Cloud telephony', question: 'What business telephony options do you offer?' },
            { label: 'Call-centre solutions', question: 'How can White Matrix support a call centre?' },
            { label: 'Plan a rollout', question: 'What is involved in a VoIP rollout?' },
        ],
    },
    matrixerpsuite: {
        title: 'Matrix ERP Suite',
        summary: 'This page describes Matrix ERP Suite, a configurable ERP platform for connected business workflows.',
        welcome: 'Exploring Matrix ERP Suite?',
        prompts: [
            { label: 'ERP workflows', question: 'What workflows can Matrix ERP Suite manage?' },
            { label: 'Fit my business', question: 'How can Matrix ERP fit our existing processes?' },
            { label: 'Request a conversation', question: 'How can I discuss an ERP demo or requirements?' },
        ],
    },
    fleetmanager: {
        title: 'FleetManager',
        summary: 'This page describes FleetManager for fleet and logistics operations, including trips, maintenance, and reporting.',
        welcome: 'Looking to simplify fleet operations?',
        prompts: [
            { label: 'Fleet operations', question: 'How does FleetManager support daily fleet operations?' },
            { label: 'Maintenance and reports', question: 'Can FleetManager help with maintenance and reporting?' },
            { label: 'Discuss a fleet', question: 'How can I see whether FleetManager fits our fleet?' },
        ],
    },
    edupulse: {
        title: 'EduPulse',
        summary: 'This page introduces EduPulse for school-to-home communication, attendance, assignments, and student updates.',
        welcome: 'Exploring EduPulse for a school?',
        prompts: [
            { label: 'School communication', question: 'How does EduPulse connect schools and parents?' },
            { label: 'Attendance and updates', question: 'What student updates can EduPulse share?' },
            { label: 'For a school', question: 'How can a school learn more about EduPulse?' },
        ],
    },
    contact: {
        title: 'Contact White Matrix',
        summary: 'This page helps visitors contact White Matrix and share project requirements.',
        welcome: 'How can we help with your project?',
        prompts: [
            { label: 'Request a quote', question: 'What information do you need for a project quote?' },
            { label: 'Discuss requirements', question: 'I would like to discuss a software project.' },
            { label: 'Office locations', question: 'Where are the White Matrix office locations?' },
        ],
    },
    careers: {
        title: 'Careers at White Matrix',
        summary: 'This page covers career opportunities at White Matrix.',
        welcome: 'Interested in joining White Matrix?',
        prompts: [
            { label: 'Career opportunities', question: 'What career opportunities are available?' },
            { label: 'Internships', question: 'How do White Matrix internships work?' },
            { label: 'Contact the team', question: 'How can I ask about a role?' },
        ],
    },
    internship: {
        title: 'White Matrix internships',
        summary: 'This page covers the White Matrix internship program and application information.',
        welcome: 'Looking for internship details?',
        prompts: [
            { label: 'Who can apply', question: 'Who can apply for the internship program?' },
            { label: 'Program details', question: 'What does the internship program include?' },
            { label: 'Application help', question: 'How can I apply for an internship?' },
        ],
    },
    team: {
        title: 'White Matrix team',
        summary: 'This page introduces the people and teams at White Matrix. The verified roster and exact roles are in the assistant knowledge base.',
        welcome: 'Want to meet the people behind White Matrix?',
        prompts: [
            { label: 'Leadership', question: 'Who are the co-founders of White Matrix?' },
            { label: 'AI team', question: 'Who is listed in the AI team?' },
            { label: 'UI/UX team', question: 'Who is listed in the UI/UX team?' },
        ],
    },
    general: {
        title: 'White Matrix website',
        summary: 'This page is part of the White Matrix Software Solutions website.',
        welcome: 'Welcome to White Matrix.',
        prompts: [
            { label: 'Our services', question: 'What services does White Matrix offer?' },
            { label: 'Our products', question: 'What products does White Matrix offer?' },
            { label: 'Contact the team', question: 'How can I contact White Matrix?' },
        ],
    },
};

function getCurrentChatbotPageContext() {
    const fileName = window.location.pathname.split('/').pop().toLowerCase();
    const pageId = fileName.replace(/\.html?$/, '') || 'home';
    const contextId = pageId === 'index' ? 'home' : pageId;
    const knownContext = CHATBOT_PAGE_CONTEXTS[contextId];
    if (knownContext) return { ...knownContext, id: contextId };

    const pageHeading = document.querySelector('.mil-inner-banner h1, .mil-inner-banner h2, main h1, #swupMain h1');
    const description = document.querySelector('meta[name="description"]')?.content;
    const title = pageHeading?.textContent.replace(/\s+/g, ' ').trim() || document.title.replace(/\s*[|–-].*$/, '').trim();
    return {
        ...CHATBOT_PAGE_CONTEXTS.general,
        id: contextId,
        title,
        summary: description || `${title} page on the White Matrix website.`,
    };
}

function buildPageAwareSystemPrompt(pageContext) {
    return `${WHITE_MATRIX_SYSTEM_PROMPT}\n\nCurrent page context:\nPage: ${pageContext.title}\nPage summary: ${pageContext.summary}\n\nUse the page context to make your response relevant to what the visitor is viewing. Do not invent page details.`;
}

// Toggle chatbot open/close
function dismissChatbotWelcome() {
    const welcomePopup = document.getElementById('chatbot-welcome');
    if (!welcomePopup) return;

    welcomePopup.classList.add('is-dismissed');
    welcomePopup.setAttribute('aria-hidden', 'true');
}

function toggleChatbot() {
    const chatbotWindow = document.getElementById('chatbot-window');
    const chatbotIcon = document.getElementById('chatbot-icon');
    if (!chatbotWindow) return;

    const isOpen = chatbotWindow.classList.contains('is-open');

    if (!isOpen) {
        dismissChatbotWelcome();
        chatbotWindow.classList.add('is-open');
        chatbotWindow.setAttribute('aria-hidden', 'false');
        if (chatbotIcon) chatbotIcon.style.display = 'none';
        if (chatbotIcon) chatbotIcon.setAttribute('aria-expanded', 'true');

        if (!initialMessageSent) {
            sendInitialMessage();
        }
        enableInput();
        window.requestAnimationFrame(() => document.getElementById('chatbot-input')?.focus());
    } else {
        chatbotWindow.classList.remove('is-open');
        chatbotWindow.setAttribute('aria-hidden', 'true');
        if (chatbotIcon) {
            chatbotIcon.style.display = '';
            chatbotIcon.setAttribute('aria-expanded', 'false');
            chatbotIcon.focus();
        }
    }
}

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && document.getElementById('chatbot-window')?.classList.contains('is-open')) {
        toggleChatbot();
    }
});

function addQuickActions(parent, pageContext) {
    const actions = document.createElement('div');
    actions.className = 'chatbot-quick-actions';
    actions.setAttribute('aria-label', 'Suggested questions');

    pageContext.prompts.forEach((prompt) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'chatbot-quick-btn';
        const label = document.createElement('span');
        label.textContent = prompt.label;
        button.appendChild(label);
        button.insertAdjacentHTML('beforeend', '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h12M10 4l6 6-6 6" /></svg>');
        button.addEventListener('click', () => handleOption(prompt.question));
        actions.appendChild(button);
    });

    parent.appendChild(actions);
}

function appendPageContextNotice(pageContext) {
    const bubble = addMessageToChat('bot-bubble', '');
    if (!bubble) return;

    const heading = document.createElement('p');
    heading.className = 'chatbot-intro-lead';
    heading.textContent = `Now viewing ${pageContext.title}`;
    const body = document.createElement('p');
    body.textContent = 'I can answer questions about this page or help you find the right next step.';
    bubble.append(heading, body);
    addQuickActions(bubble, pageContext);
}

// Opening M'Bot starts with suggestions specific to the page currently in view.
function sendInitialMessage() {
    const pageContext = getCurrentChatbotPageContext();
    const bubble = addMessageToChat('bot-bubble', '');
    if (!bubble) return;

    const intro = document.createElement('div');
    intro.className = 'chatbot-intro-copy';
    const heading = document.createElement('p');
    heading.className = 'chatbot-intro-lead';
    heading.textContent = pageContext.welcome;
    const body = document.createElement('p');
    body.textContent = pageContext.id === 'home'
        ? "I'm M'Bot. I can help you explore our services, products, and next steps."
        : `I'm M'Bot. I can answer questions about ${pageContext.title.toLowerCase()} or anything else about White Matrix.`;
    intro.append(heading, body);
    bubble.appendChild(intro);
    addQuickActions(bubble, pageContext);

    activeChatbotPageId = pageContext.id;
    initialMessageSent = true;
}

document.addEventListener('wm:page-context-change', () => {
    const pageContext = getCurrentChatbotPageContext();
    if (!initialMessageSent) {
        activeChatbotPageId = pageContext.id;
        return;
    }
    if (activeChatbotPageId === pageContext.id) return;

    activeChatbotPageId = pageContext.id;
    appendPageContextNotice(pageContext);
});

// Direct Gemini API call with cascading fallback models
async function requestDirectGemini(userMessage, history = [], pageContext = getCurrentChatbotPageContext()) {
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
            parts: [{ text: buildPageAwareSystemPrompt(pageContext) }]
        },
        contents: contents,
        generationConfig: {
            temperature: 0.45,
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
        const pageContext = getCurrentChatbotPageContext();
        const response = await fetch(`${BACKEND_URL}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, sessionId, history: chatHistory, pageId: pageContext.id }),
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
            botReply = await requestDirectGemini(message, chatHistory, getCurrentChatbotPageContext());
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

// Bind input events whether this script loaded with the document or on demand.
function bindChatbotInput() {
    const inputField = document.getElementById('chatbot-input');
    if (inputField && !inputField.dataset.chatbotBound) {
        inputField.dataset.chatbotBound = 'true';
        inputField.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                sendMessage();
            }
        });
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindChatbotInput, { once: true });
} else {
    bindChatbotInput();
}

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
