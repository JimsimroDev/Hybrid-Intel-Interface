// app.js — AI Orchestrator Frontend

const API_BASE ='https:orchestrator-api.jimsimrodev.uk/api/v1';

// --- API Client ---

/**
 * Sends a query to the Orchestrator API.
 * @param {string} query - The user's question
 * @returns {Promise<string>} - Resolves with the answer string
 * @throws {Error} - Rejects with a descriptive message on HTTP or network error
 */
async function queryOrchestrator(pregunta) {
  let response;
  try {
    response = await fetch(`${API_BASE}/assistant/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({pregunta }),
    });
  } catch (_networkError) {
    throw new Error('Error de conexión: no se pudo contactar con el servidor.');
  }

  if (!response.ok) {
    throw new Error('HTTP error: ' + response.status);
  }

  const data = await response.json();
  return data.respuesta;
}

// --- Chat UI ---

/**
 * Returns the inner message container inside #chat-container.
 * @returns {HTMLElement}
 */
function getChatInner() {
  return document.querySelector('#chat-container > div');
}

/**
 * Scrolls #chat-container to the bottom.
 */
function scrollToBottom() {
  const container = document.getElementById('chat-container');
  container.scrollTop = container.scrollHeight;
}

/**
 * Appends a right-aligned user message bubble.
 * @param {string} text - Plain text (set via textContent, never innerHTML)
 */
function appendUserMessage(text) {
  const article = document.createElement('article');
  article.className =
    'message message--user fade-in ml-auto bg-blue-600 text-white rounded-lg px-4 py-2 max-w-xs sm:max-w-md';
  article.textContent = text;
  getChatInner().appendChild(article);
  scrollToBottom();
}

/**
 * Appends a left-aligned AI message bubble with rendered markdown.
 * @param {string} answer - Markdown string from the API
 */
function appendAIMessage(answer) {
  const article = document.createElement('article');
  article.className =
    'message message--ai fade-in mr-auto bg-gray-800 text-gray-100 rounded-lg px-4 py-2 max-w-xs sm:max-w-2xl';
  article.innerHTML = marked.parse(answer);
  getChatInner().appendChild(article);
  scrollToBottom();
}

/**
 * Appends a left-aligned error message bubble with error styling.
 * @param {string} text - Plain error text
 */
function appendErrorMessage(text) {
  const article = document.createElement('article');
  article.className =
    'message message--ai message--error fade-in mr-auto bg-red-950 border border-red-700 text-red-300 rounded-lg px-4 py-2';
  article.textContent = text;
  getChatInner().appendChild(article);
  scrollToBottom();
}

/**
 * Shows the loading indicator and disables the send button and text input.
 */
function showLoading() {
  document.getElementById('loading-indicator').classList.remove('hidden');
  document.getElementById('send-btn').disabled = true;
  document.getElementById('user-input').disabled = true;
}

/**
 * Hides the loading indicator and re-enables the send button and text input.
 */
function hideLoading() {
  document.getElementById('loading-indicator').classList.add('hidden');
  document.getElementById('send-btn').disabled = false;
  const input = document.getElementById('user-input');
  input.disabled = false;
  input.focus();
}

// --- Suggestion Cards ---

// --- Suggestion Cards Actualizadas ---

const SUGGESTIONS = [
  "¿Cuáles son las excepciones de la política de reembolsos de Tech-Nebula?",
  "¿Quién es el Ing. Jimmis J Simanca y cuál es su código de acceso?",
  "¿Qué sucede si la temperatura del Reactor de Helio-3 supera los 4,500 K?",
  "¿Qué propiedades curativas tiene la Orquídea de Cristal de Xylos-V?"
];

/**
 * Renders exactly 4 suggestion cards into the #suggestions grid.
 */
function initSuggestions() {
  const grid = document.querySelector('#suggestions > div');
  SUGGESTIONS.forEach((text) => {
    const btn = document.createElement('button');
    btn.className =
      'suggestion-card bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-blue-500 text-gray-300 text-sm rounded-lg px-3 py-2 text-left transition-all duration-200';
    btn.textContent = text;
    btn.addEventListener('click', () => {
      document.getElementById('user-input').value = text;
      handleSubmit();
    });
    grid.appendChild(btn);
  });
}

/**
 * Hides the #suggestions section.
 */
function hideSuggestions() {
  document.getElementById('suggestions').classList.add('hidden');
}

// --- Input Handling and Submission ---

let firstSubmit = true;

/**
 * Reads the input value, validates it, and orchestrates the full submit flow.
 */
async function handleSubmit() {
  const input = document.getElementById('user-input');
  const pregunta = input.value.trim();

  if (!pregunta) return;

  if (firstSubmit) {
    firstSubmit = false;
    hideSuggestions();
  }

  appendUserMessage(pregunta);
  input.value = '';
  showLoading();

  try {
    const answer = await queryOrchestrator(pregunta);
    appendAIMessage(answer);
  } catch (err) {
    appendErrorMessage(err.message);
  } finally {
    hideLoading();
  }
}

/**
 * Attaches Enter keydown listener on #user-input and click listener on #send-btn.
 */
function bindEvents() {
  const input = document.getElementById('user-input');
  const sendBtn = document.getElementById('send-btn');

  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !input.disabled) {
      handleSubmit();
    }
  });

  sendBtn.addEventListener('click', () => {
    handleSubmit();
  });
}

// --- API Health Check ---

/**
 * Fetches the API health endpoint and updates the #api-status indicator.
 */
async function checkApiHealth() {
  const statusEl = document.getElementById('api-status');
  const dotSpan = statusEl.querySelector('span:first-child');
  const textSpan = statusEl.querySelector('span.text-xs');

  try {
    const response = await fetch(`${API_BASE}/actuator/health`);
    if (response.ok) {
      dotSpan.className = 'w-2 h-2 rounded-full bg-green-500';
      textSpan.textContent = 'En línea';
    } else {
      dotSpan.className = 'w-2 h-2 rounded-full bg-red-500';
      textSpan.textContent = 'Sin conexión';
    }
  } catch (_err) {
    dotSpan.className = 'w-2 h-2 rounded-full bg-red-500';
    textSpan.textContent = 'Sin conexión';
  }
}

// --- Initialisation ---

document.addEventListener('DOMContentLoaded', () => {
  initSuggestions();
  bindEvents();
  checkApiHealth();
});
