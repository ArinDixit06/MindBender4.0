// File: dashboard.js (Complete and Final Code)
document.addEventListener('DOMContentLoaded', () => {
    const API_URL = "http://localhost:5000";
    
    // State variables
    let userInfo = null, studentInfo = null, player = {}, subjects = [], quests = [], customSubjects = JSON.parse(localStorage.getItem('customSubjects')) || [];

    // DOM Elements
    const levelDisplay = document.getElementById('player-level'), xpText = document.getElementById('xp-text'), xpBar = document.getElementById('xp-bar');
    const questTitleInput = document.getElementById('quest-title'), questSubjectSelect = document.getElementById('quest-subject'), questChapterInput = document.getElementById('quest-chapter'), questTopicInput = document.getElementById('quest-topic'), questDueDateInput = document.getElementById('quest-due-date'), questImportanceSelect = document.getElementById('quest-importance'), addQuestBtn = document.getElementById('add-quest-btn'), questListDiv = document.getElementById('quest-list');
    const profileButton = document.getElementById('profile-button'), profileModal = document.getElementById('profile-modal'), closeModalButton = document.querySelector('.close-button'), subjectListDiv = document.getElementById('subject-list'), newSubjectInput = document.getElementById('new-subject-input'), addSubjectModalBtn = document.getElementById('add-subject-modal-btn');
    const filterBtn = document.getElementById('filter-btn'), filterPanel = document.getElementById('filter-panel'), filterSubject = document.getElementById('filter-subject'), filterImportance = document.getElementById('filter-importance'), filterStatus = document.getElementById('filter-status');

    async function init() {
        try {
            const meResponse = await fetch(`${API_URL}/api/me`, { credentials: 'include' });
            if (!meResponse.ok) {
                window.location.href = 'login.html';
                return;
            }
            const meData = await meResponse.json();
            userInfo = meData.loggedInUser;
            studentInfo = meData.studentInfo;
            player = { level: studentInfo?.level || 1, xp: studentInfo?.total_xp || 0, xpToNextLevel: 100 * (studentInfo?.level || 1) };
            
            displayStudentInfo();
            await loadSubjects();
            await loadQuests();
            updateUI();
            setupEventListeners();
        } catch (error) {
            console.error("Initialization Error:", error);
            window.location.href = 'login.html';
        }
    }

    function displayStudentInfo() {
        if (studentInfo) {
            document.getElementById('student-name').textContent = studentInfo.name || userInfo.email.split('@')[0];
            document.getElementById('student-board').textContent = studentInfo.board + ' Board';
            document.getElementById('student-class').textContent = `Class ${studentInfo.class}`;
            document.getElementById('profile-name').textContent = studentInfo.name || userInfo.email.split('@')[0];
            document.getElementById('profile-email').textContent = userInfo.email;
            document.getElementById('profile-board').textContent = studentInfo.board;
            document.getElementById('profile-class').textContent = studentInfo.class;
            document.getElementById('profile-stream').textContent = studentInfo.stream || 'N/A';
            document.getElementById('profile-id').textContent = userInfo.student_id;
        }
    }

    async function loadSubjects() {
        try {
            const res = await fetch(`${API_URL}/api/subjects/${studentInfo?.class}/${studentInfo?.stream || ''}`);
            if (res.ok) {
                subjects = await res.json();
                subjects = [...subjects, ...customSubjects];
                populateSubjectsDropdown();
                populateFilterDropdown();
            }
        } catch (err) { console.error('Error loading subjects:', err); }
    }

    async function loadQuests() {
        try {
            const res = await fetch(`${API_URL}/quests`, { credentials: 'include' });
            if (res.ok) {
                quests = await res.json();
                renderQuests();
                updateQuestStats();
                updateWeeklyStats();
            }
        } catch (err) { console.error('Error loading quests:', err); }
    }

    function updateUI() {
        levelDisplay.textContent = `Level ${player.level}`;
        const xpForCurrentLevel = player.xp - (100 * (player.level - 1));
        player.xpToNextLevel = 100 * player.level;
        const xpPercentage = (xpForCurrentLevel / 100) * 100;
        xpBar.style.width = `${xpPercentage}%`;
        xpText.textContent = `${xpForCurrentLevel} / 100 XP`;
        renderSubjectsInModal();
    }

    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, 2500);
    }

    function showLevelUpNotification() {
        const notification = document.createElement('div');
        notification.className = 'level-up-notification';
        notification.innerHTML = `<h2>🎉 LEVEL UP!</h2><p>You reached Level ${player.level}!</p>`;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }

    function renderQuests() {
        questListDiv.innerHTML = '';
        let filteredQuests = [...quests];
        if (filterSubject.value) filteredQuests = filteredQuests.filter(q => q.subject === filterSubject.value);
        if (filterImportance.value) filteredQuests = filteredQuests.filter(q => q.importance === filterImportance.value);
        if (filterStatus.value === 'pending') filteredQuests = filteredQuests.filter(q => !q.completed);
        else if (filterStatus.value === 'completed') filteredQuests = filteredQuests.filter(q => q.completed);
        
        filteredQuests.sort((a, b) => {
            if (!a.completed && b.completed) return -1; if (a.completed && !b.completed) return 1;
            const dateA = new Date(a.due_date || '9999-12-31'), dateB = new Date(b.due_date || '9999-12-31');
            return dateA - dateB;
        });
        
        if (filteredQuests.length === 0) {
            questListDiv.innerHTML = '<p class="no-quests">No quests found. Create one to begin your adventure!</p>';
            return;
        }
        filteredQuests.forEach(quest => questListDiv.appendChild(createQuestCard(quest)));
    }

    function createQuestCard(quest) {
        const dueDate = quest.due_date ? new Date(quest.due_date) : null;
        const today = new Date(); today.setHours(0, 0, 0, 0);
        let dueDateClass = '', dueDateText = 'No due date';
        if (dueDate) {
            const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
            if (daysUntilDue < 0) { dueDateClass = 'overdue'; dueDateText = `Overdue by ${Math.abs(daysUntilDue)} days`; }
            else if (daysUntilDue === 0) { dueDateClass = 'due-today'; dueDateText = 'Due today!'; }
            else if (daysUntilDue <= 3) { dueDateClass = 'due-soon'; dueDateText = `Due in ${daysUntilDue} days`; }
            else { dueDateText = dueDate.toLocaleDateString(); }
        }
        const questCard = document.createElement('div');
        questCard.className = `quest-card importance-${quest.importance} ${quest.completed ? 'completed' : ''}`;
        questCard.innerHTML = `
            <div class="quest-header"><h3>${quest.title}</h3><span class="xp-badge">${quest.xp_value} XP</span></div>
            <div class="quest-details">
                ${quest.subject ? `<p><i class="fas fa-book"></i> ${quest.subject}</p>` : ''}
                ${quest.chapter ? `<p><i class="fas fa-bookmark"></i> Chapter: ${quest.chapter}</p>` : ''}
                ${quest.topic ? `<p><i class="fas fa-tag"></i> Topic: ${quest.topic}</p>` : ''}
                <p class="due-date ${dueDateClass}"><i class="fas fa-calendar"></i> ${dueDateText}</p>
            </div>
            <div class="quest-actions">
                ${!quest.completed ? `<button class="complete-quest-btn" data-id="${quest.id}"><i class="fas fa-check"></i> Complete</button>` : `<span class="completed-badge"><i class="fas fa-trophy"></i> Completed!</span>`}
                <button class="delete-quest-btn" data-id="${quest.id}"><i class="fas fa-trash"></i></button>
            </div>`;
        const completeBtn = questCard.querySelector('.complete-quest-btn');
        if (completeBtn) completeBtn.addEventListener('click', () => completeQuest(quest.id));
        questCard.querySelector('.delete-quest-btn').addEventListener('click', () => deleteQuest(quest.id));
        return questCard;
    }

    async function addQuest() {
        const questData = { title: questTitleInput.value.trim(), subject: questSubjectSelect.value, chapter: questChapterInput.value.trim(), topic: questTopicInput.value.trim(), dueDate: questDueDateInput.value, importance: questImportanceSelect.value };
        if (!questData.title) return alert('Please enter a quest title!');
        try {
            const res = await fetch(`${API_URL}/quests`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(questData) });
            if (res.ok) {
                questTitleInput.value = ''; questChapterInput.value = ''; questTopicInput.value = ''; questDueDateInput.value = ''; questSubjectSelect.value = '';
                await loadQuests();
                showNotification('Quest added successfully!', 'success');
            } else { const error = await res.json(); alert('Error: ' + error.error); }
        } catch (err) { console.error('Error adding quest:', err); }
    }

    async function completeQuest(questId) {
        try {
            const res = await fetch(`${API_URL}/quests/${questId}/complete`, { method: 'PUT', credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                player.xp = data.total_xp;
                if (data.level > player.level) {
                    player.level = data.level;
                    showLevelUpNotification();
                }
                showNotification(`+${data.xp_earned} XP earned!`, 'xp');
                await loadQuests();
                updateUI();
            }
        } catch (err) { console.error('Error completing quest:', err); }
    }

    async function deleteQuest(questId) {
        if (!confirm('Are you sure you want to delete this quest?')) return;
        try {
            const res = await fetch(`${API_URL}/quests/${questId}`, { method: 'DELETE', credentials: 'include' });
            if (res.ok) {
                await loadQuests();
                showNotification('Quest deleted', 'info');
            }
        } catch (err) { console.error('Error deleting quest:', err); }
    }

    function updateQuestStats() {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const activeQuests = quests.filter(q => !q.completed);
        document.getElementById('active-count').textContent = activeQuests.length;
        document.getElementById('today-count').textContent = activeQuests.filter(q => q.due_date && new Date(q.due_date).getTime() === today.getTime()).length;
        document.getElementById('overdue-count').textContent = activeQuests.filter(q => q.due_date && new Date(q.due_date) < today).length;
    }

    function updateWeeklyStats() {
        const oneWeekAgo = new Date(); oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const weeklyQuests = quests.filter(q => q.completed_at && new Date(q.completed_at) >= oneWeekAgo);
        document.getElementById('weekly-quests').textContent = weeklyQuests.length;
        document.getElementById('weekly-xp').textContent = weeklyQuests.reduce((sum, q) => sum + (q.xp_value || 0), 0);
    }

    function renderSubjectsInModal() {
        subjectListDiv.innerHTML = customSubjects.length === 0 ? '<p>No custom subjects.</p>' : '';
        customSubjects.forEach((subject, index) => {
            const item = document.createElement('div');
            item.className = 'subject-item';
            item.innerHTML = `<span>${subject}</span><button class="delete-subject-btn" data-index="${index}">Delete</button>`;
            subjectListDiv.appendChild(item);
        });
        document.querySelectorAll('.delete-subject-btn').forEach(btn => btn.addEventListener('click', e => deleteSubject(e.target.dataset.index)));
    }

    function addSubjectFromModal() {
        const newSubject = newSubjectInput.value.trim();
        if (newSubject && !subjects.includes(newSubject)) {
            customSubjects.push(newSubject);
            subjects.push(newSubject);
            localStorage.setItem('customSubjects', JSON.stringify(customSubjects));
            newSubjectInput.value = '';
            populateSubjectsDropdown(); populateFilterDropdown(); renderSubjectsInModal();
        } else if (subjects.includes(newSubject)) alert('Subject already exists!');
    }

    function deleteSubject(index) {
        const subject = customSubjects[index];
        if (confirm(`Delete "${subject}"?`)) {
            customSubjects.splice(index, 1);
            subjects = subjects.filter(s => s !== subject);
            localStorage.setItem('customSubjects', JSON.stringify(customSubjects));
            populateSubjectsDropdown(); populateFilterDropdown(); renderSubjectsInModal();
        }
    }
    
    function populateSubjectsDropdown() {
        const options = subjects.map(s => `<option value="${s}">${s}</option>`).join('');
        questSubjectSelect.innerHTML = `<option value="">Select Subject</option>${options}`;
    }

    function populateFilterDropdown() {
        const options = subjects.map(s => `<option value="${s}">${s}</option>`).join('');
        filterSubject.innerHTML = `<option value="">All Subjects</option>${options}`;
    }

    function setupEventListeners() {
        addQuestBtn.addEventListener('click', addQuest);
        profileButton.addEventListener('click', () => profileModal.style.display = 'flex');
        closeModalButton.addEventListener('click', () => profileModal.style.display = 'none');
        addSubjectModalBtn.addEventListener('click', addSubjectFromModal);
        filterBtn.addEventListener('click', () => filterPanel.style.display = filterPanel.style.display === 'none' ? 'flex' : 'none');
        [filterSubject, filterImportance, filterStatus].forEach(el => el.addEventListener('change', renderQuests));
        document.querySelector('.logout-link').addEventListener('click', async e => {
            e.preventDefault();
            await fetch(`${API_URL}/logout`, { method: 'POST', credentials: 'include' });
            localStorage.clear();
            window.location.href = 'login.html';
        });
        window.addEventListener('click', e => { if (e.target === profileModal) profileModal.style.display = 'none'; });
    }

    init();
});