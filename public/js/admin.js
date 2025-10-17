// Admin Panel Script - Survey Management System

// Global state
let surveys = [];
let selectedSurvey = null;
let questions = [];
let sections = [];
let currentSection = null;
let editingQuestionIndex = null;
let draggedIndex = null;
let authToken = null;

// Token management
function getAuthToken() {
  if (!authToken) {
    authToken = localStorage.getItem('adminToken');
  }
  return authToken;
}

function setAuthToken(token) {
  authToken = token;
  localStorage.setItem('adminToken', token);
}

function clearAuthToken() {
  authToken = null;
  localStorage.removeItem('adminToken');
}

// Fetch wrapper with auth header
async function fetchWithAuth(url, options = {}) {
  const token = getAuthToken();
  
  if (!options.headers) {
    options.headers = {};
  }
  
  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Body varsa Content-Type ekle (body zaten JSON.stringify ile string)
  if (options.body) {
    options.headers['Content-Type'] = 'application/json';
  }
  
  const response = await fetch(url, options);
  
  // 401 durumunda logout yap
  if (response.status === 401) {
    handleLogout();
    throw new Error('Session expired. Please login again.');
  }
  
  return response;
}

// Login handler
async function handleLogin() {
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const errorDiv = document.getElementById('loginError');
  
  if (!email || !password) {
    errorDiv.textContent = 'Lütfen e-posta ve şifre girin.';
    errorDiv.style.display = 'block';
    return;
  }
  
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    
    const data = await res.json();
    
    if (data.ok) {
      setAuthToken(data.data.token);
      document.getElementById('loginOverlay').classList.add('hidden');
      showToast(`Hoş geldiniz, ${data.data.user.name}!`, 'success');
      loadSurveys(); // Load data after login
    } else {
      errorDiv.textContent = data.message || 'Giriş başarısız';
      errorDiv.style.display = 'block';
    }
  } catch (err) {
    errorDiv.textContent = 'Bağlantı hatası: ' + err.message;
    errorDiv.style.display = 'block';
  }
}

// Logout handler
function handleLogout() {
  clearAuthToken();
  document.getElementById('loginOverlay').classList.remove('hidden');
  surveys = [];
  selectedSurvey = null;
  questions = [];
  sections = [];
  document.getElementById('noSurveyView').classList.add('active');
  document.getElementById('surveyManagementView').classList.remove('active');
  document.getElementById('questionsView').classList.remove('active');
}

// Check auth on page load
function checkAuth() {
  const token = getAuthToken();
  if (!token) {
    document.getElementById('loginOverlay').classList.remove('hidden');
  } else {
    document.getElementById('loginOverlay').classList.add('hidden');
  }
  return !!token;
}

// Toast notification system
function showToast(message, type = 'success') {
  // Remove existing toasts
  document.querySelectorAll('.toast').forEach((t) => t.remove());
  
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
  };
  
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || '📢'}</span>
    <span class="toast-message">${message}</span>
    <button class="toast-close" onclick="this.parentElement.remove()">×</button>
  `;
  
  document.body.appendChild(toast);
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (toast.parentElement) {
      toast.style.animation = 'slideIn 0.3s ease reverse';
      setTimeout(() => toast.remove(), 300);
    }
  }, 5000);
}

const TEMPLATES = {
  NPS: [
    {
      label:
        'Bizi 0-10 arasında bir arkadaşınıza önerme olasılığınız?',
      type: 'likert',
      required: true,
      options: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
    },
    {
      label: 'Neden bu puanı verdiniz?',
      type: 'text',
      required: false,
      options: [],
    },
  ],
  Likert5: [
    {
      label: 'Genel memnuniyet düzeyiniz',
      type: 'likert',
      required: true,
      options: ['1-Kötü', '2', '3', '4', '5-Çok İyi'],
    },
  ],
  Demografi: [
    { label: 'Yaş', type: 'number', required: false, options: [] },
    {
      label: 'Cinsiyet',
      type: 'single',
      required: false,
      options: ['Kadın', 'Erkek'],
    },
    {
      label: 'Eğitim Durumu',
      type: 'single',
      required: false,
      options: [
        'İlkokul',
        'Ortaokul',
        'Lise',
        'Üniversite',
        'Lisansüstü',
      ],
    },
  ],
  Sehir: [
    {
      label: 'Hangi şehirde yaşıyorsunuz?',
      type: 'single',
      required: true,
      options: [
        'Adana',
        'Adıyaman',
        'Afyonkarahisar',
        'Ağrı',
        'Amasya',
        'Ankara',
        'Antalya',
        'Artvin',
        'Aydın',
        'Balıkesir',
        'Bilecik',
        'Bingöl',
        'Bitlis',
        'Bolu',
        'Burdur',
        'Bursa',
        'Çanakkale',
        'Çankırı',
        'Çorum',
        'Denizli',
        'Diyarbakır',
        'Edirne',
        'Elazığ',
        'Erzincan',
        'Erzurum',
        'Eskişehir',
        'Gaziantep',
        'Giresun',
        'Gümüşhane',
        'Hakkari',
        'Hatay',
        'Isparta',
        'Mersin',
        'İstanbul',
        'İzmir',
        'Kars',
        'Kastamonu',
        'Kayseri',
        'Kırklareli',
        'Kırşehir',
        'Kocaeli',
        'Konya',
        'Kütahya',
        'Malatya',
        'Manisa',
        'Kahramanmaraş',
        'Mardin',
        'Muğla',
        'Muş',
        'Nevşehir',
        'Niğde',
        'Ordu',
        'Rize',
        'Sakarya',
        'Samsun',
        'Siirt',
        'Sinop',
        'Sivas',
        'Tekirdağ',
        'Tokat',
        'Trabzon',
        'Tunceli',
        'Şanlıurfa',
        'Uşak',
        'Van',
        'Yozgat',
        'Zonguldak',
        'Aksaray',
        'Bayburt',
        'Karaman',
        'Kırıkkale',
        'Batman',
        'Şırnak',
        'Bartın',
        'Ardahan',
        'Iğdır',
        'Yalova',
        'Karabük',
        'Kilis',
        'Osmaniye',
        'Düzce',
      ],
    },
  ],
};

// Init
if (checkAuth()) {
  loadSurveys();
}

async function loadSurveys() {
  try {
    const res = await fetchWithAuth('/api/surveys');
    const response = await res.json();
    surveys = response.ok ? response.data : [];
    renderSurveysDropdown();
  } catch (err) {
    console.error('Failed to load surveys:', err);
  }
}

function renderSurveysDropdown() {
  const container = document.getElementById('surveysDropdownContent');
  container.innerHTML = '';
  surveys.forEach((s) => {
    const item = document.createElement('div');
    item.className =
      'dropdown-item' +
      (selectedSurvey && selectedSurvey.id === s.id ? ' selected' : '');
    item.innerHTML = `
          <strong>${s.title}</strong><br>
          <small style="color: #6b7280;">/${s.slug}</small>
          <span class="badge ${
            s.is_active ? 'badge-success' : 'badge-danger'
          }" style="margin-left: 8px;">
            ${s.is_active ? 'Aktif' : 'Pasif'}
          </span>
        `;
    item.onclick = () => selectSurvey(s);
    container.appendChild(item);
  });

  if (surveys.length === 0) {
    container.innerHTML =
      '<div class="dropdown-item" style="text-align:center; color: #9ca3af;">Henüz anket yok</div>';
  }
}

function toggleDropdown() {
  document
    .getElementById('surveysDropdown')
    .classList.toggle('active');
}

// Close dropdown when clicking outside
document.addEventListener('click', function (e) {
  const dropdown = document.getElementById('surveysDropdown');
  if (!dropdown.contains(e.target)) {
    dropdown.classList.remove('active');
  }
});

async function selectSurvey(survey) {
  selectedSurvey = survey;
  document.getElementById('selectedSurveyText').textContent =
    survey.title;
  document
    .getElementById('surveysDropdown')
    .classList.remove('active');

  // Update UI
  document.getElementById('noSurveyView').classList.remove('active');
  document
    .getElementById('surveyManagementView')
    .classList.add('active');
  document.getElementById('questionsView').classList.remove('active');

  document.getElementById('currentSurveyTitle').textContent =
    survey.title;
  document.getElementById('currentSurveySlug').textContent =
    '/' + survey.slug;
  document.getElementById('surveyActiveToggle').checked =
    survey.is_active;

  // Update stats
  document.getElementById('statTotalResponses').textContent =
    survey.total_responses || 0;
  document.getElementById('statTotalInvitations').textContent =
    survey.total_invitations || 0;
  document.getElementById('statUsedInvitations').textContent =
    survey.used_invitations || 0;

  // Load sections
  await loadSections();

  renderSurveysDropdown();
}

async function loadSections() {
  if (!selectedSurvey) return;
  try {
    const res = await fetchWithAuth(
      `/api/surveys/${selectedSurvey.id}/sections`
    );
    const response = await res.json();
    sections = response.ok ? response.data : [];
  } catch (err) {
    console.error('Failed to load sections:', err);
  }
}

function showNewSurveyModal() {
  document.getElementById('newSurveySlug').value = '';
  document.getElementById('newSurveyTitle').value = '';
  document.getElementById('newSurveyModal').classList.add('active');
}

async function createSurvey() {
  const slug = document.getElementById('newSurveySlug').value.trim();
  const title = document.getElementById('newSurveyTitle').value.trim();

  if (!slug || !title) {
    showToast('Lütfen tüm alanları doldurun.', 'error');
    return;
  }

  try {
    const res = await fetchWithAuth('/api/surveys', {
      method: 'POST',
      body: JSON.stringify({ slug, title, isActive: true }),
    });

    const data = await res.json();
    if (data.ok) {
      closeModal('newSurveyModal');
      await loadSurveys();
      const newSurvey = surveys.find((s) => s.id === data.data.id);
      if (newSurvey) selectSurvey(newSurvey);
      showToast('Anket başarıyla oluşturuldu!', 'success');
    } else {
      console.error('Create survey failed:', data);
      showToast(data.message || 'Hata oluştu', 'error');
    }
  } catch (err) {
    console.error('Create survey error:', err);
    showToast(`Hata: ${err.message}`, 'error');
  }
}

function showUpdateSurveyModal() {
  if (!selectedSurvey) return;
  document.getElementById('updateSurveySlug').value =
    selectedSurvey.slug;
  document.getElementById('updateSurveyTitle').value =
    selectedSurvey.title;
  document
    .getElementById('updateSurveyModal')
    .classList.add('active');
}

async function updateSurvey() {
  if (!selectedSurvey) return;
  const slug = document
    .getElementById('updateSurveySlug')
    .value.trim();
  const title = document
    .getElementById('updateSurveyTitle')
    .value.trim();

  if (!slug || !title) {
    alert('Lütfen tüm alanları doldurun.');
    return;
  }

  const res = await fetchWithAuth(`/api/surveys/${selectedSurvey.id}`, {
    method: 'PUT',
    body: JSON.stringify({
      slug,
      title,
      isActive: selectedSurvey.is_active,
    }),
  });

  const data = await res.json();
  if (data.ok) {
    closeModal('updateSurveyModal');
    selectedSurvey.slug = slug;
    selectedSurvey.title = title;
    await loadSurveys();
    selectSurvey(selectedSurvey);
    showToast('Anket güncellendi!', 'success');
  } else {
    showToast(data.message || 'Hata oluştu', 'error');
  }
}

async function toggleSurveyActive() {
  if (!selectedSurvey) return;
  const isActive = document.getElementById('surveyActiveToggle')
    .checked;

  const res = await fetchWithAuth(`/api/surveys/${selectedSurvey.id}`, {
    method: 'PUT',
    body: JSON.stringify({
      slug: selectedSurvey.slug,
      title: selectedSurvey.title,
      isActive,
    }),
  });

  const data = await res.json();
  if (data.ok) {
    selectedSurvey.is_active = isActive;
    await loadSurveys();
  } else {
    alert('Durum değiştirilemedi');
    document.getElementById('surveyActiveToggle').checked = !isActive;
  }
}

async function deleteSurvey() {
  if (!selectedSurvey) return;
  if (
    !confirm(
      `"${selectedSurvey.title}" anketini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`
    )
  )
    return;

  const res = await fetchWithAuth(`/api/surveys/${selectedSurvey.id}`, {
    method: 'DELETE',
  });
  const data = await res.json();
  if (data.ok) {
    selectedSurvey = null;
    await loadSurveys();
    document.getElementById('noSurveyView').classList.add('active');
    document
      .getElementById('surveyManagementView')
      .classList.remove('active');
    document.getElementById('selectedSurveyText').textContent =
      'Anket Seçin';
    showToast('Anket silindi!', 'warning');
  } else {
    showToast('Anket silinemedi', 'error');
  }
}

async function showStatsModal() {
  if (!selectedSurvey) return;
  const res = await fetchWithAuth(`/api/surveys/${selectedSurvey.id}/stats`);
  const response = await res.json();
  const stats = response.ok ? response.data : {};

  document.getElementById('statsContent').innerHTML = `
        <div class="stat-card">
          <div class="stat-value">${stats.total_responses || 0}</div>
          <div class="stat-label">Toplam Yanıt</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${stats.total_questions || 0}</div>
          <div class="stat-label">Toplam Soru</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${stats.total_invitations || 0}</div>
          <div class="stat-label">Toplam Davetiye</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${stats.used_invitations || 0}</div>
          <div class="stat-label">Kullanılan Davetiye</div>
        </div>
      `;
  document.getElementById('statsModal').classList.add('active');
}

function exportSurveyData() {
  if (!selectedSurvey) return;
  window.location.href = `/api/surveys/${selectedSurvey.id}/export`;
}

async function showQuestionsView() {
  if (!selectedSurvey) return;

  // Load questions
  const res = await fetch(`/api/surveys/${selectedSurvey.slug}`);
  const response = await res.json();
  const data = response.ok ? response.data : { questions: [] };
  questions = data.questions.map((q) => ({
    id: q.id,
    section_id: q.section_id,
    ord: q.ord,
    label: q.label,
    type: q.type,
    required: !!q.required,
    options: q.options_json ? JSON.parse(q.options_json) : [],
    conditional_logic: q.conditional_logic
      ? JSON.parse(q.conditional_logic)
      : null,
  }));

  document
    .getElementById('surveyManagementView')
    .classList.remove('active');
  document.getElementById('questionsView').classList.add('active');

  renderQuestions();
}

function backToSurveyManagement() {
  document.getElementById('questionsView').classList.remove('active');
  document
    .getElementById('surveyManagementView')
    .classList.add('active');
}

function toggleSections() {
  const enabled = document.getElementById('sectionsToggle').checked;
  document.getElementById('addSectionBtn').style.display = enabled
    ? 'block'
    : 'none';
  document.getElementById('sectionTabs').style.display = enabled
    ? 'flex'
    : 'none';

  if (enabled) {
    renderSectionTabs();
  } else {
    currentSection = null;
  }
}

function renderSectionTabs() {
  const container = document.getElementById('sectionTabs');
  container.innerHTML = '';

  // "Tüm Sorular" tab
  const allTab = document.createElement('button');
  allTab.className =
    'section-tab' + (currentSection === null ? ' active' : '');
  allTab.textContent = 'Tüm Sorular';
  allTab.onclick = () => {
    currentSection = null;
    renderSectionTabs();
    renderQuestions();
  };
  container.appendChild(allTab);

  sections.forEach((sec) => {
    const tab = document.createElement('button');
    tab.className =
      'section-tab' +
      (currentSection && currentSection.id === sec.id
        ? ' active'
        : '');
    tab.innerHTML = `${sec.name} <span class="section-delete" onclick="deleteSection(${sec.id}); event.stopPropagation();">×</span>`;
    tab.onclick = () => {
      currentSection = sec;
      renderSectionTabs();
      renderQuestions();
    };
    container.appendChild(tab);
  });
}

function showAddSectionModal() {
  document.getElementById('newSectionName').value = '';
  document.getElementById('addSectionModal').classList.add('active');
}

async function createSection() {
  if (!selectedSurvey) return;
  const name = document.getElementById('newSectionName').value.trim();
  if (!name) {
    alert('Lütfen bölüm adı girin.');
    return;
  }

  const res = await fetchWithAuth(
    `/api/surveys/${selectedSurvey.id}/sections`,
    {
      method: 'POST',
      body: JSON.stringify({ name, ord: sections.length + 1 }),
    }
  );

  const data = await res.json();
  if (data.ok) {
    closeModal('addSectionModal');
    await loadSections();
    renderSectionTabs();
    showToast('Bölüm eklendi!', 'success');
  } else {
    showToast('Bölüm eklenemedi', 'error');
  }
}

async function deleteSection(sectionId) {
  if (
    !confirm(
      'Bu bölümü silmek istediğinizden emin misiniz? Bölümdeki sorular genel sorular listesine taşınacak.'
    )
  )
    return;

  const res = await fetchWithAuth(`/api/sections/${sectionId}`, {
    method: 'DELETE',
  });
  const data = await res.json();
  if (data.ok) {
    await loadSections();
    if (currentSection && currentSection.id === sectionId) {
      currentSection = null;
    }
    renderSectionTabs();
    renderQuestions();
  } else {
    alert('Bölüm silinemedi');
  }
}

function addQuestion() {
  const newQ = {
    id: 0,
    section_id: currentSection ? currentSection.id : null,
    ord: questions.length + 1,
    label: 'Yeni soru',
    type: 'text',
    required: false,
    options: [],
    conditional_logic: null,
  };
  questions.push(newQ);
  renderQuestions();
}

function showTemplatesModal() {
  document.getElementById('templatesModal').classList.add('active');
}

function applyTemplate(templateName) {
  const template = TEMPLATES[templateName];
  if (!template) return;

  const base = questions.length;
  template.forEach((t, i) => {
    questions.push({
      id: 0,
      section_id: currentSection ? currentSection.id : null,
      ord: base + i + 1,
      label: t.label,
      type: t.type,
      required: t.required,
      options: t.options || [],
      conditional_logic: null,
    });
  });

  closeModal('templatesModal');
  renderQuestions();
}

function renderQuestions() {
  const container = document.getElementById('questionsContainer');
  container.innerHTML = '';

  // Filter questions by current section
  let filteredQuestions = questions;
  if (
    document.getElementById('sectionsToggle').checked &&
    currentSection
  ) {
    filteredQuestions = questions.filter(
      (q) => q.section_id === currentSection.id
    );
  } else if (
    document.getElementById('sectionsToggle').checked &&
    currentSection === null
  ) {
    // Show all questions
    filteredQuestions = questions;
  }

  if (filteredQuestions.length === 0) {
    container.innerHTML =
      '<div class="empty-state"><div class="empty-state-icon">📝</div><p>Henüz soru eklenmedi. "+ Soru Ekle" butonuna tıklayın.</p></div>';
    return;
  }

  filteredQuestions.forEach((q, idx) => {
    const card = document.createElement('div');
    card.className = 'question-card';
    card.draggable = true;
    card.dataset.index = questions.indexOf(q);

    card.ondragstart = (e) => {
      draggedIndex = parseInt(e.target.dataset.index);
      e.target.classList.add('dragging');
    };
    card.ondragend = (e) => {
      e.target.classList.remove('dragging');
    };
    card.ondragover = (e) => e.preventDefault();
    card.ondrop = (e) => {
      e.preventDefault();
      const dropIndex = parseInt(e.currentTarget.dataset.index);
      if (draggedIndex === dropIndex || draggedIndex === null) return;

      const [moved] = questions.splice(draggedIndex, 1);
      questions.splice(dropIndex, 0, moved);
      questions = questions.map((qq, i) => ({ ...qq, ord: i + 1 }));
      draggedIndex = null;
      renderQuestions();
    };

    card.innerHTML = `
          <div class="question-header">
            <div style="display: flex; align-items: center; gap: 8px;">
              <input 
                type="number" 
                min="1" 
                value="${q.ord}" 
                style="width: 60px; padding: 4px 8px; border: 2px solid #e5e7eb; border-radius: 8px; font-weight: 600;"
                onchange="updateQuestionOrder(${questions.indexOf(q)}, parseInt(this.value))"
                onclick="event.stopPropagation()"
              />
              <span style="color: #6b7280; font-size: 12px;">Sıra No</span>
            </div>
            <div class="question-actions">
              <button class="btn btn-outline" style="padding: 6px 12px; font-size: 13px;" onclick="editQuestion(${questions.indexOf(
                q
              )})">✏️ Düzenle</button>
              <button class="btn btn-danger" style="padding: 6px 12px; font-size: 13px;" onclick="deleteQuestion(${questions.indexOf(
                q
              )})">🗑️</button>
            </div>
          </div>
          <div style="margin: 12px 0;">
            <strong>${q.label}</strong>
            ${
              q.required
                ? '<span class="badge badge-danger" style="margin-left: 8px;">Zorunlu</span>'
                : ''
            }
          </div>
          <div style="font-size: 13px; color: #6b7280;">
            Tip: <strong>${q.type}</strong>
            ${
              q.options && q.options.length > 0
                ? ` | Seçenekler: ${q.options.length}`
                : ''
            }
            ${
              q.conditional_logic
                ? ' | <span style="color: #667eea;">Koşullu Yönlendirme Var</span>'
                : ''
            }
          </div>
        `;

    container.appendChild(card);
  });
}

function editQuestion(index) {
  editingQuestionIndex = index;
  const q = questions[index];

  document.getElementById('editQuestionLabel').value = q.label;
  document.getElementById('editQuestionType').value = q.type;
  document.getElementById('editQuestionOptions').value = (
    q.options || []
  ).join(', ');
  document.getElementById('editQuestionRequired').checked = q.required;

  updateQuestionTypeFields();
  renderConditionalLogic(q.conditional_logic);

  document.getElementById('editQuestionModal').classList.add('active');
}

function updateQuestionTypeFields() {
  const type = document.getElementById('editQuestionType').value;
  const optionsGroup = document.getElementById('optionsGroup');
  optionsGroup.style.display = ['single', 'multiple', 'likert'].includes(
    type
  )
    ? 'block'
    : 'none';
}

function renderConditionalLogic(logic) {
  const container = document.getElementById(
    'conditionalLogicContainer'
  );
  container.innerHTML = '';

  if (!logic || !logic.rules || logic.rules.length === 0) {
    container.innerHTML =
      '<p style="font-size: 13px; color: #9ca3af;">Henüz koşul eklenmedi.</p>';
    return;
  }

  logic.rules.forEach((rule, idx) => {
    const ruleDiv = document.createElement('div');
    ruleDiv.style.cssText =
      'background: #f9fafb; padding: 12px; border-radius: 8px; margin-bottom: 8px;';
    ruleDiv.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="font-size: 13px;">
              Eğer yanıt: <strong>${rule.answer}</strong> ise → <strong>Soru ${rule.nextQuestionOrd}</strong>'a git
            </div>
            <button class="btn btn-danger" style="padding: 4px 8px; font-size: 12px;" onclick="removeConditionalRule(${idx})">Sil</button>
          </div>
        `;
    container.appendChild(ruleDiv);
  });
}

function addConditionalRule() {
  const q = questions[editingQuestionIndex];
  if (!q.conditional_logic) {
    q.conditional_logic = { rules: [] };
  }

  const answer = prompt('Hangi yanıt için koşul eklensin?');
  if (!answer) return;

  const nextOrd = prompt(
    'Bu yanıt verildiğinde hangi soru sırasına gidilsin?'
  );
  if (!nextOrd) return;

  q.conditional_logic.rules.push({
    answer,
    nextQuestionOrd: parseInt(nextOrd),
  });
  renderConditionalLogic(q.conditional_logic);
}

function removeConditionalRule(index) {
  const q = questions[editingQuestionIndex];
  if (q.conditional_logic && q.conditional_logic.rules) {
    q.conditional_logic.rules.splice(index, 1);
    renderConditionalLogic(q.conditional_logic);
  }
}

function saveQuestionEdit() {
  const q = questions[editingQuestionIndex];
  q.label = document.getElementById('editQuestionLabel').value.trim();
  q.type = document.getElementById('editQuestionType').value;
  q.required = document.getElementById('editQuestionRequired').checked;

  if (['single', 'multiple', 'likert'].includes(q.type)) {
    const optionsText =
      document.getElementById('editQuestionOptions').value;
    q.options = optionsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  } else {
    q.options = [];
  }

  closeModal('editQuestionModal');
  renderQuestions();
}

function deleteQuestion(index) {
  if (!confirm('Bu soruyu silmek istediğinizden emin misiniz?'))
    return;
  questions.splice(index, 1);
  questions = questions.map((q, i) => ({ ...q, ord: i + 1 }));
  renderQuestions();
}

async function saveQuestions() {
  if (!selectedSurvey) {
    alert('Önce bir anket seçin.');
    return;
  }

  const payload = questions.map((q, i) => ({
    id: q.id || 0,
    section_id: q.section_id || null,
    ord: i + 1,
    label: q.label || '',
    type: q.type,
    required: !!q.required,
    options_json:
      q.options && q.options.length
        ? JSON.stringify(q.options)
        : null,
    conditional_logic:
      q.conditional_logic &&
      q.conditional_logic.rules &&
      q.conditional_logic.rules.length
        ? JSON.stringify(q.conditional_logic)
        : null,
  }));

  const res = await fetchWithAuth('/api/questions/bulk', {
    method: 'POST',
    body: JSON.stringify({ surveyId: selectedSurvey.id, items: payload }),
  });

  const data = await res.json();
  if (data.ok) {
    showToast('Sorular başarıyla kaydedildi!', 'success');
    await showQuestionsView(); // Reload questions
  } else {
    showToast(
      'Hata: ' + (data.message || 'Sorular kaydedilemedi'),
      'error',
    );
  }
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('active');
}

// Close modal on outside click
document.querySelectorAll('.modal').forEach((modal) => {
  modal.addEventListener('click', function (e) {
    if (e.target === modal) {
      modal.classList.remove('active');
    }
  });
});

// Expose functions to window for inline onclick handlers
window.showToast = showToast;
window.handleLogin = handleLogin;
window.handleLogout = handleLogout;
window.toggleDropdown = toggleDropdown;
window.showNewSurveyModal = showNewSurveyModal;
window.createSurvey = createSurvey;
window.showUpdateSurveyModal = showUpdateSurveyModal;
window.updateSurvey = updateSurvey;
window.toggleSurveyActive = toggleSurveyActive;
window.deleteSurvey = deleteSurvey;
window.showStatsModal = showStatsModal;
window.exportSurveyData = exportSurveyData;
window.showQuestionsView = showQuestionsView;
window.backToSurveyManagement = backToSurveyManagement;
window.toggleSections = toggleSections;
window.showAddSectionModal = showAddSectionModal;
window.createSection = createSection;
window.deleteSection = deleteSection;
window.addQuestion = addQuestion;
window.showTemplatesModal = showTemplatesModal;
window.applyTemplate = applyTemplate;
window.saveQuestions = saveQuestions;
window.closeModal = closeModal;
window.editQuestion = editQuestion;
window.deleteQuestion = deleteQuestion;
window.updateQuestionTypeFields = updateQuestionTypeFields;
window.addConditionalRule = addConditionalRule;
window.removeConditionalRule = removeConditionalRule;
window.saveQuestionEdit = saveQuestionEdit;
window.showInviteModal = showInviteModal;
window.sendInvitations = sendInvitations;
window.updateQuestionOrder = updateQuestionOrder;

// ========== Davetiye Gönderme ==========

function showInviteModal() {
  if (!selectedSurvey) {
    showToast('Lütfen önce bir anket seçin', 'error');
    return;
  }
  document.getElementById('inviteEmails').value = '';
  document.getElementById('inviteMessage').value = '';
  document.getElementById('inviteModal').classList.add('active');
}

async function sendInvitations() {
  if (!selectedSurvey) return;

  const emailsText = document.getElementById('inviteEmails').value.trim();
  const message = document.getElementById('inviteMessage').value.trim();

  if (!emailsText) {
    showToast('Lütfen en az bir e-posta adresi girin', 'error');
    return;
  }

  const emails = emailsText
    .split('\n')
    .map((e) => e.trim())
    .filter((e) => e.length > 0);

  if (emails.length === 0) {
    showToast('Geçerli e-posta adresi bulunamadı', 'error');
    return;
  }

  try {
    const res = await fetchWithAuth(
      `/api/surveys/${selectedSurvey.id}/invitations`,
      {
        method: 'POST',
        body: JSON.stringify({ emails, message: message || undefined }),
      },
    );

    const data = await res.json();
    if (data.ok) {
      closeModal('inviteModal');
      showToast(
        `${data.data.sent} davetiye başarıyla gönderildi!`,
        'success',
      );
      // Reload survey to update stats
      await loadSurveys();
      const updatedSurvey = surveys.find((s) => s.id === selectedSurvey.id);
      if (updatedSurvey) {
        selectedSurvey = updatedSurvey;
        document.getElementById('statTotalInvitations').textContent =
          updatedSurvey.total_invitations || 0;
      }
    } else {
      showToast(data.message || 'Davetiye gönderilemedi', 'error');
    }
  } catch (err) {
    console.error('Send invitations error:', err);
    showToast(`Hata: ${err.message}`, 'error');
  }
}

// ========== Soru Sıralama ==========

function updateQuestionOrder(questionIndex, newOrder) {
  if (newOrder < 1 || newOrder > questions.length) {
    showToast(
      `Sıra numarası 1 ile ${questions.length} arasında olmalıdır`,
      'error',
    );
    renderQuestions();
    return;
  }

  const question = questions[questionIndex];
  const oldOrder = question.ord;

  if (oldOrder === newOrder) return;

  // Remove question from current position
  questions.splice(questionIndex, 1);

  // Insert at new position (newOrder-1 because array is 0-indexed)
  questions.splice(newOrder - 1, 0, question);

  // Renumber all questions
  questions = questions.map((q, i) => ({ ...q, ord: i + 1 }));

  renderQuestions();
  showToast('Sıra güncellendi. "Kaydet" butonuna tıklayın.', 'success');
}

