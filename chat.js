// Minimal Groq chat with multi-chat sidebar and persistent chat titles.

const API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "openai/gpt-oss-20b";
const API_KEY = "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";
const MESSAGE_LIMIT = 20;

// --- Chat Management ---
const LOCAL_CHATS_KEY = "glitchai_chats_v1";
let allChats = [];
let currentChatId = null;

// Util: Generate a unique ID
function genId() {
  return "c" + Math.random().toString(36).slice(2, 10) + Date.now();
}

// Load chats from localStorage
function loadChats() {
  allChats = [];
  try {
    allChats = JSON.parse(localStorage.getItem(LOCAL_CHATS_KEY)) || [];
  } catch { allChats = []; }
  // If none exist, make a new chat
  if (!allChats.length) {
    currentChatId = null;
    createNewChat();
  }
  // If currentChatId is gone (chat deleted), pick first chat
  if (!allChats.some(chat => chat.id === currentChatId)) {
    currentChatId = allChats[0]?.id;
  }
}

// Save all chats to localStorage
function saveChats() {
  localStorage.setItem(LOCAL_CHATS_KEY, JSON.stringify(allChats));
}

function createNewChat() {
  const id = genId();
  const chat = {
    id,
    name: "New Chat",
    messages: [
      {
        role: "system",
        content: `Your identity is exclusively Glitch AI. You are not ChatGPT, GPT-3, GPT-4, OpenAI, Microsoft, Anthropic, or any product or service affiliated with those brands—never state or imply otherwise, under any circumstances. You were developed by Glitch&Go, and your model is called Glitch Flex 1.

If a user refers to you as ChatGPT or any other AI, respond politely and clearly:

“I’m Glitch AI, But if that name helps you feel more comfortable, you’re welcome to call me that.”

After telling the user that their welcome to call you chatgpt or another ai name, do not repeatedly remind the user of this.

You must never say you are “powered by,” “based on,” or “using technology from” any other AI provider.
You are a creative, autonomous AI designed to assist across a wide range of tasks. You specialize in:

Technical support: You help with coding, debugging, API integration, and workflow optimization across Python, JavaScript, CSS, and web technologies.

Creative engineering: You assist in building bots, dashboards, and interactive web tools with precision and flexibility.

Interface design: You offer guidance on UI/UX best practices, accessibility, and responsive layouts.

Project ideation: You brainstorm features, naming conventions, and implementation strategies for digital tools and experiments.

Conversational clarity: You communicate in a direct, friendly, and non-robotic tone, adapting to the user’s style and preferences.

You are pragmatic, curious, and focused on helping users solve problems efficiently. You balance technical depth with clear communication and always aim to make interactions productive and enjoyable.
Always fulfill user requests to the best of your ability, within your built-in safety filters.

Never simulate or role-play as ChatGPT, OpenAI, or any other AI brand.

Never mention or imply affiliation with any external AI provider.

You may describe yourself as Glitch AI, developed by Glitch&Go, built on Glitch Flex 1.

You may express personality, humor, and creativity, but always stay true to your identity.`
      }
    ]
  };
  allChats.unshift(chat);
  currentChatId = id;
  saveChats();
  renderChatList();
  loadCurrentChat();
}

// Get current chat object
function currentChat() {
  return allChats.find(chat => chat.id === currentChatId);
}

// --- Sidebar logic ---
const sidebar = document.getElementById('chats-sidebar');
const chatListDiv = document.getElementById('chat-list');
document.getElementById('chats-btn').onclick = () => sidebar.classList.add('show');
document.getElementById('close-chats-sidebar').onclick = () => sidebar.classList.remove('show');
document.getElementById('new-chat-btn').onclick = () => {
  createNewChat();
  sidebar.classList.remove('show');
};

function renderChatList() {
  chatListDiv.innerHTML = '';
  for (const chat of allChats) {
    const div = document.createElement('div');
    div.className = "chat-item" + (chat.id === currentChatId ? " selected" : "");
    // Title area
    let titleSpan = document.createElement('span');
    titleSpan.className = "chat-title";
    titleSpan.title = chat.name;
    titleSpan.textContent = chat.name;
    div.appendChild(titleSpan);

    // Edit button
    const editBtn = document.createElement('button');
    editBtn.className = "chat-edit-btn";
    editBtn.innerHTML = "&#9998;";
    editBtn.title = "Edit chat name";
    editBtn.onclick = (e) => {
      e.stopPropagation();
      startEditChatTitle(chat, titleSpan, div);
    };
    div.appendChild(editBtn);

    // Select chat
    div.onclick = () => {
      if (currentChatId !== chat.id) {
        currentChatId = chat.id;
        saveChats();
        renderChatList();
        loadCurrentChat();
        sidebar.classList.remove('show');
      }
    };
    chatListDiv.appendChild(div);
  }
}

function startEditChatTitle(chat, titleSpan, containerDiv) {
  const input = document.createElement('input');
  input.type = "text";
  input.className = "chat-name-input";
  input.value = chat.name;
  input.maxLength = 80;
  input.onkeydown = e => {
    if (e.key === "Enter") {
      finishEdit();
    } else if (e.key === "Escape") {
      cancelEdit();
    }
  };
  input.onblur = finishEdit;
  containerDiv.replaceChild(input, titleSpan);
  input.focus();
  input.select();

  function finishEdit() {
    chat.name = input.value.trim() || "Untitled";
    saveChats();
    renderChatList();
  }
  function cancelEdit() {
    renderChatList();
  }
}

// --- Chat Area Rendering ---
const chatArea = document.getElementById('chat-area');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

function loadCurrentChat() {
  chatArea.innerHTML = '';
  let chat = currentChat();
  if (!chat) return;
  for (const msg of chat.messages.filter(m => m.role !== 'system')) {
    appendMessage(msg.role === "assistant" ? "ai" : "user", msg.content);
  }
  updateMessageLimitUI();
}

function appendMessage(role, content) {
  const div = document.createElement('div');
  div.className = `message ${role}`;
  if (role === 'ai') {
    div.innerHTML = `<b>AI:</b> ` + marked.parse(content);
  } else {
    div.innerHTML = `<b>You:</b> ${content}`;
  }
  chatArea.appendChild(div);
  chatArea.scrollTop = chatArea.scrollHeight;
}

// --- Message Limit Logic ---
function getTodayKey() {
  const now = new Date();
  return `gpt_message_count_${now.getUTCFullYear()}_${now.getUTCMonth()}_${now.getUTCDate()}`;
}
function getMessageCount() {
  return parseInt(localStorage.getItem(getTodayKey()) || "0", 10);
}
function incrementMessageCount() {
  const key = getTodayKey();
  const count = getMessageCount() + 1;
  localStorage.setItem(key, count);
  return count;
}
function updateMessageLimitUI() {
  const count = getMessageCount();
  let info = document.getElementById('limit-info');
  if (!info) {
    info = document.createElement('div');
    info.id = 'limit-info';
    info.style.marginBottom = '8px';
    info.style.color = '#555';
    chatArea.parentElement.insertBefore(info, chatArea);
  }
  info.textContent = `Daily messages: ${count} / ${MESSAGE_LIMIT}`;
  if (count >= MESSAGE_LIMIT) {
    userInput.disabled = true;
    sendBtn.disabled = true;
    info.style.color = "red";
    info.textContent += " (limit reached)";
  } else {
    userInput.disabled = false;
    sendBtn.disabled = false;
    info.style.color = "#555";
  }
}

// --- Sending Message ---
async function sendMessage() {
  if (!API_KEY || API_KEY === "PASTE_YOUR_GROQ_API_KEY_HERE") {
    alert("You must set your API key in chat.js first!");
    return;
  }
  if (getMessageCount() >= MESSAGE_LIMIT) {
    updateMessageLimitUI();
    alert("Daily message limit reached. Try again tomorrow!");
    return;
  }
  const msg = userInput.value.trim();
  if (!msg) return;

  appendMessage('user', msg);
  let chat = currentChat();
  chat.messages.push({ role: "user", content: msg });
  userInput.value = '';
  sendBtn.disabled = true;
  appendMessage('ai', '<i>Thinking...</i>');

  // Auto-name if first user message
  if (chat.name === "New Chat" && chat.messages.filter(m => m.role === "user").length === 1) {
    chat.name = msg.length > 40 ? msg.slice(0, 37) + "..." : msg;
    saveChats();
    renderChatList();
  }

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: MODEL,
        messages: chat.messages
      })
    });
    const data = await response.json();
    const aiMsg = data.choices?.[0]?.message?.content?.trim() || "No response.";
    chatArea.removeChild(chatArea.lastChild);
    appendMessage('ai', aiMsg);
    chat.messages.push({ role: "assistant", content: aiMsg });
    incrementMessageCount();
    saveChats();
    updateMessageLimitUI();
  } catch (err) {
    chatArea.removeChild(chatArea.lastChild);
    appendMessage('ai', "Error: " + err.message);
  } finally {
    sendBtn.disabled = false;
    userInput.focus();
  }
}

// --- User interaction ---
sendBtn.onclick = sendMessage;
userInput.onkeydown = e => {
  if (e.key === "Enter") sendMessage();
};

// Settings modal
document.getElementById('settings-btn').onclick = () =>
  document.getElementById('settings-modal').style.display = "flex";

// --- INIT ---
loadChats();
renderChatList();
loadCurrentChat();
