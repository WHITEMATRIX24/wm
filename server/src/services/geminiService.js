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

/**
 * Call the Gemini API with user message and conversation history
 * @param {string} userMessage - Latest user message
 * @param {Array} history - Previous messages array [{ role: 'user'|'model', text: string }]
 * @returns {Promise<string>} - Bot reply text
 */
export async function generateGeminiReply(userMessage, history = []) {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error('GEMINI_API_KEY is not configured in server/.env');
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
      parts: [{ text: WHITE_MATRIX_SYSTEM_PROMPT }]
    },
    contents: contents,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 600
    }
  };

  // Models to try in order of priority (handles temporary 503 or model deprecations)
  const configuredModel = process.env.GEMINI_MODEL?.trim();
  const modelsToTry = [
    ...(configuredModel ? [configuredModel] : []),
    'gemini-3.5-flash-lite',
    'gemini-flash-lite-latest',
    'gemini-3.8-flash'
  ].filter((m, i, arr) => arr.indexOf(m) === i);

  let lastError = null;

  for (const currentModel of modelsToTry) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(currentModel)}:generateContent`,
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

