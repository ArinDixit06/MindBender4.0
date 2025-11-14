document.addEventListener('DOMContentLoaded', async () => {
  // The session check, logout, and initial role-based redirection are now handled by auth_check.js
  // This script will focus on dashboard-specific functionalities.

  // Fetch session data from localStorage (set by auth.js on login)
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  const currentSchool = JSON.parse(localStorage.getItem('currentSchool'));

  if (!currentUser) {
      // If currentUser is not in localStorage, auth_check.js should have redirected.
      // This is a fallback, though ideally auth_check.js handles it.
      window.location.href = "login.html";
      return;
  }

  const user = currentUser;
  const school = currentSchool;

  let player = {
    level: user.level,
    xp: user.xp,
    xpToNextLevel: calculateXpForLevel(user.level + 1),
  };

  let streakData = JSON.parse(localStorage.getItem('streakData')) || {};
  let subjects = JSON.parse(localStorage.getItem('subjects')) || [];

  const levelDisplay = document.getElementById('player-level');
  const levelNumber = document.getElementById('level-number');
  const xpText = document.getElementById('xp-text');
  const xpBar = document.getElementById('xp-bar');
  const firstQuestBadge = document.getElementById('quest-badge-1');

  const questSearchInput = document.getElementById('quest-search-input');
  const searchQuestsBtn = document.getElementById('search-quests-btn');
  const questListDiv = document.getElementById('quest-list');

  const profileButton = document.getElementById('profile-button');
  const profileModal = document.getElementById('profile-modal');
  const closeModalButton = document.querySelector('.close-button');
  const subjectListDiv = document.getElementById('subject-list');
  const newSubjectInput = document.getElementById('new-subject-input');
  const addSubjectModalBtn = document.getElementById('add-subject-modal-btn');

  const calendarDays = document.getElementById('calendar-days');
  const currentMonthSpan = document.getElementById('current-month');
  const prevMonthBtn = document.getElementById('prev-month');
  const nextMonthBtn = document.getElementById('next-month');

  let currentDate = new Date();
  let currentMonth = currentDate.getMonth();
  let currentYear = currentDate.getFullYear();

  function calculateXpForLevel(level) {
    return 100 * level; // Match server-side logic
  }

  function updateUI() {
    levelDisplay.textContent = `Level ${player.level}`;
    levelNumber.textContent = player.level;
    const xpPercentage = (player.xp / player.xpToNextLevel) * 100;
    xpBar.style.width = `${xpPercentage}%`;
    xpText.textContent = `${player.xp} / ${player.xpToNextLevel} XP`;

    fetchAndRenderQuests();
    renderSubjectsInModal();
    renderCalendar();
  }

  function addXp(amount) {
    player.xp += amount;
    if (player.xp >= player.xpToNextLevel) {
      player.level++;
      player.xp -= player.xpToNextLevel;
      player.xpToNextLevel = calculateXpForLevel(player.level + 1);
    }
    if (!firstQuestBadge.classList.contains('unlocked')) {
      firstQuestBadge.classList.add('unlocked');
    }
    updateUI();
  }

  function renderCalendar() {
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    calendarDays.innerHTML = '';
    for (let i = 0; i < firstDay; i++) {
      const emptyDay = document.createElement('div');
      emptyDay.classList.add('day', 'empty');
      calendarDays.appendChild(emptyDay);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const dayElement = document.createElement('div');
      dayElement.classList.add('day');
      dayElement.textContent = day;
      const dateKey = `${currentYear}-${currentMonth + 1}-${day}`;
      if (streakData[dateKey]) {
        if (streakData[dateKey] === 'completed') dayElement.classList.add('completed');
        else if (streakData[dateKey] === 'missed') dayElement.classList.add('missed');
      }
      if (day === currentDate.getDate() &&
          currentMonth === currentDate.getMonth() &&
          currentYear === currentDate.getFullYear()) {
        dayElement.classList.add('today');
      }
      calendarDays.appendChild(dayElement);
    }
    const monthNames = ['January','February','March','April','May','June',
      'July','August','September','October','November','December'];
    currentMonthSpan.textContent = `${monthNames[currentMonth]} ${currentYear}`;
  }
  function updateStreak(date, status) {
    const dateKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    streakData[dateKey] = status;
    localStorage.setItem('streakData', JSON.stringify(streakData));
    renderCalendar();
  }

  function saveSubjects() { localStorage.setItem('subjects', JSON.stringify(subjects)); }

  async function fetchAndRenderQuests(searchQuery = '') {
    questListDiv.innerHTML = '<p>Loading quests...</p>';
    try {
      const url = searchQuery ? `/api/quests?search=${encodeURIComponent(searchQuery)}` : `/api/quests`; // Use relative path
      const res = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
      });

      console.log("Raw API response:", res);

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const responseData = await res.json();
      console.log("Parsed API response data:", responseData);
      const { quests } = responseData;
      console.log("Quests array:", quests);
      renderQuests(quests);
    } catch (error) {
      console.error("Error fetching quests:", error);
      questListDiv.innerHTML = '<p>Failed to load quests. Please try again.</p>';
    }
  }

  function renderQuests(quests) {
    questListDiv.innerHTML = '';
    if (quests.length === 0) {
      questListDiv.innerHTML = '<p>No quests found.</p>';
      return;
    }
    quests.forEach(quest => {
      const questCard = document.createElement('div');
      questCard.classList.add('quest-card');
      questCard.innerHTML = `
        <h3>Quest: ${quest.title}</h3>
        <p>Due: ${new Date(quest.due_date).toLocaleDateString() || 'N/A'}</p>
        <p>Subject: ${quest.subject || 'N/A'}</p>
        <p>Importance: ${quest.importance || 'N/A'}</p>
        <p>XP Reward: ${quest.xp_reward || 0}</p>
        <button class="complete-quest-btn" data-id="${quest.quest_id}">Complete Quest</button>
      `;
      questListDiv.appendChild(questCard);
    });
    document.querySelectorAll('.complete-quest-btn').forEach(button => {
      button.addEventListener('click', event => {
        const questId = event.target.dataset.id;
        completeQuest(questId);
      });
    });
  }

  async function completeQuest(questId) {
    try {
      const res = await fetch(`/api/quests/${questId}/complete`, { // Use relative path
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      alert(data.message);
      fetchAndRenderQuests(questSearchInput.value.trim());
      await fetchPlayerStats();
      updateUI();
    } catch (error) {
      console.error("Error completing quest:", error);
      alert("Failed to complete quest: " + error.message);
    }
  }

  function openProfileModal() {
    profileModal.style.display = 'block';
    renderSubjectsInModal();
  }
  function closeProfileModal() { profileModal.style.display = 'none'; }
  function renderSubjectsInModal() {
    subjectListDiv.innerHTML = '';
    if (subjects.length === 0) {
      subjectListDiv.innerHTML = '<p>No subjects added yet.</p>';
      return;
    }
    subjects.forEach((subject, index) => {
      const subjectItem = document.createElement('div');
      subjectItem.classList.add('subject-item');
      subjectItem.innerHTML = `
        <span>${subject}</span>
        <button class="delete-subject-btn" data-index="${index}">Delete</button>
      `;
      subjectListDiv.appendChild(subjectItem);
    });
    document.querySelectorAll('.delete-subject-btn').forEach(button => {
      button.addEventListener('click', event => {
        const index = event.target.dataset.index;
        deleteSubject(index);
      });
    });
  }
  function addSubjectFromModal() {
    const newSubject = newSubjectInput.value.trim();
    if (newSubject && !subjects.includes(newSubject)) {
      subjects.push(newSubject);
      saveSubjects();
      newSubjectInput.value = '';
      updateUI();
    } else if (subjects.includes(newSubject)) {
      alert('Subject already exists!');
    }
  }

  function deleteSubject(index) {
    if (confirm(`Are you sure you want to delete "${subjects[index]}"?`)) {
      subjects.splice(index, 1);
      saveSubjects();
      updateUI();
    }
  }

  searchQuestsBtn.addEventListener('click', () => {
    const searchQuery = questSearchInput.value.trim();
    fetchAndRenderQuests(searchQuery);
  });

  profileButton.addEventListener('click', openProfileModal);
  closeModalButton.addEventListener('click', closeProfileModal);
  addSubjectModalBtn.addEventListener('click', addSubjectFromModal);

  prevMonthBtn.addEventListener('click', () => {
    currentMonth--;
    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear--;
    }
    renderCalendar();
  });
  nextMonthBtn.addEventListener('click', () => {
    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
    renderCalendar();
  });
  window.addEventListener('click', event => {
    if (event.target === profileModal) closeProfileModal();
  });

  updateUI();
});
