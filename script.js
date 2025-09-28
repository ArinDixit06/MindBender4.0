document.addEventListener('DOMContentLoaded', () => {
  let player = {
    level: 9,
    xp: 250,
    xpToNextLevel: 400,
  };

  let streakData = JSON.parse(localStorage.getItem('streakData')) || {};
  let subjects = JSON.parse(localStorage.getItem('subjects')) || [];

  const levelDisplay = document.getElementById('player-level');
  const levelNumber = document.getElementById('level-number');
  const xpText = document.getElementById('xp-text');
  const xpBar = document.getElementById('xp-bar');
  const firstQuestBadge = document.getElementById('quest-badge-1');

  const questTitleInput = document.getElementById('quest-title');
  const questDueDateInput = document.getElementById('quest-due-date');
  const questSubjectSelect = document.getElementById('quest-subject');
  const questImportanceSelect = document.getElementById('quest-importance');
  const addQuestBtn = document.getElementById('add-quest-btn');
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

  function updateUI() {
    levelDisplay.textContent = `Level ${player.level}`;
    levelNumber.textContent = player.level;
    const xpPercentage = (player.xp / player.xpToNextLevel) * 100;
    xpBar.style.width = `${xpPercentage}%`;
    xpText.textContent = `${player.xp} / ${player.xpToNextLevel} XP`;
    populateSubjectsDropdown();
    renderQuests();
    renderSubjectsInModal();
    renderCalendar();
  }

  function addXp(amount) {
    player.xp += amount;
    if (player.xp >= player.xpToNextLevel) {
      player.level++;
      player.xp -= player.xpToNextLevel;
      player.xpToNextLevel = Math.floor(player.xpToNextLevel * 1.5);
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

  let quests = JSON.parse(localStorage.getItem('quests')) || [];
  function saveQuests() { localStorage.setItem('quests', JSON.stringify(quests)); }
  function saveSubjects() { localStorage.setItem('subjects', JSON.stringify(subjects)); }
  function populateSubjectsDropdown() {
    questSubjectSelect.innerHTML = '<option value="">Select Subject</option>';
    subjects.forEach(subject => {
      const option = document.createElement('option');
      option.value = subject;
      option.textContent = subject;
      questSubjectSelect.appendChild(option);
    });
  }
  function renderQuests() {
    questListDiv.innerHTML = '';
    quests.forEach((quest, index) => {
      const questCard = document.createElement('div');
      questCard.classList.add('quest-card');
      questCard.innerHTML = `
        <h3>Quest: ${quest.title}</h3>
        <p>Due: ${quest.dueDate || 'N/A'}</p>
        <p>Subject: ${quest.subject || 'N/A'}</p>
        <p>Importance: ${quest.importance || 'N/A'}</p>
        <button class="complete-quest-btn" data-index="${index}">Complete Quest</button>
      `;
      questListDiv.appendChild(questCard);
    });
    document.querySelectorAll('.complete-quest-btn').forEach(button => {
      button.addEventListener('click', event => {
        const index = event.target.dataset.index;
        completeQuest(index);
      });
    });
  }
  function addQuest() {
    const title = questTitleInput.value.trim();
    const dueDate = questDueDateInput.value;
    const subject = questSubjectSelect.value;
    const importance = questImportanceSelect.value;
    if (title) {
      quests.push({ title, dueDate, subject, importance, completed: false });
      saveQuests();
      questTitleInput.value = '';
      questDueDateInput.value = '';
      questSubjectSelect.value = '';
      questImportanceSelect.value = 'medium';
      updateUI();
    }
  }
  function completeQuest(index) {
    if (quests[index]) {
      addXp(25);
      updateStreak(new Date(), 'completed');
      quests.splice(index, 1);
      saveQuests();
      updateUI();
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

  addQuestBtn.addEventListener('click', addQuest);
  // Profile modal logic with badge button only
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

  // Logout via navbar
  document.querySelectorAll('.logout-link').forEach(el => el.addEventListener('click', () => {
    localStorage.removeItem("loggedInUser");
    window.location.href = "login.html";
  }));

  updateUI();
});
