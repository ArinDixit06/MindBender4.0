const nodes = [
    { id: 'metals-nonmetals', name: 'Metals and Non-metals', chapter: 'Ch 3', icon: 'fa-coins', x: 500, y: 150, difficulty: 4, duration: 150 },
    { id: 'carbon-compounds', name: 'Carbon and its Compounds', chapter: 'Ch 4', icon: 'fa-link', x: 650, y: 150, difficulty: 5, duration: 180 },
    { id: 'periodic-classification', name: 'Periodic Classification of Elements', chapter: 'Ch 5', icon: 'fa-th', x: 800, y: 150, difficulty: 4, duration: 135 },
    { id: 'life-processes', name: 'Life Processes', chapter: 'Ch 6', icon: 'fa-heart', x: 200, y: 300, difficulty: 4, duration: 165 },
    { id: 'control-coordination', name: 'Control and Coordination', chapter: 'Ch 7', icon: 'fa-brain', x: 350, y: 300, difficulty: 5, duration: 180 },
    { id: 'reproduction', name: 'How Do Organisms Reproduce?', chapter: 'Ch 8', icon: 'fa-dna', x: 500, y: 300, difficulty: 4, duration: 150 },
    { id: 'heredity-evolution', name: 'Heredity and Evolution', chapter: 'Ch 9', icon: 'fa-project-diagram', x: 650, y: 300, difficulty: 5, duration: 165 },
    { id: 'light-reflection', name: 'Light - Reflection and Refraction', chapter: 'Ch 10', icon: 'fa-eye', x: 800, y: 300, difficulty: 4, duration: 150 },
    { id: 'human-eye', name: 'Human Eye and Colourful World', chapter: 'Ch 11', icon: 'fa-glasses', x: 950, y: 300, difficulty: 4, duration: 135 },
    { id: 'electricity', name: 'Electricity', chapter: 'Ch 12', icon: 'fa-plug', x: 800, y: 450, difficulty: 5, duration: 180 },
    { id: 'magnetic-effects', name: 'Magnetic Effects of Electric Current', chapter: 'Ch 13', icon: 'fa-magnet', x: 950, y: 450, difficulty: 5, duration: 165 },
    { id: 'sources-energy', name: 'Sources of Energy', chapter: 'Ch 14', icon: 'fa-solar-panel', x: 650, y: 450, difficulty: 4, duration: 120 },
    { id: 'environment-management', name: 'Our Environment', chapter: 'Ch 15', icon: 'fa-recycle', x: 500, y: 450, difficulty: 3, duration: 105 },
    { id: 'natural-resource-management', name: 'Management of Natural Resources', chapter: 'Ch 16', icon: 'fa-tree', x: 350, y: 450, difficulty: 4, duration: 135 }
];

const courseData = {
    // Part 1: Node definitions from your previous snippet
    nodes: [
        { id: 'metals-nonmetals', name: 'Metals and Non-metals', chapter: 'Ch 3', icon: 'fa-coins', x: 500, y: 150, difficulty: 4, duration: 150 },
        { id: 'carbon-compounds', name: 'Carbon and its Compounds', chapter: 'Ch 4', icon: 'fa-link', x: 650, y: 150, difficulty: 5, duration: 180 },
        { id: 'periodic-classification', name: 'Periodic Classification of Elements', chapter: 'Ch 5', icon: 'fa-th', x: 800, y: 150, difficulty: 4, duration: 135 },
        { id: 'life-processes', name: 'Life Processes', chapter: 'Ch 6', icon: 'fa-heart', x: 200, y: 300, difficulty: 4, duration: 165 },
        { id: 'control-coordination', name: 'Control and Coordination', chapter: 'Ch 7', icon: 'fa-brain', x: 350, y: 300, difficulty: 5, duration: 180 },
        { id: 'reproduction', name: 'How Do Organisms Reproduce?', chapter: 'Ch 8', icon: 'fa-dna', x: 500, y: 300, difficulty: 4, duration: 150 },
        { id: 'heredity-evolution', name: 'Heredity and Evolution', chapter: 'Ch 9', icon: 'fa-project-diagram', x: 650, y: 300, difficulty: 5, duration: 165 },
        { id: 'light-reflection', name: 'Light - Reflection and Refraction', chapter: 'Ch 10', icon: 'fa-eye', x: 800, y: 300, difficulty: 4, duration: 150 },
        { id: 'human-eye', name: 'Human Eye and Colourful World', chapter: 'Ch 11', icon: 'fa-glasses', x: 950, y: 300, difficulty: 4, duration: 135 },
        { id: 'electricity', name: 'Electricity', chapter: 'Ch 12', icon: 'fa-plug', x: 800, y: 450, difficulty: 5, duration: 180 },
        { id: 'magnetic-effects', name: 'Magnetic Effects of Electric Current', chapter: 'Ch 13', icon: 'fa-magnet', x: 950, y: 450, difficulty: 5, duration: 165 },
        { id: 'sources-energy', name: 'Sources of Energy', chapter: 'Ch 14', icon: 'fa-solar-panel', x: 650, y: 450, difficulty: 4, duration: 120 },
        { id: 'environment-management', name: 'Our Environment', chapter: 'Ch 15', icon: 'fa-recycle', x: 500, y: 450, difficulty: 3, duration: 105 },
        { id: 'natural-resource-management', name: 'Management of Natural Resources', chapter: 'Ch 16', icon: 'fa-tree', x: 350, y: 450, difficulty: 4, duration: 135 }
    ],

    // Part 2: Prerequisites from your latest snippet
    prerequisites: {
        'Class 9': [
            { concept: 'particle-matter', requires: 'matter-surroundings' },
            { concept: 'atoms-molecules', requires: 'particle-matter' },
            { concept: 'structure-atom', requires: 'atoms-molecules' },
            { concept: 'tissues', requires: 'life-fundamental-unit' },
            { concept: 'diversity-living-organisms', requires: 'tissues' },
            { concept: 'force-laws-motion', requires: 'motion' },
            { concept: 'gravitation', requires: 'force-laws-motion' },
            { concept: 'work-energy', requires: 'force-laws-motion' },
            { concept: 'sound', requires: 'motion' },
            { concept: 'improvement-food-resources', requires: 'diversity-living-organisms' }
        ],
        'Class 10': [
            { concept: 'acids-bases-salts', requires: 'chemical-reactions' },
            { concept: 'metals-nonmetals', requires: 'chemical-reactions' },
            { concept: 'carbon-compounds', requires: 'metals-nonmetals' },
            { concept: 'periodic-classification', requires: 'structure-atom' },
            { concept: 'control-coordination', requires: 'life-processes' },
            { concept: 'reproduction', requires: 'life-processes' },
            { concept: 'heredity-evolution', requires: 'reproduction' },
            { concept: 'human-eye', requires: 'light-reflection' },
            { concept: 'magnetic-effects', requires: 'electricity' },
            { concept: 'sources-energy', requires: 'electricity' },
            { concept: 'environment-management', requires: 'life-processes' },
            { concept: 'natural-resource-management', requires: 'environment-management' }
        ]
    }
};
           

    // Sample Quiz Questions for Indian Curriculum
    const QUIZ_QUESTIONS = {
        'real-numbers': [
            {
                question: "Which of the following is an irrational number?",
                options: ["√16", "√2", "22/7", "0.333..."],
                correct: 1,
                explanation: "√2 is irrational because it cannot be expressed as a ratio of two integers.",
                difficulty: 3
            },
            {
                question: "What is the decimal expansion of 7/8?",
                options: ["0.875", "0.78", "0.887", "0.8750"],
                correct: 0,
                explanation: "7 ÷ 8 = 0.875 (terminating decimal)",
                difficulty: 2
            },
            {
                question: "Euclid's division lemma states that for positive integers a and b, there exist unique integers q and r such that:",
                options: ["a = bq + r, where 0 ≤ r < b", "a = bq - r, where 0 ≤ r < b", "a = bq + r, where 0 < r ≤ b", "a = bq + r, where r > b"],
                correct: 0,
                explanation: "This is the fundamental statement of Euclid's division lemma.",
                difficulty: 3
            }
        ],
        'quadratic-equations': [
            {
                question: "The roots of the quadratic equation x² - 5x + 6 = 0 are:",
                options: ["2, 3", "1, 6", "-2, -3", "5, 1"],
                correct: 0,
                explanation: "Using factorization: (x-2)(x-3) = 0, so x = 2 or x = 3",
                difficulty: 3
            },
            {
                question: "For the quadratic equation ax² + bx + c = 0, the discriminant is:",
                options: ["b² - 4ac", "b² + 4ac", "4ac - b²", "a² - 4bc"],
                correct: 0,
                explanation: "The discriminant Δ = b² - 4ac determines the nature of roots.",
                difficulty: 2
            }
        ],
        'trigonometry': [
            {
                question: "The value of sin 30° is:",
                options: ["1/2", "√3/2", "1", "0"],
                correct: 0,
                explanation: "sin 30° = 1/2 is a fundamental trigonometric value.",
                difficulty: 2
            },
            {
                question: "If sin θ = 3/5, then cos θ = ?",
                options: ["4/5", "3/4", "5/4", "5/3"],
                correct: 0,
                explanation: "Using Pythagoras theorem: cos²θ = 1 - sin²θ = 1 - 9/25 = 16/25, so cos θ = 4/5",
                difficulty: 4
            }
        ],
        'chemical-reactions': [
            {
                question: "Which of the following is a balanced chemical equation?",
                options: ["H₂ + O₂ → H₂O", "2H₂ + O₂ → 2H₂O", "H₂ + 2O₂ → H₂O", "2H₂ + 2O₂ → H₂O"],
                correct: 1,
                explanation: "The equation 2H₂ + O₂ → 2H₂O has equal atoms on both sides.",
                difficulty: 2
            },
            {
                question: "The reaction CaCO₃ → CaO + CO₂ is an example of:",
                options: ["Combination reaction", "Decomposition reaction", "Displacement reaction", "Redox reaction"],
                correct: 1,
                explanation: "A single reactant breaks down into two or more products - decomposition.",
                difficulty: 3
            }
        ],
        'life-processes': [
            {
                question: "The basic filtration unit in kidneys is called:",
                options: ["Alveoli", "Nephron", "Neuron", "Villus"],
                correct: 1,
                explanation: "Nephron is the functional unit of kidney responsible for filtration.",
                difficulty: 2
            },
            {
                question: "Which enzyme breaks down starch in the mouth?",
                options: ["Pepsin", "Trypsin", "Amylase", "Lipase"],
                correct: 2,
                explanation: "Salivary amylase (ptyalin) breaks down starch into maltose in the mouth.",
                difficulty: 3
            }
        ]
    };

    // === DOM ELEMENTS ===
    const elements = {
        // Header controls
        subjectSelector: document.getElementById('subject-selector'),
        chapterFilter: document.getElementById('chapter-filter'),
        studentBoardInfo: document.getElementById('student-board-info'),
        studentClassInfo: document.getElementById('student-class-info'),
        
        // Map controls
        zoomInBtn: document.getElementById('zoom-in'),
        zoomOutBtn: document.getElementById('zoom-out'),
        resetViewBtn: document.getElementById('reset-view'),
        toggleSidebarBtn: document.getElementById('toggle-sidebar'),
        
        // Map canvas
        mapCanvas: document.getElementById('knowledge-map-canvas'),
        mapSvg: document.getElementById('map-svg'),
        conceptNodes: document.getElementById('concept-nodes'),
        welcomeMessage: document.getElementById('welcome-message'),
        
        // Progress sidebar
        progressSidebar: document.getElementById('progress-sidebar'),
        closeSidebarBtn: document.getElementById('close-sidebar'),
        subjectNameDisplay: document.getElementById('subject-name-display'),
        progressPercentage: document.getElementById('progress-percentage'),
        progressRingFill: document.getElementById('progress-ring-fill'),
        masteredCount: document.getElementById('mastered-count'),
        availableCount: document.getElementById('available-count'),
        learningCount: document.getElementById('learning-count'),
        lockedCount: document.getElementById('locked-count'),
        recommendationsList: document.getElementById('recommendations-list'),
        achievementsList: document.getElementById('achievements-list'),
        streakCount: document.getElementById('streak-count'),
        
        // Modals
        conceptModal: document.getElementById('concept-modal'),
        assessmentModal: document.getElementById('assessment-modal'),
        resultsModal: document.getElementById('results-modal'),
        
        // Concept modal elements
        conceptTitle: document.getElementById('concept-title'),
        conceptChapter: document.getElementById('concept-chapter'),
        conceptDifficulty: document.getElementById('concept-difficulty'),
        conceptDuration: document.getElementById('concept-duration'),
        conceptStatusBadge: document.getElementById('concept-status-badge'),
        conceptDescription: document.getElementById('concept-description'),
        prerequisitesList: document.getElementById('prerequisites-list'),
        learningObjectivesList: document.getElementById('learning-objectives-list'),
        individualProgress: document.getElementById('individual-progress'),
        progressText: document.getElementById('progress-text'),
        
        // Action buttons
        startLearningBtn: document.getElementById('start-learning-btn'),
        continueLearningBtn: document.getElementById('continue-learning-btn'),
        takeAssessmentBtn: document.getElementById('take-assessment-btn'),
        reviewConceptBtn: document.getElementById('review-concept-btn'),
        viewResourcesBtn: document.getElementById('view-resources-btn'),
        
        // Assessment modal elements
        assessmentTitle: document.getElementById('assessment-title'),
        questionCount: document.getElementById('question-count'),
        timeLimit: document.getElementById('time-limit'),
        currentQuestion: document.getElementById('current-question'),
        totalQuestions: document.getElementById('total-questions'),
        timerText: document.getElementById('timer-text'),
        questionType: document.getElementById('question-type'),
        questionMarks: document.getElementById('question-marks'),
        questionText: document.getElementById('question-text'),
        optionsSection: document.getElementById('options-section'),
        questionIndicators: document.getElementById('question-indicators'),
        prevQuestionBtn: document.getElementById('prev-question-btn'),
        nextQuestionBtn: document.getElementById('next-question-btn'),
        submitAssessmentBtn: document.getElementById('submit-assessment-btn'),
        
        // Results modal elements
        resultScoreCircle: document.getElementById('result-score-circle'),
        finalScore: document.getElementById('final-score'),
        resultStatusText: document.getElementById('result-status-text'),
        resultMessage: document.getElementById('result-message'),
        correctAnswers: document.getElementById('correct-answers'),
        incorrectAnswers: document.getElementById('incorrect-answers'),
        timeTaken: document.getElementById('time-taken'),
        detailedFeedback: document.getElementById('detailed-feedback'),
        nextStepsContent: document.getElementById('next-steps-content'),
        retakeAssessmentBtn: document.getElementById('retake-assessment-btn'),
        continueJourneyBtn: document.getElementById('continue-journey-btn')
    };

    // === INITIALIZATION ===
    async function init() {
        try {
            showNotification('Loading your personalized knowledge map...', 'info');
            
            // Check authentication
            const meResponse = await fetch(`${API_URL}/api/me`, { credentials: 'include' });
            if (!meResponse.ok) {
                window.location.href = 'login.html';
                return;
            }
            
            const meData = await meResponse.json();
            state.userInfo = meData.loggedInUser;
            state.studentInfo = meData.studentInfo;
            
            // Initialize UI
            displayStudentInfo();
            await loadSubjects();
            loadUserProgress();
            loadStudyStreak();
            
            setupEventListeners();
            
            // Show welcome message initially
            showWelcomeMessage();
            
            showNotification('Knowledge map loaded successfully!', 'success');
            
        } catch (error) {
            console.error("Knowledge Map Initialization Error:", error);
            showNotification('Failed to load knowledge map. Please refresh the page.', 'error');
        }
    }

    // === STUDENT INFO DISPLAY ===
    function displayStudentInfo() {
        if (state.studentInfo) {
            elements.studentBoardInfo.textContent = `${state.studentInfo.board} Board`;
            elements.studentClassInfo.textContent = `Class ${state.studentInfo.class}`;
            
            if (state.studentInfo.stream) {
                elements.studentClassInfo.textContent += ` (${state.studentInfo.stream})`;
            }
        }
    }

    // === SUBJECTS LOADING ===
    async function loadSubjects() {
        try {
            const subjects = [];
            
            // Get subjects for current class
            if (state.studentInfo?.class && INDIAN_CURRICULUM) {
                Object.keys(INDIAN_CURRICULUM).forEach(subject => {
                    const subjectData = INDIAN_CURRICULUM[subject];
                    if (subjectData.classes.includes(state.studentInfo.class)) {
                        subjects.push(subject);
                    }
                });
            }
            
            // Add custom subjects from local storage
            const customSubjects = JSON.parse(localStorage.getItem('customSubjects')) || [];
            subjects.push(...customSubjects);
            
            // Populate dropdown
            elements.subjectSelector.innerHTML = '<option value="">Choose Subject</option>';
            subjects.forEach(subject => {
                const option = document.createElement('option');
                option.value = subject;
                option.textContent = subject;
                elements.subjectSelector.appendChild(option);
            });
            
        } catch (error) {
            console.error('Error loading subjects:', error);
            showNotification('Failed to load subjects', 'error');
        }
    }

    // === USER PROGRESS MANAGEMENT ===
    function loadUserProgress() {
        const savedProgress = localStorage.getItem('knowledgeMapProgress');
        if (savedProgress) {
            state.userProgress = JSON.parse(savedProgress);
        } else {
            // Initialize with sample progress for demonstration
            initializeSampleProgress();
        }
    }

    function initializeSampleProgress() {
        const classKey = `Class ${state.studentInfo?.class || '10'}`;
        
        state.userProgress = {
            'Mathematics': {
                [classKey]: {
                    'real-numbers': { status: 'mastered', score: 85, timeSpent: 120 },
                    'polynomials-10': { status: 'mastered', score: 92, timeSpent: 135 },
                    'linear-equations-pair': { status: 'learning', score: 0, timeSpent: 45 },
                    'quadratic-equations': { status: 'available', score: 0, timeSpent: 0 },
                    'arithmetic-progressions': { status: 'available', score: 0, timeSpent: 0 },
                    'triangles-10': { status: 'mastered', score: 78, timeSpent: 150 },
                    'coordinate-geometry-10': { status: 'available', score: 0, timeSpent: 0 },
                    'trigonometry': { status: 'locked', score: 0, timeSpent: 0 },
                    'trigonometry-applications': { status: 'locked', score: 0, timeSpent: 0 },
                    'circles-10': { status: 'available', score: 0, timeSpent: 0 },
                    'constructions-10': { status: 'locked', score: 0, timeSpent: 0 },
                    'areas-related-circles': { status: 'locked', score: 0, timeSpent: 0 },
                    'surface-areas-volumes-10': { status: 'available', score: 0, timeSpent: 0 },
                    'statistics-10': { status: 'available', score: 0, timeSpent: 0 },
                    'probability-10': { status: 'locked', score: 0, timeSpent: 0 }
                }
            },
            'Science': {
                [classKey]: {
                    'chemical-reactions': { status: 'mastered', score: 88, timeSpent: 120 },
                    'acids-bases-salts': { status: 'mastered', score: 82, timeSpent: 135 },
                    'metals-nonmetals': { status: 'learning', score: 0, timeSpent: 60 },
                    'carbon-compounds': { status: 'locked', score: 0, timeSpent: 0 },
                    'periodic-classification': { status: 'available', score: 0, timeSpent: 0 },
                    'life-processes': { status: 'mastered', score: 90, timeSpent: 165 },
                    'control-coordination': { status: 'available', score: 0, timeSpent: 0 },
                    'reproduction': { status: 'locked', score: 0, timeSpent: 0 },
                    'heredity-evolution': { status: 'locked', score: 0, timeSpent: 0 },
                    'light-reflection': { status: 'available', score: 0, timeSpent: 0 },
                    'human-eye': { status: 'locked', score: 0, timeSpent: 0 },
                    'electricity': { status: 'available', score: 0, timeSpent: 0 },
                    'magnetic-effects': { status: 'locked', score: 0, timeSpent: 0 },
                    'sources-energy': { status: 'locked', score: 0, timeSpent: 0 },
                    'environment-management': { status: 'available', score: 0, timeSpent: 0 },
                    'natural-resource-management': { status: 'locked', score: 0, timeSpent: 0 }
                }
            }
        };
        
        saveUserProgress();
    }

    function saveUserProgress() {
        localStorage.setItem('knowledgeMapProgress', JSON.stringify(state.userProgress));
    }

    function loadStudyStreak() {
        const savedStreak = localStorage.getItem('studyStreak');
        state.studyStreak = savedStreak ? parseInt(savedStreak) : 0;
        elements.streakCount.textContent = state.studyStreak;
    }

    // === SUBJECT MAP LOADING ===
    function loadSubjectMap(subject) {
        if (!INDIAN_CURRICULUM[subject]) {
            showNotification(`Knowledge map for ${subject} is coming soon!`, 'info');
            return;
        }
        
        state.currentSubject = subject;
        const classKey = `Class ${state.studentInfo?.class || '10'}`;
        
        // Get concepts and prerequisites for current class
        state.concepts = INDIAN_CURRICULUM[subject].concepts[classKey] || [];
        state.prerequisites = INDIAN_CURRICULUM[subject].prerequisites[classKey] || [];
        
        // Update chapter filter
        updateChapterFilter();
        
        // Clear and redraw map
        clearMap();
        hideWelcomeMessage();
        drawConnections();
        drawConcepts();
        
        // Update progress stats
        updateProgressStats();
        updateRecommendations();
        
        // Open sidebar
        openSidebar();
        
        // Reset view
        resetView();
        
        showNotification(`Loaded ${subject} knowledge map for Class ${state.studentInfo?.class}`, 'success');
    }

    function updateChapterFilter() {
        const chapters = [...new Set(state.concepts.map(c => c.chapter))].sort();
        
        elements.chapterFilter.innerHTML = '<option value="">All Chapters</option>';
        chapters.forEach(chapter => {
            const option = document.createElement('option');
            option.value = chapter;
            option.textContent = chapter;
            elements.chapterFilter.appendChild(option);
        });
        
        elements.chapterFilter.style.display = 'inline-block';
    }

    // === MAP RENDERING ===
    function clearMap() {
        // Clear SVG connections
        elements.mapSvg.innerHTML = `
            <defs>
                <marker id="arrowhead-mastered" markerWidth="12" markerHeight="8" refX="10" refY="4" orient="auto">
                    <polygon points="0 0, 12 4, 0 8" fill="#27ae60" opacity="0.8"/>
                </marker>
                <marker id="arrowhead-available" markerWidth="12" markerHeight="8" refX="10" refY="4" orient="auto">
                    <polygon points="0 0, 12 4, 0 8" fill="#f39c12" opacity="0.6"/>
                </marker>
                <marker id="arrowhead-locked" markerWidth="12" markerHeight="8" refX="10" refY="4" orient="auto">
                    <polygon points="0 0, 12 4, 0 8" fill="#95a5a6" opacity="0.4"/>
                </marker>
                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style="stop-color:#fca311;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#e94560;stop-opacity:1" />
                </linearGradient>
            </defs>
        `;
        
        // Clear concept nodes
        elements.conceptNodes.innerHTML = '';
    }

    function drawConnections() {
        state.prerequisites.forEach(prereq => {
            const fromConcept = state.concepts.find(c => c.id === prereq.requires);
            const toConcept = state.concepts.find(c => c.id === prereq.concept);
            
            if (fromConcept && toConcept) {
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', fromConcept.x);
                line.setAttribute('y1', fromConcept.y);
                line.setAttribute('x2', toConcept.x);
                line.setAttribute('y2', toConcept.y);
                
                const fromStatus = getConceptStatus(fromConcept.id);
                const toStatus = getConceptStatus(toConcept.id);
                
                // Style connection based on status
                if (fromStatus === 'mastered' && toStatus !== 'locked') {
                    line.setAttribute('stroke', '#27ae60');
                    line.setAttribute('marker-end', 'url(#arrowhead-mastered)');
                    line.setAttribute('opacity', '0.8');
                } else if (fromStatus === 'mastered' || fromStatus === 'learning') {
                    line.setAttribute('stroke', '#f39c12');
                    line.setAttribute('marker-end', 'url(#arrowhead-available)');
                    line.setAttribute('opacity', '0.6');
                } else {
                    line.setAttribute('stroke', '#95a5a6');
                    line.setAttribute('marker-end', 'url(#arrowhead-locked)');
                    line.setAttribute('opacity', '0.4');
                }
                
                line.setAttribute('stroke-width', '3');
                line.classList.add('connection-line');
                
                elements.mapSvg.appendChild(line);
            }
        });
    }

    function drawConcepts() {
        // Filter concepts by chapter if filter is active
        let conceptsToDraw = state.concepts;
        if (state.currentChapter) {
            conceptsToDraw = state.concepts.filter(c => c.chapter === state.currentChapter);
        }
        
        conceptsToDraw.forEach((concept, index) => {
            setTimeout(() => {
                const status = getConceptStatus(concept.id);
                const node = createConceptNode(concept, status);
                node.classList.add('revealing');
                elements.conceptNodes.appendChild(node);
            }, index * 100); // Staggered animation
        });
    }

    function getConceptStatus(conceptId) {
        const classKey = `Class ${state.studentInfo?.class || '10'}`;
        const progress = state.userProgress[state.currentSubject]?.[classKey]?.[conceptId];
        
        if (!progress) return 'locked';
        
        if (progress.status === 'mastered') return 'mastered';
        if (progress.status === 'learning') return 'learning';
        if (progress.status === 'available') return 'available';
        
        // Check prerequisites
        const prereq = state.prerequisites.find(p => p.concept === conceptId);
        if (!prereq) return 'available'; // No prerequisites
        
        const prerequisiteStatus = getConceptStatus(prereq.requires);
        return prerequisiteStatus === 'mastered' ? 'available' : 'locked';
    }

    function createConceptNode(concept, status) {
        const node = document.createElement('div');
        node.className = `concept-node ${status}`;
        node.style.left = `${concept.x}px`;
        node.style.top = `${concept.y}px`;
        node.setAttribute('data-concept-id', concept.id);
        
        node.innerHTML = `
            <div class="concept-icon">
                <i class="fas ${concept.icon}"></i>
            </div>
            <div class="concept-name">${concept.name}</div>
            <div class="chapter-tag">${concept.chapter}</div>
        `;
        
        // Add click event
        node.addEventListener('click', () => openConceptModal(concept, status));
        
        // Add tooltip on hover
        node.title = `${concept.name} - ${status.toUpperCase()}`;
        
        return node;
    }

    // === PROGRESS TRACKING ===
    function updateProgressStats() {
        if (!state.currentSubject) return;
        
        const classKey = `Class ${state.studentInfo?.class || '10'}`;
        const progress = state.userProgress[state.currentSubject]?.[classKey] || {};
        
        const total = state.concepts.length;
        const mastered = Object.values(progress).filter(p => p.status === 'mastered').length;
        const learning = Object.values(progress).filter(p => p.status === 'learning').length;
        const available = state.concepts.filter(c => getConceptStatus(c.id) === 'available').length;
        const locked = total - mastered - learning - available;
        
        // Update counts
        elements.masteredCount.textContent = mastered;
        elements.learningCount.textContent = learning;
        elements.availableCount.textContent = available;
        elements.lockedCount.textContent = locked;
        
        // Update progress ring
        const percentage = total > 0 ? Math.round((mastered / total) * 100) : 0;
        elements.progressPercentage.textContent = `${percentage}%`;
        
        const circumference = 339.292;
        const offset = circumference - (percentage / 100) * circumference;
        elements.progressRingFill.style.strokeDashoffset = offset;
        
        // Update subject display
        elements.subjectNameDisplay.textContent = state.currentSubject || 'Select Subject';
    }

    function updateRecommendations() {
        if (!state.currentSubject) {
            elements.recommendationsList.innerHTML = '<p class="empty-state">Select a subject to see recommendations</p>';
            return;
        }
        
        const availableConcepts = state.concepts
            .filter(c => getConceptStatus(c.id) === 'available')
            .sort((a, b) => a.difficulty - b.difficulty)
            .slice(0, 3);
        
        if (availableConcepts.length === 0) {
            elements.recommendationsList.innerHTML = '<p class="empty-state">Great job! All concepts are mastered or in progress!</p>';
            return;
        }
        
        elements.recommendationsList.innerHTML = '';
        availableConcepts.forEach(concept => {
            const item = document.createElement('div');
            item.className = 'recommendation-item';
            item.innerHTML = `
                <div class="recommendation-title">${concept.name}</div>
                <div class="recommendation-desc">${getConceptDescription(concept.id)}</div>
                <div class="recommendation-meta">
                    <span class="meta-badge">${concept.chapter}</span>
                    <span class="meta-badge">${getDifficultyText(concept.difficulty)}</span>
                </div>
            `;
            item.addEventListener('click', () => {
                const status = getConceptStatus(concept.id);
                openConceptModal(concept, status);
            });
            elements.recommendationsList.appendChild(item);
        });
    }

    function getDifficultyText(difficulty) {
        const levels = ['Beginner', 'Easy', 'Medium', 'Hard', 'Advanced'];
        return levels[difficulty - 1] || 'Medium';
    }

    function getConceptDescription(conceptId) {
        const descriptions = {
            'real-numbers': 'Explore rational and irrational numbers, Euclid\'s division algorithm',
            'quadratic-equations': 'Master solving quadratic equations using various methods',
            'trigonometry': 'Learn trigonometric ratios and their applications',
            'chemical-reactions': 'Understand different types of chemical reactions and equations',
            'life-processes': 'Study nutrition, respiration, transportation in living organisms',
            'electricity': 'Learn about electric current, potential difference, and Ohm\'s law'
        };
        return descriptions[conceptId] || 'Important concept in Indian curriculum';
    }

    // === MODAL MANAGEMENT ===
    function openConceptModal(concept, status) {
        const classKey = `Class ${state.studentInfo?.class || '10'}`;
        const progress = state.userProgress[state.currentSubject]?.[classKey]?.[concept.id] || { status: 'locked', score: 0, timeSpent: 0 };
        
        // Update modal content
        elements.conceptTitle.textContent = concept.name;
        elements.conceptChapter.textContent = concept.chapter;
        elements.conceptDifficulty.textContent = getDifficultyText(concept.difficulty);
        elements.conceptDuration.innerHTML = `<i class="fas fa-clock"></i> ${concept.duration} mins`;
        
        elements.conceptStatusBadge.className = `status-badge ${status}`;
        elements.conceptStatusBadge.textContent = status.toUpperCase().replace('-', ' ');
        
        elements.conceptDescription.textContent = getConceptDescription(concept.id);
        
        // Update prerequisites
        updatePrerequisites(concept.id);
        
        // Update learning objectives
        updateLearningObjectives(concept.id);
        
        // Update individual progress
        updateIndividualProgress(progress);
        
        // Update action buttons
        updateActionButtons(status, concept.id);
        
        // Show modal
        showModal('concept-modal');
    }

    function updatePrerequisites(conceptId) {
        const prereq = state.prerequisites.find(p => p.concept === conceptId);
        
        if (!prereq) {
            document.getElementById('prerequisites-section').style.display = 'none';
            return;
        }
        
        document.getElementById('prerequisites-section').style.display = 'block';
        const prerequisiteConcept = state.concepts.find(c => c.id === prereq.requires);
        const prerequisiteStatus = getConceptStatus(prereq.requires);
        
        elements.prerequisitesList.innerHTML = `
            <div class="prerequisite-item">
                <span class="prerequisite-name">${prerequisiteConcept?.name || 'Unknown'}</span>
                <span class="prerequisite-status ${prerequisiteStatus === 'mastered' ? 'completed' : 'pending'}">
                    ${prerequisiteStatus === 'mastered' ? 'Completed' : 'Required'}
                </span>
            </div>
        `;
    }

    function updateLearningObjectives(conceptId) {
        const objectives = {
            'real-numbers': [
                'Understand the classification of real numbers',
                'Apply Euclid\'s division lemma and algorithm',
                'Find HCF and LCM using prime factorization',
                'Prove irrationality of numbers like √2, √3, √5'
            ],
            'quadratic-equations': [
                'Solve quadratic equations by factorization',
                'Use quadratic formula to find roots',
                'Understand nature of roots using discriminant',
                'Apply quadratic equations to real-world problems'
            ],
            'trigonometry': [
                'Learn trigonometric ratios for acute angles',
                'Use trigonometric identities effectively',
                'Solve problems involving heights and distances',
                'Apply trigonometry in coordinate geometry'
            ],
            'chemical-reactions': [
                'Balance chemical equations correctly',
                'Identify types of chemical reactions',
                'Understand oxidation and reduction processes',
                'Apply law of conservation of mass'
            ],
            'life-processes': [
                'Understand nutrition in autotrophs and heterotrophs',
                'Learn about human digestive system',
                'Study respiratory system in humans and plants',
                'Explore transportation system in organisms'
            ]
        };
        
        const conceptObjectives = objectives[conceptId] || [
            'Master fundamental concepts of the topic',
            'Solve NCERT textbook problems',
            'Apply knowledge to board exam questions',
            'Build foundation for advanced topics'
        ];
        
        elements.learningObjectivesList.innerHTML = conceptObjectives
            .map(obj => `<li>${obj}</li>`)
            .join('');
    }

    function updateIndividualProgress(progress) {
        const percentage = progress.status === 'mastered' ? 100 : 
                          progress.status === 'learning' ? 50 : 0;
        
        elements.individualProgress.style.width = `${percentage}%`;
        
        if (progress.status === 'mastered') {
            elements.progressText.textContent = `Mastered (${progress.score}% score)`;
        } else if (progress.status === 'learning') {
            elements.progressText.textContent = `In Progress (${progress.timeSpent} mins studied)`;
        } else {
            elements.progressText.textContent = 'Not Started';
        }
    }

    function updateActionButtons(status, conceptId) {
        // Hide all buttons first
        elements.startLearningBtn.style.display = 'none';
        elements.continueLearningBtn.style.display = 'none';
        elements.takeAssessmentBtn.style.display = 'none';
        elements.reviewConceptBtn.style.display = 'none';
        
        // Show appropriate buttons based on status
        if (status === 'available') {
            elements.startLearningBtn.style.display = 'inline-block';
            elements.startLearningBtn.onclick = () => startLearning(conceptId);
        } else if (status === 'learning') {
            elements.continueLearningBtn.style.display = 'inline-block';
            elements.takeAssessmentBtn.style.display = 'inline-block';
            elements.continueLearningBtn.onclick = () => continueLearning(conceptId);
            elements.takeAssessmentBtn.onclick = () => startAssessment(conceptId);
        } else if (status === 'mastered') {
            elements.reviewConceptBtn.style.display = 'inline-block';
            elements.takeAssessmentBtn.style.display = 'inline-block';
            elements.reviewConceptBtn.onclick = () => reviewConcept(conceptId);
            elements.takeAssessmentBtn.onclick = () => startAssessment(conceptId);
        }
        
        // View resources button is always available
        elements.viewResourcesBtn.onclick = () => viewResources(conceptId);
    }

    // === LEARNING ACTIONS ===
    function startLearning(conceptId) {
        const classKey = `Class ${state.studentInfo?.class || '10'}`;
        
        // Update progress
        if (!state.userProgress[state.currentSubject]) {
            state.userProgress[state.currentSubject] = {};
        }
        if (!state.userProgress[state.currentSubject][classKey]) {
            state.userProgress[state.currentSubject][classKey] = {};
        }
        
        state.userProgress[state.currentSubject][classKey][conceptId] = {
            status: 'learning',
            score: 0,
            timeSpent: 0,
            startedAt: new Date().toISOString()
        };
        
        saveUserProgress();
        closeModal();
        
        // Refresh map
        loadSubjectMap(state.currentSubject);
        
        showNotification('Learning session started! Study the concept and take the assessment when ready.', 'success');
    }

    function continueLearning(conceptId) {
        const classKey = `Class ${state.studentInfo?.class || '10'}`;
        const progress = state.userProgress[state.currentSubject][classKey][conceptId];
        
        // Simulate adding study time
        progress.timeSpent += 30;
        saveUserProgress();
        
        closeModal();
        loadSubjectMap(state.currentSubject);
        
        showNotification('Continue studying! Take the assessment when you feel ready.', 'info');
    }

    function reviewConcept(conceptId) {
        showNotification('Review materials and practice problems are available in your textbook.', 'info');
        closeModal();
    }

    function viewResources(conceptId) {
        const resources = {
            'real-numbers': 'NCERT Mathematics Class 10, Chapter 1',
            'quadratic-equations': 'NCERT Mathematics Class 10, Chapter 4',
            'trigonometry': 'NCERT Mathematics Class 10, Chapter 8',
            'chemical-reactions': 'NCERT Science Class 10, Chapter 1',
            'life-processes': 'NCERT Science Class 10, Chapter 6'
        };
        
        const resource = resources[conceptId] || 'Check your NCERT textbook';
        showNotification(`Resource: ${resource}`, 'info');
    }

    // === ASSESSMENT SYSTEM ===
    function startAssessment(conceptId) {
        const questions = QUIZ_QUESTIONS[conceptId];
        
        if (!questions || questions.length === 0) {
            showNotification('Assessment questions are being prepared for this concept.', 'info');
            return;
        }
        
        state.currentAssessment = {
            conceptId: conceptId,
            questions: questions,
            startTime: Date.now()
        };
        state.currentQuestionIndex = 0;
        state.assessmentAnswers = new Array(questions.length).fill(null);
        state.timeRemaining = 15 * 60; // 15 minutes
        
        closeModal();
        setupAssessmentModal();
        showModal('assessment-modal');
        startAssessmentTimer();
        showCurrentQuestion();
    }

    function setupAssessmentModal() {
        const concept = state.concepts.find(c => c.id === state.currentAssessment.conceptId);
        elements.assessmentTitle.textContent = `${concept.name} Assessment`;
        elements.questionCount.textContent = `${state.currentAssessment.questions.length} Questions`;
        elements.timeLimit.textContent = '15 minutes';
        elements.totalQuestions.textContent = state.currentAssessment.questions.length;
        
        // Setup question indicators
        elements.questionIndicators.innerHTML = '';
        for (let i = 0; i < state.currentAssessment.questions.length; i++) {
            const indicator = document.createElement('div');
            indicator.className = 'question-indicator';
            indicator.textContent = i + 1;
            indicator.addEventListener('click', () => goToQuestion(i));
            elements.questionIndicators.appendChild(indicator);
        }
    }

    function startAssessmentTimer() {
        state.assessmentTimer = setInterval(() => {
            state.timeRemaining--;
            
            const minutes = Math.floor(state.timeRemaining / 60);
            const seconds = state.timeRemaining % 60;
            elements.timerText.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            
            if (state.timeRemaining <= 0) {
                clearInterval(state.assessmentTimer);
                submitAssessment();
            }
        }, 1000);
    }

    function showCurrentQuestion() {
        const question = state.currentAssessment.questions[state.currentQuestionIndex];
        
        elements.currentQuestion.textContent = state.currentQuestionIndex + 1;
        elements.questionType.textContent = 'Multiple Choice';
        elements.questionMarks.textContent = '2 marks';
        elements.questionText.textContent = question.question;
        
        // Setup options
        elements.optionsSection.innerHTML = '';
        question.options.forEach((option, index) => {
            const optionDiv = document.createElement('div');
            optionDiv.className = 'option-item';
            optionDiv.setAttribute('data-option', String.fromCharCode(65 + index)); // A, B, C, D
            optionDiv.innerHTML = `<div class="option-text">${option}</div>`;
            
            if (state.assessmentAnswers[state.currentQuestionIndex] === index) {
                optionDiv.classList.add('selected');
            }
            
            optionDiv.addEventListener('click', () => selectOption(index));
            elements.optionsSection.appendChild(optionDiv);
        });
        
        // Update navigation
        updateAssessmentNavigation();
        
        // Update question indicators
        updateQuestionIndicators();
    }

    function selectOption(optionIndex) {
        // Clear previous selection
        document.querySelectorAll('.option-item').forEach(opt => opt.classList.remove('selected'));
        
        // Select current option
        document.querySelectorAll('.option-item')[optionIndex].classList.add('selected');
        
        // Store answer
        state.assessmentAnswers[state.currentQuestionIndex] = optionIndex;
        
        // Enable navigation buttons
        elements.nextQuestionBtn.disabled = false;
        elements.submitAssessmentBtn.disabled = false;
        
        // Update question indicator
        updateQuestionIndicators();
    }

    function updateAssessmentNavigation() {
        elements.prevQuestionBtn.disabled = state.currentQuestionIndex === 0;
        
        const isLastQuestion = state.currentQuestionIndex === state.currentAssessment.questions.length - 1;
        const hasAnswer = state.assessmentAnswers[state.currentQuestionIndex] !== null;
        
        if (isLastQuestion) {
            elements.nextQuestionBtn.style.display = 'none';
            elements.submitAssessmentBtn.style.display = 'inline-block';
            elements.submitAssessmentBtn.disabled = !hasAnswer;
        } else {
            elements.nextQuestionBtn.style.display = 'inline-block';
            elements.submitAssessmentBtn.style.display = 'none';
            elements.nextQuestionBtn.disabled = !hasAnswer;
        }
    }

    function updateQuestionIndicators() {
        const indicators = elements.questionIndicators.children;
        for (let i = 0; i < indicators.length; i++) {
            const indicator = indicators[i];
            indicator.className = 'question-indicator';
            
            if (i === state.currentQuestionIndex) {
                indicator.classList.add('current');
            } else if (state.assessmentAnswers[i] !== null) {
                indicator.classList.add('answered');
            }
        }
    }

    function goToQuestion(index) {
        state.currentQuestionIndex = index;
        showCurrentQuestion();
    }

    function previousQuestion() {
        if (state.currentQuestionIndex > 0) {
            state.currentQuestionIndex--;
            showCurrentQuestion();
        }
    }

    function nextQuestion() {
        if (state.currentQuestionIndex < state.currentAssessment.questions.length - 1) {
            state.currentQuestionIndex++;
            showCurrentQuestion();
        }
    }

    function submitAssessment() {
        clearInterval(state.assessmentTimer);
        
        // Calculate results
        let correctAnswers = 0;
        const results = state.currentAssessment.questions.map((question, index) => {
            const selectedAnswer = state.assessmentAnswers[index];
            const isCorrect = selectedAnswer === question.correct;
            if (isCorrect) correctAnswers++;
            
            return {
                question: question.question,
                selectedAnswer: selectedAnswer,
                correctAnswer: question.correct,
                isCorrect: isCorrect,
                explanation: question.explanation,
                selectedText: selectedAnswer !== null ? question.options[selectedAnswer] : 'Not answered',
                correctText: question.options[question.correct]
            };
        });
        
        const score = Math.round((correctAnswers / state.currentAssessment.questions.length) * 100);
        const timeTaken = Math.round((Date.now() - state.currentAssessment.startTime) / 1000);
        const passed = score >= 80;
        
        // Update progress
        const classKey = `Class ${state.studentInfo?.class || '10'}`;
        const conceptId = state.currentAssessment.conceptId;
        
        if (passed) {
            state.userProgress[state.currentSubject][classKey][conceptId].status = 'mastered';
            state.userProgress[state.currentSubject][classKey][conceptId].score = score;
            
            // Update study streak
            updateStudyStreak();
            
            // Check for unlocking new concepts
            unlockDependentConcepts(conceptId);
        }
        
        state.userProgress[state.currentSubject][classKey][conceptId].timeSpent += Math.round(timeTaken / 60);
        saveUserProgress();
        
        // Show results
        showAssessmentResults({
            score: score,
            passed: passed,
            correctAnswers: correctAnswers,
            incorrectAnswers: state.currentAssessment.questions.length - correctAnswers,
            timeTaken: Math.floor(timeTaken / 60) + ':' + (timeTaken % 60).toString().padStart(2, '0'),
            results: results
        });
        
        closeModal('assessment-modal');
        showModal('results-modal');
    }

    function showAssessmentResults(results) {
        elements.finalScore.textContent = results.score;
        elements.resultScoreCircle.className = `score-circle ${results.passed ? 'passed' : 'failed'}`;
        
        if (results.passed) {
            elements.resultStatusText.textContent = 'Excellent!';
            elements.resultMessage.textContent = "You've mastered this concept!";
        } else {
            elements.resultStatusText.textContent = 'Keep Practicing!';
            elements.resultMessage.textContent = 'You need 80% to master this concept.';
        }
        
        elements.correctAnswers.textContent = results.correctAnswers;
        elements.incorrectAnswers.textContent = results.incorrectAnswers;
        elements.timeTaken.textContent = results.timeTaken;
        
        // Show detailed feedback
        const feedbackContent = document.querySelector('.feedback-content');
        feedbackContent.innerHTML = '';
        
        results.results.forEach((result, index) => {
            const feedbackItem = document.createElement('div');
            feedbackItem.className = `feedback-item ${result.isCorrect ? 'correct' : 'incorrect'}`;
            feedbackItem.innerHTML = `
                <div class="feedback-question">Q${index + 1}: ${result.question}</div>
                <div class="feedback-answer">Your answer: ${result.selectedText}</div>
                <div class="feedback-answer">Correct answer: ${result.correctText}</div>
                <div class="feedback-explanation">${result.explanation}</div>
            `;
            feedbackContent.appendChild(feedbackItem);
        });
        
        // Show next steps
        showNextSteps(results.passed);
    }

    function showNextSteps(passed) {
        const conceptId = state.currentAssessment.conceptId;
        const nextStepsContainer = elements.nextStepsContent;
        nextStepsContainer.innerHTML = '';
        
        if (passed) {
            // Find dependent concepts that are now unlocked
            const unlockedConcepts = state.concepts.filter(concept => {
                const prereq = state.prerequisites.find(p => p.concept === concept.id);
                return prereq && prereq.requires === conceptId && getConceptStatus(concept.id) === 'available';
            });
            
            if (unlockedConcepts.length > 0) {
                unlockedConcepts.forEach(concept => {
                    const stepItem = document.createElement('div');
                    stepItem.className = 'next-step-item';
                    stepItem.innerHTML = `
                        <div class="next-step-title">New: ${concept.name}</div>
                        <div class="next-step-desc">You've unlocked this concept! Ready to learn?</div>
                    `;
                    stepItem.addEventListener('click', () => {
                        closeModal('results-modal');
                        openConceptModal(concept, 'available');
                    });
                    nextStepsContainer.appendChild(stepItem);
                });
            } else {
                nextStepsContainer.innerHTML = '<p>Great progress! Continue with other available concepts.</p>';
            }
        } else {
            nextStepsContainer.innerHTML = `
                <div class="next-step-item">
                    <div class="next-step-title">Review and Practice</div>
                    <div class="next-step-desc">Study the concept again and solve more practice problems</div>
                </div>
                <div class="next-step-item">
                    <div class="next-step-title">Seek Help</div>
                    <div class="next-step-desc">Ask your teacher or use our AI tutor for doubts</div>
                </div>
            `;
        }
    }

    function unlockDependentConcepts(masteredConceptId) {
        const classKey = `Class ${state.studentInfo?.class || '10'}`;
        
        state.concepts.forEach(concept => {
            const prereq = state.prerequisites.find(p => p.concept === concept.id);
            if (prereq && prereq.requires === masteredConceptId) {
                if (!state.userProgress[state.currentSubject][classKey][concept.id]) {
                    state.userProgress[state.currentSubject][classKey][concept.id] = {
                        status: 'available',
                        score: 0,
                        timeSpent: 0
                    };
                }
            }
        });
        
        saveUserProgress();
    }

    function updateStudyStreak() {
        const today = new Date().toDateString();
        const lastStudyDate = localStorage.getItem('lastStudyDate');
        
        if (lastStudyDate !== today) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            
            if (lastStudyDate === yesterday.toDateString()) {
                state.studyStreak++;
            } else {
                state.studyStreak = 1;
            }
            
            localStorage.setItem('lastStudyDate', today);
            localStorage.setItem('studyStreak', state.studyStreak.toString());
            elements.streakCount.textContent = state.studyStreak;
        }
    }

    // === UI HELPER FUNCTIONS ===
    function showModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.add('show');
        state.activeModal = modalId;
        document.body.style.overflow = 'hidden';
    }

    function closeModal(modalId = null) {
        if (modalId) {
            document.getElementById(modalId).classList.remove('show');
        } else if (state.activeModal) {
            document.getElementById(state.activeModal).classList.remove('show');
        }
        state.activeModal = null;
        document.body.style.overflow = '';
    }

    function openSidebar() {
        elements.progressSidebar.classList.add('open');
        state.sidebarOpen = true;
    }

    function closeSidebar() {
        elements.progressSidebar.classList.remove('open');
        state.sidebarOpen = false;
    }

    function showWelcomeMessage() {
        elements.welcomeMessage.style.display = 'block';
    }

    function hideWelcomeMessage() {
        elements.welcomeMessage.style.display = 'none';
    }

    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification-toast ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease forwards';
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    }

    // === MAP NAVIGATION ===
    function resetView() {
        state.zoomLevel = 1;
        state.panX = 0;
        state.panY = 0;
        updateMapTransform();
    }

    function zoomIn() {
        state.zoomLevel = Math.min(state.zoomLevel * 1.2, 3);
        updateMapTransform();
    }

    function zoomOut() {
        state.zoomLevel = Math.max(state.zoomLevel / 1.2, 0.5);
        updateMapTransform();
    }

    function updateMapTransform() {
        const transform = `scale(${state.zoomLevel}) translate(${state.panX}px, ${state.panY}px)`;
        elements.conceptNodes.style.transform = transform;
        elements.mapSvg.style.transform = transform;
    }

    // === EVENT LISTENERS ===
    function setupEventListeners() {
        // Subject selector
        elements.subjectSelector.addEventListener('change', (e) => {
            if (e.target.value) {
                loadSubjectMap(e.target.value);
            } else {
                state.currentSubject = null;
                clearMap();
                showWelcomeMessage();
                closeSidebar();
                elements.chapterFilter.style.display = 'none';
            }
        });

        // Chapter filter
        elements.chapterFilter.addEventListener('change', (e) => {
            state.currentChapter = e.target.value || null;
            if (state.currentSubject) {
                clearMap();
                drawConnections();
                drawConcepts();
            }
        });

        // Map controls
        elements.zoomInBtn.addEventListener('click', zoomIn);
        elements.zoomOutBtn.addEventListener('click', zoomOut);
        elements.resetViewBtn.addEventListener('click', resetView);
        elements.toggleSidebarBtn.addEventListener('click', () => {
            if (state.sidebarOpen) {
                closeSidebar();
            } else {
                openSidebar();
            }
        });

        // Sidebar controls
        elements.closeSidebarBtn.addEventListener('click', closeSidebar);

        // Assessment navigation
        elements.prevQuestionBtn.addEventListener('click', previousQuestion);
        elements.nextQuestionBtn.addEventListener('click', nextQuestion);
        elements.submitAssessmentBtn.addEventListener('click', submitAssessment);

        // Results modal actions
        elements.retakeAssessmentBtn.addEventListener('click', () => {
            closeModal('results-modal');
            startAssessment(state.currentAssessment.conceptId);
        });

        elements.continueJourneyBtn.addEventListener('click', () => {
            closeModal('results-modal');
            loadSubjectMap(state.currentSubject);
        });

        // Modal close buttons
        document.querySelectorAll('.close-modal-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modalId = e.target.closest('.modal-overlay').id;
                closeModal(modalId);
            });
        });

        // Click outside modal to close
        document.querySelectorAll('.modal-overlay').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeModal(modal.id);
                }
            });
        });

        // Map panning
        let startX, startY;
        elements.mapCanvas.addEventListener('mousedown', (e) => {
            if (e.target === elements.mapCanvas || e.target === elements.mapSvg) {
                state.isDragging = true;
                startX = e.clientX - state.panX;
                startY = e.clientY - state.panY;
                elements.mapCanvas.style.cursor = 'grabbing';
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (state.isDragging) {
                state.panX = e.clientX - startX;
                state.panY = e.clientY - startY;
                updateMapTransform();
            }
        });

        document.addEventListener('mouseup', () => {
            state.isDragging = false;
            elements.mapCanvas.style.cursor = 'default';
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (state.activeModal === 'assessment-modal') {
                if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    previousQuestion();
                } else if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    nextQuestion();
                } else if (e.key >= '1' && e.key <= '4') {
                    e.preventDefault();
                    const optionIndex = parseInt(e.key) - 1;
                    if (optionIndex < state.currentAssessment.questions[state.currentQuestionIndex].options.length) {
                        selectOption(optionIndex);
                    }
                }
            }
            
            if (e.key === 'Escape' && state.activeModal) {
                closeModal();
            }
        });

        // Logout functionality
        document.querySelector('.logout-link').addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                await fetch(`${API_URL}/logout`, { method: 'POST', credentials: 'include' });
                localStorage.clear();
                window.location.href = 'login.html';
            } catch (error) {
                console.error('Logout error:', error);
                localStorage.clear();
                window.location.href = 'login.html';
            }
        });

        // Responsive sidebar handling
        window.addEventListener('resize', () => {
            if (window.innerWidth <= 768 && state.sidebarOpen) {
                // Keep sidebar behavior consistent on mobile
            }
        });

        // Prevent zoom on double tap (mobile)
        let lastTouchEnd = 0;
        document.addEventListener('touchend', (e) => {
            const now = (new Date()).getTime();
            if (now - lastTouchEnd <= 300) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        }, false);
    }


// === INDIAN EDUCATION SYSTEM CURRICULUM DATA ===
const INDIAN_CURRICULUM = {
    'Mathematics': {
        board: ['CBSE', 'ICSE', 'Maharashtra', 'UP', 'Karnataka', 'Tamil Nadu'],
        classes: ['6', '7', '8', '9', '10', '11', '12'],
        concepts: {
            'Class 6': [
                { id: 'whole-numbers', name: 'Whole Numbers', chapter: 'Ch 1', icon: 'fa-calculator', x: 200, y: 150, difficulty: 1, duration: 45 },
                { id: 'integers', name: 'Integers', chapter: 'Ch 2', icon: 'fa-plus-minus', x: 350, y: 150, difficulty: 2, duration: 60 },
                { id: 'fractions', name: 'Fractions', chapter: 'Ch 3', icon: 'fa-divide', x: 500, y: 150, difficulty: 2, duration: 75 },
                { id: 'decimals', name: 'Decimals', chapter: 'Ch 4', icon: 'fa-dot-circle', x: 650, y: 150, difficulty: 2, duration: 60 },
                { id: 'basic-geometry', name: 'Basic Geometry', chapter: 'Ch 5', icon: 'fa-shapes', x: 350, y: 300, difficulty: 3, duration: 90 },
                { id: 'mensuration', name: 'Mensuration', chapter: 'Ch 6', icon: 'fa-ruler', x: 500, y: 300, difficulty: 3, duration: 90 }
            ],
            'Class 9': [
                { id: 'number-systems', name: 'Number Systems', chapter: 'Ch 1', icon: 'fa-infinity', x: 200, y: 150, difficulty: 2, duration: 90 },
                { id: 'polynomials', name: 'Polynomials', chapter: 'Ch 2', icon: 'fa-superscript', x: 350, y: 150, difficulty: 3, duration: 120 },
                { id: 'coordinate-geometry', name: 'Coordinate Geometry', chapter: 'Ch 3', icon: 'fa-crosshairs', x: 500, y: 150, difficulty: 3, duration: 105 },
                { id: 'linear-equations-2var', name: 'Linear Equations in Two Variables', chapter: 'Ch 4', icon: 'fa-chart-line', x: 650, y: 150, difficulty: 4, duration: 135 },
                { id: 'euclid-geometry', name: 'Introduction to Euclid Geometry', chapter: 'Ch 5', icon: 'fa-compass', x: 350, y: 300, difficulty: 3, duration: 90 },
                { id: 'lines-angles', name: 'Lines and Angles', chapter: 'Ch 6', icon: 'fa-angle-right', x: 500, y: 300, difficulty: 3, duration: 105 },
                { id: 'triangles', name: 'Triangles', chapter: 'Ch 7', icon: 'fa-play', x: 650, y: 300, difficulty: 4, duration: 120 },
                { id: 'quadrilaterals', name: 'Quadrilaterals', chapter: 'Ch 8', icon: 'fa-square', x: 800, y: 300, difficulty: 4, duration: 120 },
                { id: 'areas-parallelograms', name: 'Areas of Parallelograms and Triangles', chapter: 'Ch 9', icon: 'fa-vector-square', x: 500, y: 450, difficulty: 4, duration: 135 },
                { id: 'circles', name: 'Circles', chapter: 'Ch 10', icon: 'fa-circle', x: 650, y: 450, difficulty: 4, duration: 120 },
                { id: 'constructions', name: 'Constructions', chapter: 'Ch 11', icon: 'fa-drafting-compass', x: 800, y: 450, difficulty: 3, duration: 90 },
                { id: 'herons-formula', name: "Heron's Formula", chapter: 'Ch 12', icon: 'fa-triangle', x: 500, y: 600, difficulty: 3, duration: 75 },
                { id: 'surface-areas-volumes', name: 'Surface Areas and Volumes', chapter: 'Ch 13', icon: 'fa-cube', x: 650, y: 600, difficulty: 4, duration: 150 },
                { id: 'statistics', name: 'Statistics', chapter: 'Ch 14', icon: 'fa-chart-bar', x: 800, y: 600, difficulty: 3, duration: 105 },
                { id: 'probability', name: 'Probability', chapter: 'Ch 15', icon: 'fa-dice', x: 950, y: 600, difficulty: 3, duration: 90 }
            ],
            'Class 10': [
                { id: 'real-numbers', name: 'Real Numbers', chapter: 'Ch 1', icon: 'fa-infinity', x: 200, y: 150, difficulty: 3, duration: 120 },
                { id: 'polynomials-10', name: 'Polynomials', chapter: 'Ch 2', icon: 'fa-function', x: 350, y: 150, difficulty: 3, duration: 135 },
                { id: 'linear-equations-pair', name: 'Pair of Linear Equations', chapter: 'Ch 3', icon: 'fa-equals', x: 500, y: 150, difficulty: 4, duration: 150 },
                { id: 'quadratic-equations', name: 'Quadratic Equations', chapter: 'Ch 4', icon: 'fa-square-root-alt', x: 650, y: 150, difficulty: 4, duration: 165 },
                { id: 'arithmetic-progressions', name: 'Arithmetic Progressions', chapter: 'Ch 5', icon: 'fa-list-ol', x: 800, y: 150, difficulty: 4, duration: 135 },
                { id: 'triangles-10', name: 'Triangles', chapter: 'Ch 6', icon: 'fa-play', x: 350, y: 300, difficulty: 4, duration: 150 },
                { id: 'coordinate-geometry-10', name: 'Coordinate Geometry', chapter: 'Ch 7', icon: 'fa-map-marked', x: 500, y: 300, difficulty: 4, duration: 135 },
                { id: 'trigonometry', name: 'Introduction to Trigonometry', chapter: 'Ch 8', icon: 'fa-wave-square', x: 650, y: 300, difficulty: 5, duration: 180 },
                { id: 'trigonometry-applications', name: 'Applications of Trigonometry', chapter: 'Ch 9', icon: 'fa-mountain', x: 800, y: 300, difficulty: 5, duration: 165 },
                { id: 'circles-10', name: 'Circles', chapter: 'Ch 10', icon: 'fa-circle-notch', x: 500, y: 450, difficulty: 4, duration: 150 },
                { id: 'constructions-10', name: 'Constructions', chapter: 'Ch 11', icon: 'fa-compass', x: 650, y: 450, difficulty: 4, duration: 120 },
                { id: 'areas-related-circles', name: 'Areas Related to Circles', chapter: 'Ch 12', icon: 'fa-ring', x: 800, y: 450, difficulty: 4, duration: 135 },
                { id: 'surface-areas-volumes-10', name: 'Surface Areas and Volumes', chapter: 'Ch 13', icon: 'fa-cube', x: 650, y: 600, difficulty: 4, duration: 165 },
                { id: 'statistics-10', name: 'Statistics', chapter: 'Ch 14', icon: 'fa-chart-line', x: 800, y: 600, difficulty: 4, duration: 135 },
                { id: 'probability-10', name: 'Probability', chapter: 'Ch 15', icon: 'fa-percentage', x: 950, y: 600, difficulty: 4, duration: 120 }
            ]
        },
        prerequisites: {
            'Class 6': [
                { concept: 'integers', requires: 'whole-numbers' },
                { concept: 'fractions', requires: 'integers' },
                { concept: 'decimals', requires: 'fractions' },
                { concept: 'basic-geometry', requires: 'whole-numbers' },
                { concept: 'mensuration', requires: 'basic-geometry' }
            ],
            'Class 9': [
                { concept: 'polynomials', requires: 'number-systems' },
                { concept: 'coordinate-geometry', requires: 'number-systems' },
                { concept: 'linear-equations-2var', requires: 'polynomials' },
                { concept: 'lines-angles', requires: 'euclid-geometry' },
                { concept: 'triangles', requires: 'lines-angles' },
                { concept: 'quadrilaterals', requires: 'triangles' },
                { concept: 'areas-parallelograms', requires: 'quadrilaterals' },
                { concept: 'circles', requires: 'triangles' },
                { concept: 'constructions', requires: 'triangles' },
                { concept: 'surface-areas-volumes', requires: 'mensuration' },
                { concept: 'herons-formula', requires: 'triangles' }
            ],
            'Class 10': [
                { concept: 'polynomials-10', requires: 'real-numbers' },
                { concept: 'linear-equations-pair', requires: 'polynomials-10' },
                { concept: 'quadratic-equations', requires: 'polynomials-10' },
                { concept: 'arithmetic-progressions', requires: 'real-numbers' },
                { concept: 'coordinate-geometry-10', requires: 'triangles-10' },
                { concept: 'trigonometry', requires: 'triangles-10' },
                { concept: 'trigonometry-applications', requires: 'trigonometry' },
                { concept: 'circles-10', requires: 'triangles-10' },
                { concept: 'constructions-10', requires: 'circles-10' },
                { concept: 'areas-related-circles', requires: 'circles-10' },
                { concept: 'surface-areas-volumes-10', requires: 'triangles-10' },
                { concept: 'statistics-10', requires: 'real-numbers' },
                { concept: 'probability-10', requires: 'statistics-10' }
            ]
        }
    },
    'Science': {
        board: ['CBSE', 'ICSE', 'Maharashtra', 'UP', 'Karnataka', 'Tamil Nadu'],
        classes: ['6', '7', '8', '9', '10'],
        concepts: {
            'Class 9': [
                { id: 'matter-surroundings', name: 'Matter in Our Surroundings', chapter: 'Ch 1', icon: 'fa-atom', x: 200, y: 150, difficulty: 2, duration: 90 },
                { id: 'particle-matter', name: 'Is Matter Around Us Pure?', chapter: 'Ch 2', icon: 'fa-flask', x: 350, y: 150, difficulty: 3, duration: 105 },
                { id: 'atoms-molecules', name: 'Atoms and Molecules', chapter: 'Ch 3', icon: 'fa-circle', x: 500, y: 150, difficulty: 3, duration: 120 },
                { id: 'structure-atom', name: 'Structure of Atom', chapter: 'Ch 4', icon: 'fa-atom', x: 650, y: 150, difficulty: 4, duration: 135 },
                { id: 'life-fundamental-unit', name: 'Fundamental Unit of Life', chapter: 'Ch 5', icon: 'fa-microscope', x: 200, y: 300, difficulty: 3, duration: 120 },
                { id: 'tissues', name: 'Tissues', chapter: 'Ch 6', icon: 'fa-layer-group', x: 350, y: 300, difficulty: 3, duration: 105 },
                { id: 'diversity-living-organisms', name: 'Diversity in Living Organisms', chapter: 'Ch 7', icon: 'fa-tree', x: 500, y: 300, difficulty: 4, duration: 150 },
                { id: 'motion', name: 'Motion', chapter: 'Ch 8', icon: 'fa-running', x: 650, y: 300, difficulty: 4, duration: 135 },
                { id: 'force-laws-motion', name: 'Force and Laws of Motion', chapter: 'Ch 9', icon: 'fa-arrows-alt', x: 800, y: 300, difficulty: 5, duration: 165 },
                { id: 'gravitation', name: 'Gravitation', chapter: 'Ch 10', icon: 'fa-globe', x: 950, y: 300, difficulty: 4, duration: 120 },
                { id: 'work-energy', name: 'Work and Energy', chapter: 'Ch 11', icon: 'fa-bolt', x: 800, y: 450, difficulty: 4, duration: 135 },
                { id: 'sound', name: 'Sound', chapter: 'Ch 12', icon: 'fa-volume-up', x: 650, y: 450, difficulty: 3, duration: 105 },
                { id: 'why-fall-ill', name: 'Why Do We Fall Ill?', chapter: 'Ch 13', icon: 'fa-heartbeat', x: 350, y: 450, difficulty: 3, duration: 90 },
                { id: 'natural-resources', name: 'Natural Resources', chapter: 'Ch 14', icon: 'fa-leaf', x: 500, y: 450, difficulty: 3, duration: 105 },
                { id: 'improvement-food-resources', name: 'Improvement in Food Resources', chapter: 'Ch 15', icon: 'fa-seedling', x: 200, y: 450, difficulty: 4, duration: 120 }
            ],
            'Class 10': [
                { id: 'chemical-reactions', name: 'Chemical Reactions and Equations', chapter: 'Ch 1', icon: 'fa-flask', x: 200, y: 150, difficulty: 3, duration: 120 },
                { id: 'acids-bases-salts', name: 'Acids, Bases and Salts', chapter: 'Ch 2', icon: 'fa-vial', x: 350, y: 150, difficulty: 4, duration: 135 },
                { id: 'metals-nonmetals', name: 'Metals and Non-metals', chapter: 'Ch 3', icon: 'fa-coins', x: 500, y: 150, difficulty: 4, duration: 150 }
            ]
        }
    }
};