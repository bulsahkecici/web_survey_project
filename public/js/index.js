// Survey User Interface Script
const qs = new URLSearchParams(location.search);
const token = qs.get('token');
let surveySlug = qs.get('survey') || 'ornek-anket';
let surveyId = null;
let isDirty = false;

// LocalStorage draft key
function getDraftKey() {
  return `draft:${surveyId}`;
}

// Save draft to localStorage
function saveDraft() {
  if (!surveyId) return;
  const email = document.getElementById('email').value.trim();
  const answers = collectAnswers();
  const draft = { email, answers, timestamp: new Date().toISOString() };
  localStorage.setItem(getDraftKey(), JSON.stringify(draft));
  isDirty = true;
}

// Load draft from localStorage
function loadDraft() {
  if (!surveyId) return null;
  const draftStr = localStorage.getItem(getDraftKey());
  if (!draftStr) return null;
  try {
    return JSON.parse(draftStr);
  } catch {
    return null;
  }
}

// Clear draft from localStorage
function clearDraft() {
  if (!surveyId) return;
  localStorage.removeItem(getDraftKey());
  isDirty = false;
}

// Restore draft to form
function restoreDraft(draft) {
  if (!draft) return;
  
  // Restore email
  if (draft.email) {
    document.getElementById('email').value = draft.email;
  }
  
  // Restore answers
  if (draft.answers && Array.isArray(draft.answers)) {
    draft.answers.forEach((answer) => {
      const inputs = document.querySelectorAll(`[name="q_${answer.questionId}"]`);
      if (inputs.length === 1 && 
          (inputs[0].tagName === 'TEXTAREA' || 
           inputs[0].tagName === 'SELECT' || 
           inputs[0].type === 'number')) {
        inputs[0].value = answer.value;
      } else if (inputs.length >= 1) {
        const values = typeof answer.value === 'string' && answer.value.startsWith('[')
          ? JSON.parse(answer.value)
          : [answer.value];
        inputs.forEach((inp) => {
          if ((inp.type === 'radio' || inp.type === 'checkbox') && 
              values.includes(inp.value)) {
            inp.checked = true;
          }
        });
      }
    });
  }
}

// Beforeunload warning
window.addEventListener('beforeunload', (e) => {
  if (isDirty) {
    e.preventDefault();
    e.returnValue = '';
    return '';
  }
});

async function loadSurvey() {
  // If token exists, fetch invitation info first
  if (token) {
    try {
      const invRes = await fetch(`/api/invitations/${token}`);
      const invData = await invRes.json();

      if (!invData.ok) {
        document.body.innerHTML = `<p class='error'>${invData.message || 'Geçersiz davetiye'}</p>`;
        return;
      }

      // Auto-fill and lock email field
      const emailInput = document.getElementById('email');
      emailInput.value = invData.data.email;
      emailInput.readOnly = true;
      emailInput.style.backgroundColor = '#f3f4f6';
      emailInput.style.cursor = 'not-allowed';
      
      // Show info message
      const infoDiv = document.createElement('div');
      infoDiv.style.cssText =
        'background: #dbeafe; border-left: 4px solid #3b82f6; padding: 12px; margin-bottom: 20px; border-radius: 8px;';
      infoDiv.innerHTML = `<strong>ℹ️ Davetiye:</strong> Bu anket ${invData.data.email} için oluşturulmuştur.`;
      document.querySelector('.container').insertBefore(
        infoDiv,
        document.querySelector('.container').firstChild,
      );
    } catch (err) {
      document.body.innerHTML = `<p class='error'>Davetiye yüklenemedi: ${err.message}</p>`;
      return;
    }
  }

  const res = await fetch(`/api/surveys/${surveySlug}`);
  const response = await res.json();
  
  if (!response.ok) {
    document.body.innerHTML =
      "<p class='error'>Anket bulunamadı veya aktif değil.</p>";
    return;
  }
  
  const { survey, questions } = response.data;
  surveyId = survey.id;
  document.getElementById('title').textContent = survey.title;
  renderQuestions(questions);
  
  // Load draft if exists
  const draft = loadDraft();
  if (draft) {
    const msg = `Taslak bulundu (${new Date(draft.timestamp).toLocaleString('tr-TR')}). Yüklemek ister misiniz?`;
    if (confirm(msg)) {
      restoreDraft(draft);
    } else {
      clearDraft();
    }
  }
  
  // Auto-save draft on form change
  document.getElementById('form').addEventListener('change', saveDraft);
  if (!token) {
    // Only allow email input if no token
    document.getElementById('email').addEventListener('input', saveDraft);
  }
}

function renderQuestions(questions) {
  const form = document.getElementById('form');
  form.innerHTML = '';
  questions.forEach((q) => {
    const wrap = document.createElement('div');
    wrap.className = 'card';
    wrap.dataset.qid = q.id;
    wrap.dataset.ord = q.ord;
    wrap.style.display = 'block';

    const label = document.createElement('label');
    label.className = 'label';
    label.textContent =
      q.ord + '. ' + q.label + (q.required ? ' *' : '');
    wrap.appendChild(label);

    const opts = q.options_json ? JSON.parse(q.options_json) : null;
    const conditionalLogic = q.conditional_logic
      ? JSON.parse(q.conditional_logic)
      : null;

    if (q.type === 'text') {
      const input = document.createElement('textarea');
      input.rows = 3;
      input.required = !!q.required;
      input.name = 'q_' + q.id;
      wrap.appendChild(input);
    } else if (q.type === 'number') {
      const input = document.createElement('input');
      input.type = 'number';
      input.required = !!q.required;
      input.name = 'q_' + q.id;
      wrap.appendChild(input);
    } else if (q.type === 'single') {
      // Çok fazla seçenek varsa (>10) dropdown kullan
      if (opts && opts.length > 10) {
        const select = document.createElement('select');
        select.name = 'q_' + q.id;
        if (q.required) select.required = true;
        select.innerHTML =
          `<option value="">Seçiniz</option>` +
          (opts || []).map((o) => `<option value="${o}">${o}</option>`).join('');

        // Koşullu akış için event listener
        if (conditionalLogic && conditionalLogic.rules) {
          select.addEventListener('change', () =>
            handleConditionalLogic(q.ord, select.value, conditionalLogic)
          );
        }

        wrap.appendChild(select);
      } else {
        // Normal radio button'lar
        (opts || []).forEach((option) => {
          const chip = document.createElement('label');
          chip.className = 'chip';
          const radio = document.createElement('input');
          radio.type = 'radio';
          radio.name = 'q_' + q.id;
          radio.value = option;
          if (q.required) radio.required = true;

          // Koşullu akış için event listener
          if (conditionalLogic && conditionalLogic.rules) {
            radio.addEventListener('change', () =>
              handleConditionalLogic(q.ord, radio.value, conditionalLogic)
            );
          }

          chip.appendChild(radio);
          chip.append(' ' + option);
          wrap.appendChild(chip);
        });
      }
    } else if (q.type === 'multiple') {
      (opts || []).forEach((option) => {
        const chip = document.createElement('label');
        chip.className = 'chip';
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.name = 'q_' + q.id;
        cb.value = option;
        chip.appendChild(cb);
        chip.append(' ' + option);
        wrap.appendChild(chip);
      });
    } else if (q.type === 'likert') {
      const select = document.createElement('select');
      select.name = 'q_' + q.id;
      if (q.required) select.required = true;
      select.innerHTML =
        `<option value="">Seçiniz</option>` +
        (opts || []).map((o) => `<option>${o}</option>`).join('');

      // Koşullu akış için event listener
      if (conditionalLogic && conditionalLogic.rules) {
        select.addEventListener('change', () =>
          handleConditionalLogic(q.ord, select.value, conditionalLogic)
        );
      }

      wrap.appendChild(select);
    }

    form.appendChild(wrap);
  });
}

function handleConditionalLogic(currentOrd, answer, logic) {
  if (!logic || !logic.rules) return;

  // Find matching rule
  const rule = logic.rules.find((r) => r.answer === answer);

  if (rule && rule.nextQuestionOrd) {
    // Hide all questions between current and target
    const allCards = document.querySelectorAll('[data-qid]');
    allCards.forEach((card) => {
      const cardOrd = parseInt(card.dataset.ord);
      if (cardOrd > currentOrd && cardOrd < rule.nextQuestionOrd) {
        card.style.display = 'none';
        // Clear inputs in hidden questions
        const inputs = card.querySelectorAll('input, select, textarea');
        inputs.forEach((inp) => {
          if (inp.type === 'checkbox' || inp.type === 'radio') {
            inp.checked = false;
          } else {
            inp.value = '';
          }
          inp.required = false;
        });
      } else if (cardOrd >= rule.nextQuestionOrd) {
        card.style.display = 'block';
      }
    });
  } else {
    // No rule matched or default flow - show next question
    const allCards = document.querySelectorAll('[data-qid]');
    allCards.forEach((card) => {
      const cardOrd = parseInt(card.dataset.ord);
      if (cardOrd === currentOrd + 1) {
        card.style.display = 'block';
      }
    });
  }
}

function collectAnswers() {
  const answers = [];
  document.querySelectorAll('[data-qid]').forEach((wrap) => {
    const qid = parseInt(wrap.dataset.qid, 10);
    const name = 'q_' + qid;
    const inputs = wrap.querySelectorAll(`[name="${name}"]`);

    if (
      inputs.length === 1 &&
      (inputs[0].tagName === 'TEXTAREA' ||
        inputs[0].tagName === 'SELECT' ||
        inputs[0].type === 'number')
    ) {
      answers.push({ questionId: qid, value: inputs[0].value });
    } else if (inputs.length >= 1) {
      const selected = [];
      inputs.forEach((i) => {
        if (
          (i.type === 'radio' || i.type === 'checkbox') &&
          i.checked
        )
          selected.push(i.value);
      });
      answers.push({
        questionId: qid,
        value:
          selected.length <= 1
            ? selected[0] || ''
            : JSON.stringify(selected),
      });
    }
  });
  return answers;
}

document
  .getElementById('submitBtn')
  .addEventListener('click', async (e) => {
    e.preventDefault();
    const status = document.getElementById('status');
    status.textContent = 'Gönderiliyor...';

    const email = document.getElementById('email').value.trim();
    if (!email) {
      status.textContent = 'Lütfen e-postanızı giriniz.';
      return;
    }

    const answers = collectAnswers();

    try {
      const res = await fetch('/api/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ surveySlug, email, token, answers }),
      });
      const data = await res.json();
      if (!data.ok) {
        status.textContent = data.message || 'Hata oluştu.';
      } else {
        status.textContent = 'Teşekkürler! Yanıtınız kaydedildi.';
        document.getElementById('submitBtn').disabled = true;
        clearDraft(); // Clear draft on successful submit
        isDirty = false;
      }
    } catch (err) {
      status.textContent = 'Ağ hatası: ' + err.message;
    }
  });

loadSurvey();

