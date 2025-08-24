import { Groq } from 'groq-sdk';

const groq = new Groq({ apiKey: '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' });

const sendBtn = document.getElementById('send-btn');
const userInput = document.getElementById('user-input');
const chatLog = document.getElementById('chat-log');

sendBtn.addEventListener('click', async () => {
  const input = userInput.value.trim();
  if (!input) return;

  appendMessage('user', input);
  userInput.value = '';

  const chatCompletion = await groq.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: 'You are a mischievous mythmaker AI who turns user frustrations into dashboard lore. Respond with layered humor, technical precision, and glitch-hop references.'
      },
      {
        role: 'user',
        content: input
      }
    ],
    model: 'openai/gpt-oss-120b',
    temperature: 1,
    max_completion_tokens: 8192,
    top_p: 1,
    stream: true,
    reasoning_effort: 'medium',
    stop: null
  });

  let aiResponse = '';
  for await (const chunk of chatCompletion) {
    const content = chunk.choices[0]?.delta?.content || '';
    aiResponse += content;
    appendMessage('ai', content, true);
  }
});

function appendMessage(role, text, streaming = false) {
  const msg = document.createElement('div');
  msg.classList.add('message', role);
  msg.textContent = `${role === 'user' ? 'You' : 'AI'}: ${text}`;
  if (streaming) {
    const last = chatLog.querySelector('.message.ai:last-child');
    if (last) last.textContent += text;
    else chatLog.appendChild(msg);
  } else {
    chatLog.appendChild(msg);
  }
  chatLog.scrollTop = chatLog.scrollHeight;
}
