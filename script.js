document.addEventListener('DOMContentLoaded', () => {
    // Player Stats
    let player = {
        level: 1,
        xp: 0,
        xpToNextLevel: 100,
    };

    // Subjects
    let subjects = JSON.parse(localStorage.getItem('subjects')) || []; // Start with no default subjects

    // DOM Elements
    const levelDisplay = document.getElementById('player-level');
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


    // Function to update all displays
    function updateUI() {
        // Update Level
        levelDisplay.textContent = `Level ${player.level}`;

        // Update XP Bar and Text
        const xpPercentage = (player.xp / player.xpToNextLevel) * 100;
        xpBar.style.width = `${xpPercentage}%`;
        xpText.textContent = `${player.xp} / ${player.xpToNextLevel} XP`;

        // Populate subjects dropdown
        populateSubjectsDropdown();
        renderQuests();
        renderSubjectsInModal();
    }

    // Function to add XP
    function addXp(amount) {
        player.xp += amount;
        console.log(`Gained ${amount} XP!`);

        // Check for level up
        if (player.xp >= player.xpToNextLevel) {
            player.level++;
            player.xp -= player.xpToNextLevel; // Carry over remaining XP
            player.xpToNextLevel = Math.floor(player.xpToNextLevel * 1.5); // Increase XP needed for next level
            console.log(`Leveled up to Level ${player.level}!`);
        }

        // Check for achievements
        if (!firstQuestBadge.classList.contains('unlocked')) {
            firstQuestBadge.classList.add('unlocked');
            console.log('Achievement Unlocked: First Quest!');
        }

        updateUI();
    }

    // Quest Management
    let quests = JSON.parse(localStorage.getItem('quests')) || [];

    function saveQuests() {
        localStorage.setItem('quests', JSON.stringify(quests));
    }

    function saveSubjects() {
        localStorage.setItem('subjects', JSON.stringify(subjects));
    }

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
            button.addEventListener('click', (event) => {
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
            addXp(25); // Award XP for completing a quest
            quests.splice(index, 1); // Remove completed quest
            saveQuests();
            updateUI();
        }
    }

    // Profile/Subject Management Modal
    function openProfileModal() {
        profileModal.style.display = 'block';
        renderSubjectsInModal();
    }

    function closeProfileModal() {
        profileModal.style.display = 'none';
    }

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
            button.addEventListener('click', (event) => {
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

    // Event Listeners
    addQuestBtn.addEventListener('click', addQuest);
    profileButton.addEventListener('click', openProfileModal);
    closeModalButton.addEventListener('click', closeProfileModal);
    addSubjectModalBtn.addEventListener('click', addSubjectFromModal);

    window.addEventListener('click', (event) => {
        if (event.target === profileModal) {
            closeProfileModal();
        }
    });

    // Initial UI setup
    updateUI();
});
