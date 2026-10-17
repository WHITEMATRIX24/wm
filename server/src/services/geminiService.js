import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

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
  - Lead AI Full Stack Developer: Haniel Henry
  - AI Research Developer: Aashna Jose Alappattu, Lesmin Jibu Ukken
  - AI Interns: Sourav S Pradeep
  - Flutter Development Team: no member names are listed in the verified information provided here
  - Tech Ascent Interns: no member names are listed in the verified information provided here
  - UI/UX Team: Adil Hafeez (Lead), Sonu James, Shameema Naazar, Aadi Pradeep, Nilophar Rajiv Nair
  - Business Development Team: Swathi Parmeswaran, Alen N Saji
  - Business Analysts: Meril Mathew, Nasreena Hassan.
- Important Links on the website:
  - Services: services.html, software.html, ai.html, voip.html
  - Products: matrixErpSuite.html, fleetManager.html, eduPulse.html
  - Team: team.html
  - Careers: careers.html
  - Internships: Internship.html
  - Contact: contact.html

When answering about the team, preserve the groupings above. In particular, Haniel Henry is listed as Lead AI Full Stack Developer; Aashna Jose Alappattu and Lesmin Jibu Ukken are listed as AI Research Developers; Sourav S Pradeep is listed as an AI Intern; and Adil Hafeez is the UI/UX Team Lead. Do not merge these roles or assign people to the Flutter or Tech Ascent groups because no names are listed for those groups.

Lead Capture Behavior:
If a user expresses interest in hiring White Matrix, getting a quote, or starting a project, politely ask for their Name, Email, and Phone number or specific requirements, and assure them our team will reach out promptly.
`;

const CHATBOT_PAGE_CONTEXTS = {
  home: {
    title: 'White Matrix',
    summary: 'The homepage introduces White Matrix services, products, company story, and ways to start a project.'
  },
  services: {
    title: 'White Matrix services',
    summary: 'This page covers custom software development, artificial intelligence, VoIP and telecommunications, and project consulting.'
  },
  software: {
    title: 'Custom software development',
    summary: 'This page describes tailored web, mobile, and enterprise software development for business workflows.'
  },
  application: {
    title: 'Application development',
    summary: 'This page covers custom application development for web and mobile use cases.'
  },
  ai: {
    title: 'Artificial intelligence and G Matrix',
    summary: 'This page introduces White Matrix AI and machine learning work, including G Matrix and generative AI use cases.'
  },
  voip: {
    title: 'VoIP and communication solutions',
    summary: 'This page covers White Matrix VoIP, telephony, and call-centre solutions.'
  },
  matrixerpsuite: {
    title: 'Matrix ERP Suite',
    summary: 'This page describes Matrix ERP Suite, a configurable enterprise resource planning platform for connected business workflows.'
  },
  fleetmanager: {
    title: 'FleetManager',
    summary: 'This page describes FleetManager for fleet and logistics operations, including trips, maintenance, and reporting.'
  },
  edupulse: {
    title: 'EduPulse',
    summary: 'This page introduces EduPulse for school-to-home communication, attendance, assignments, and student updates.'
  },
  contact: {
    title: 'Contact White Matrix',
    summary: 'This page helps visitors contact White Matrix and share project requirements.'
  },
  careers: {
    title: 'Careers at White Matrix',
    summary: 'This page covers career opportunities at White Matrix.'
  },
  internship: {
    title: 'White Matrix internships',
    summary: 'This page covers the White Matrix internship program and application information.'
  },
  team: {
    title: 'White Matrix team',
    summary: 'This page introduces the people and teams at White Matrix. Use only the verified names and roles in the assistant knowledge base.'
  },
  general: {
    title: 'White Matrix website',
    summary: 'This page is part of the White Matrix Software Solutions website.'
  }
};

function buildPageAwareSystemPrompt(pageId) {
  const contextId = typeof pageId === 'string' && Object.prototype.hasOwnProperty.call(CHATBOT_PAGE_CONTEXTS, pageId)
    ? pageId
    : 'general';
  const pageContext = CHATBOT_PAGE_CONTEXTS[contextId];

  return `${WHITE_MATRIX_SYSTEM_PROMPT}\n\nCurrent page context:\nPage: ${pageContext.title}\nPage summary: ${pageContext.summary}\n\nUse the page context to make your response relevant to what the visitor is viewing. Do not invent page details.`;
}

/**
 * Call the Gemini API with user message and conversation history
 * @param {string} userMessage - Latest user message
 * @param {Array} history - Previous messages array [{ role: 'user'|'model', text: string }]
 * @param {string} pageId - Known page identifier used to tailor the response
 * @returns {Promise<string>} - Bot reply text
 */
export async function generateGeminiReply(userMessage, history = [], pageId = 'general') {
  // Sanitize API key (strip whitespace, surrounding quotes or trailing newlines from copy-pasting)
  const apiKey = (process.env.GEMINI_API_KEY || '')
    .trim()
    .replace(/^["']|["']$/g, '');

  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error('GEMINI_API_KEY is not configured in environment variables');
  }

  // Format contents for Gemini REST API
  const contents = [];

  // Add conversation history if present (limit to last 10 turns for context efficiency)
  if (Array.isArray(history) && history.length > 0) {
    const recentHistory = history
      .filter((msg) => msg && typeof (msg.text || msg.content) === 'string' && (msg.text || msg.content).trim())
      .slice(-10);
    for (const msg of recentHistory) {
      contents.push({
        role: msg.role === 'model' || msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.text || msg.content || '' }]
      });
    }
  }

  // Add the current user message
  contents.push({
    role: 'user',
    parts: [{ text: userMessage }]
  });

  const requestBody = {
    system_instruction: {
      parts: [{ text: buildPageAwareSystemPrompt(pageId) }]
    },
    contents: contents,
    generationConfig: {
      temperature: 0.45,
      maxOutputTokens: 600
    }
  };

  // Models to try in order of priority (handles temporary 503 or model deprecations)
  const configuredModel = (process.env.GEMINI_MODEL || '')
    .trim()
    .replace(/^["']|["']$/g, '');

  const modelsToTry = [
    ...(configuredModel ? [configuredModel] : []),
    'gemini-3.5-flash-lite',
    'gemini-2.5-flash-lite',
    'gemini-flash-lite-latest',
    'gemini-flash-latest',
    'gemini-3.5-flash',
    'gemini-3.8-flash'
  ].filter((m, i, arr) => arr.indexOf(m) === i && Boolean(m));

  let lastError = null;

  for (const currentModel of modelsToTry) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(currentModel)}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal
        }
      );

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error?.message || `Gemini API error (Status ${response.status})`);
      }

      const candidate = data.candidates?.[0];
      const replyText = candidate?.content?.parts?.[0]?.text;

      if (replyText && replyText.trim()) {
        return replyText.trim();
      }
      throw new Error(`Empty response from model ${currentModel}`);
    } catch (err) {
      lastError = err;
      console.warn(`⚠️ Model ${currentModel} error: ${err.message}. Trying next available model...`);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw lastError || new Error('All Gemini candidate models failed to generate a response');
}

