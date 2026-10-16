// White Matrix chatbot client. AI requests and persistence are handled by the server.

let initialMessageSent = false;
let chatHistory = [];

// Persistent session ID for backend conversation and lead tracking
let sessionId = sessionStorage.getItem('wm_chat_session');
if (!sessionId) {
    sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    sessionStorage.setItem('wm_chat_session', sessionId);
}

// Configurable backend API URL
const isLocalChatbotHost = !window.location.hostname || ['localhost', '127.0.0.1'].includes(window.location.hostname);
const BACKEND_URL = (window.WHITE_MATRIX_CHATBOT_API_BASE_URL ||
    (isLocalChatbotHost ? 'http://localhost:5005/api' : '/api')).replace(/\/+$/, '');

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

// Send messages through the backend, which reads provider credentials from server/.env.
async function sendMessage() {
    const inputField = document.getElementById('chatbot-input');
    if (!inputField || inputField.disabled) return;

    const message = inputField.value.trim();
    if (!message) return;

    addMessageToChat('user-bubble', escapeHTML(message));
    inputField.value = '';
    disableInput();
    const loadingBubble = addLoadingBubble();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    try {
        const response = await fetch(`${BACKEND_URL}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, sessionId, history: chatHistory }),
            signal: controller.signal
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok || typeof data.reply !== 'string' || !data.reply.trim()) {
            throw new Error(data.error || `Server returned ${response.status}`);
        }

        const botReply = data.reply.trim();
        chatHistory.push({ role: 'user', text: message });
        chatHistory.push({ role: 'model', text: botReply });
        updateBubbleContent(loadingBubble, formatMarkdown(botReply));
    } catch (error) {
        console.error('Chatbot request failed:', error);
        updateBubbleContent(loadingBubble, `I'm having trouble connecting right now. Please try again shortly or contact us at <a href="contact.html">our Contact Page</a>.`);
    } finally {
        clearTimeout(timeoutId);
        enableInput();
        inputField.focus();
    }
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
