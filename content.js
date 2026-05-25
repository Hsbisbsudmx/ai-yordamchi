(function () {
  if (document.getElementById('ai-yordamchi-widget')) return;

  const widget = document.createElement('div');
  widget.id = 'ai-yordamchi-widget';
  widget.innerHTML = `
    <div id="aiy-bubble" title="AI Yordamchi">🤖</div>
    <div id="aiy-panel">
      <div id="aiy-header">
        <span id="aiy-title">🤖 AI Yordamchi</span>
        <div id="aiy-header-btns">
          <button id="aiy-context-btn" title="Sahifadan matn ol">📄</button>
          <button id="aiy-close-btn">✕</button>
        </div>
      </div>
      <div id="aiy-messages"></div>
      <div id="aiy-input-area">
        <textarea id="aiy-input" placeholder="Savolingizni yozing... (Enter = yuborish)" rows="2"></textarea>
        <button id="aiy-send-btn">➤</button>
      </div>
      <div id="aiy-footer">Sahifadagi matnni o'qib savollarga javob beradi</div>
    </div>
  `;
  document.body.appendChild(widget);

  const bubble = document.getElementById('aiy-bubble');
  const panel = document.getElementById('aiy-panel');
  const closeBtn = document.getElementById('aiy-close-btn');
  const sendBtn = document.getElementById('aiy-send-btn');
  const input = document.getElementById('aiy-input');
  const messages = document.getElementById('aiy-messages');
  const contextBtn = document.getElementById('aiy-context-btn');

  let isOpen = false;
  let pageContext = '';

  bubble.addEventListener('click', () => {
    isOpen = !isOpen;
    panel.style.display = isOpen ? 'flex' : 'none';
    if (isOpen) {
      input.focus();
      if (messages.children.length === 0) {
        addMessage('ai', '👋 Salom! Men AI Yordamchiman. Savol bering yoki 📄 tugmani bosib sahifadan matn olaman!');
      }
    }
  });

  closeBtn.addEventListener('click', () => {
    isOpen = false;
    panel.style.display = 'none';
  });

  contextBtn.addEventListener('click', () => {
    const bodyText = document.body.innerText.substring(0, 4000).trim();
    pageContext = bodyText;
    contextBtn.style.background = '#22c55e';
    contextBtn.style.color = '#fff';
    addMessage('system', `✅ Sahifa matni olindi (${bodyText.length} belgi). Endi shu sahifa haqida savol bering!`);
  });

  async function sendMessage() {
    const text = input.value.trim();
    if (!text) return;

    input.value = '';
    addMessage('user', text);
    const loadingId = addMessage('ai', '⏳ Javob tayyorlanmoqda...', true);

    try {
      const systemPrompt = pageContext
        ? `Sen AI yordamchisan. Quyidagi sahifa matni asosida savollarga javob ber:\n\n${pageContext}\n\nQisqa va aniq javob ber. O'zbek tilida gapir.`
        : `Sen AI yordamchisan. Foydalanuvchi savol beradi, qisqa va aniq javob ber. O'zbek tilida gapir.`;

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: systemPrompt,
          messages: [{ role: 'user', content: text }]
        })
      });

      const data = await response.json();
      const answer = data.content?.[0]?.text || 'Xatolik yuz berdi.';
      updateMessage(loadingId, answer);
    } catch (err) {
      updateMessage(loadingId, '❌ Xatolik: Internet yoki API muammosi.');
    }
  }

  sendBtn.addEventListener('click', sendMessage);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  let msgId = 0;
  function addMessage(type, text, loading = false) {
    const id = 'msg-' + (++msgId);
    const div = document.createElement('div');
    div.id = id;
    div.className = `aiy-msg aiy-msg-${type}`;
    div.innerText = text;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
    return id;
  }

  function updateMessage(id, text) {
    const el = document.getElementById(id);
    if (el) el.innerText = text;
    messages.scrollTop = messages.scrollHeight;
  }

  let dragging = false, ox = 0, oy = 0;
  bubble.addEventListener('mousedown', (e) => {
    dragging = true;
    ox = e.clientX - bubble.getBoundingClientRect().left;
    oy = e.clientY - bubble.getBoundingClientRect().top;
  });
  document.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    const x = e.clientX - ox;
    const y = e.clientY - oy;
    widget.style.right = 'auto';
    widget.style.bottom = 'auto';
    widget.style.left = x + 'px';
    widget.style.top = y + 'px';
  });
  document.addEventListener('mouseup', () => { dragging = false; });
})();
