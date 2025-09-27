// knowledge-map.js - Refactored Frontend with Clean Architecture
// Removes static data and focuses on API-driven functionality

document.addEventListener('DOMContentLoaded', () => {
    const API_URL = "http://localhost:5000";

    // ============= API SERVICE LAYER =============
    const apiService = {
        // Authentication check
        async checkAuth() {
            const response = await fetch(`${API_URL}/api/me`, { credentials: 'include' });
            if (!response.ok) throw new Error('Authentication failed');
            return response.json();
        },

        // Knowledge Map APIs
        async getSubjects() {
            const response = await fetch(`${API_URL}/api/knowledge/subjects`, { 
                credentials: 'include' 
            });
            if (!response.ok) throw new Error('Failed to fetch subjects');
            return response.json();
        },

        async getSubjectMap(subjectId) {
            const response = await fetch(`${API_URL}/api/knowledge/subject/${subjectId}/map`, {
                credentials: 'include'
            });
            if (!response.ok) throw new Error('Failed to fetch knowledge map');
            return response.json();
        },

        async startLearning(conceptId) {
            const response = await fetch(`${API_URL}/api/knowledge/concepts/${conceptId}/start`, {
                method: 'POST',
                credentials: 'include'
            });
            if (!response.ok) throw new Error('Failed to start learning');
            return response.json();
        },

        async getQuiz(conceptId) {
            const response = await fetch(`${API_URL}/api/knowledge/concepts/${conceptId}/quiz`, {
                credentials: 'include'
            });
            if (!response.ok) throw new Error('Failed to fetch quiz');
            return response.json();
        },

        async submitQuiz(conceptId, answers, timeSpent) {
            const response = await fetch(`${API_URL}/api/knowledge/concepts/${conceptId}/quiz/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ answers, timeSpent })
            });
            if (!response.ok) throw new Error('Failed to submit quiz');
            return response.json();
        },

        async updateProgress(conceptId, timeSpent) {
            const response = await fetch(`${API_URL}/api/knowledge/concepts/${conceptId}/progress`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ timeSpent })
            });
            if (!response.ok) throw new Error('Failed to update progress');
            return response.json();
        },

        async getAnalytics() {
            const response = await fetch(`${API_URL}/api/knowledge/analytics`, {
                credentials: 'include'
            });
            if (!response.ok) throw new Error('Failed to fetch analytics');
            return response.json();
        },

        async getRecommendations() {
            const response = await fetch(`${API_URL}/api/knowledge/recommendations`, {
                credentials: 'include'
            });
            if (!response.ok) throw new Error('Failed to fetch recommendations');
            return response.json();
        }
    };

    // ============= STATE MANAGEMENT =============
    class AppState {
        constructor() {
            this.userInfo = null;
            this.studentInfo = null;
            this.subjects = [];
            this.currentSubject = null;
            this.currentSubjectId = null;
            this.concepts = [];
            this.mapData = null;
            
            // UI State
            this.zoomLevel = 1;
            this.panX = 0;
            this.panY = 0;
            this.isDragging = false;
            this.sidebarOpen = false;
            this.activeModal = null;
            
            // Assessment State
            this.currentAssessment = null;
            this.currentQuestionIndex = 0;
            this.assessmentAnswers = [];
            this.assessmentTimer = null;
            this.timeRemaining = 900;
            
            // Analytics
            this.analytics = null;
            this.studyStreak = 0;
        }

        // State update methods with UI refresh
        setUserInfo(userInfo, studentInfo) {
            this.userInfo = userInfo;
            this.studentInfo = studentInfo;
            ui.updateStudentInfo();
        }

        setSubjects(subjects) {
            this.subjects = subjects;
            ui.populateSubjectsDropdown();
        }

        setCurrentSubject(subjectName, subjectId) {
            this.currentSubject = subjectName;
            this.currentSubjectId = subjectId;
            ui.updateSubjectDisplay();
        }

        setMapData(mapData) {
            this.mapData = mapData;
            this.concepts = mapData.concepts || [];
            ui.renderMap();
            ui.updateProgressStats();
            this.loadRecommendations();
        }

        setAnalytics(analytics) {
            this.analytics = analytics;
            this.studyStreak = analytics.studyStreak || 0;
            ui.updateAnalytics();
        }

        // Assessment state management
        startAssessment(quiz, conceptId) {
            this.currentAssessment = {
                conceptId,
                questions: quiz.questions,
                timeLimit: quiz.time_limit,
                startTime: Date.now()
            };
            this.currentQuestionIndex = 0;
            this.assessmentAnswers = new Array(quiz.questions.length).fill(null);
            this.timeRemaining = quiz.time_limit;
        }

        async loadRecommendations() {
            try {
                const recommendations = await apiService.getRecommendations();
                ui.updateRecommendations(recommendations.recommendations || []);
            } catch (error) {
                console.error('Failed to load recommendations:', error);
            }
        }
    }

    // ============= UI MANAGEMENT =============
    class UIManager {
        constructor() {
            this.elements = this.getDOMElements();
        }

        getDOMElements() {
            return {
                // Header controls
                subjectSelector: document.getElementById('subject-selector'),
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
                streakCount: document.getElementById('streak-count'),
                
                // Modals
                conceptModal: document.getElementById('concept-modal'),
                assessmentModal: document.getElementById('assessment-modal'),
                resultsModal: document.getElementById('results-modal'),
                
                // Concept modal elements
                conceptTitle: document.getElementById('concept-title'),
                conceptStatusBadge: document.getElementById('concept-status-badge'),
                conceptDescription: document.getElementById('concept-description'),
                startLearningBtn: document.getElementById('start-learning-btn'),
                continueLearningBtn: document.getElementById('continue-learning-btn'),
                takeAssessmentBtn: document.getElementById('take-assessment-btn'),
                reviewConceptBtn: document.getElementById('review-concept-btn'),
                
                // Assessment elements
                assessmentTitle: document.getElementById('assessment-title'),
                currentQuestion: document.getElementById('current-question'),
                totalQuestions: document.getElementById('total-questions'),
                timerText: document.getElementById('timer-text'),
                questionText: document.getElementById('question-text'),
                optionsSection: document.getElementById('options-section'),
                prevQuestionBtn: document.getElementById('prev-question-btn'),
                nextQuestionBtn: document.getElementById('next-question-btn'),
                submitAssessmentBtn: document.getElementById('submit-assessment-btn'),
                
                // Results elements
                finalScore: document.getElementById('final-score'),
                resultStatusText: document.getElementById('result-status-text'),
                resultMessage: document.getElementById('result-message'),
                correctAnswers: document.getElementById('correct-answers'),
                incorrectAnswers: document.getElementById('incorrect-answers'),
                continueJourneyBtn: document.getElementById('continue-journey-btn')
            };
        }

        // Student info display
        updateStudentInfo() {
            if (state.studentInfo) {
                this.elements.studentBoardInfo.textContent = `${state.studentInfo.board} Board`;
                this.elements.studentClassInfo.textContent = `Class ${state.studentInfo.class}`;
                if (state.studentInfo.stream) {
                    this.elements.studentClassInfo.textContent += ` (${state.studentInfo.stream})`;
                }
            }
        }

        // Subjects dropdown
        populateSubjectsDropdown() {
            this.elements.subjectSelector.innerHTML = '<option value="">Choose Subject</option>';
            state.subjects.forEach(subject => {
                const option = document.createElement('option');
                option.value = subject.id;
                option.textContent = subject.subject_name;
                this.elements.subjectSelector.appendChild(option);
            });
        }

        updateSubjectDisplay() {
            this.elements.subjectNameDisplay.textContent = state.currentSubject || 'Select Subject';
        }

        // Map rendering
        renderMap() {
            if (!state.mapData || !state.concepts.length) {
                this.showWelcomeMessage();
                return;
            }

            this.hideWelcomeMessage();
            this.clearMap();
            this.drawConnections();
            this.drawConcepts();
            this.openSidebar();
        }

        clearMap() {
            // Clear SVG
            this.elements.mapSvg.innerHTML = `
                <defs>
                    <marker id="arrowhead-completed" markerWidth="12" markerHeight="8" refX="10" refY="4" orient="auto">
                        <polygon points="0 0, 12 4, 0 8" fill="#27ae60" opacity="0.8"/>
                    </marker>
                    <marker id="arrowhead-unlocked" markerWidth="12" markerHeight="8" refX="10" refY="4" orient="auto">
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
            this.elements.conceptNodes.innerHTML = '';
        }

        drawConnections() {
            if (!state.concepts || state.concepts.length === 0) return;

            state.concepts.forEach(concept => {
                if (concept.prerequisites && concept.prerequisites.length > 0) {
                    concept.prerequisites.forEach(prereq => {
                        const fromConcept = state.concepts.find(c => c.concept_id === prereq.prerequisite_concept_id);
                        
                        if (fromConcept) {
                            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                            line.setAttribute('x1', fromConcept.position_x);
                            line.setAttribute('y1', fromConcept.position_y);
                            line.setAttribute('x2', concept.position_x);
                            line.setAttribute('y2', concept.position_y);
                            
                            const fromStatus = this.getConceptStatus(fromConcept);
                            const toStatus = this.getConceptStatus(concept);
                            
                            // Style connection based on status
                            if (fromStatus === 'completed' && toStatus !== 'locked') {
                                line.setAttribute('stroke', '#27ae60');
                                line.setAttribute('marker-end', 'url(#arrowhead-completed)');
                                line.setAttribute('opacity', '0.8');
                            } else if (fromStatus === 'completed' || fromStatus === 'in_progress') {
                                line.setAttribute('stroke', '#f39c12');
                                line.setAttribute('marker-end', 'url(#arrowhead-unlocked)');
                                line.setAttribute('opacity', '0.6');
                            } else {
                                line.setAttribute('stroke', '#95a5a6');
                                line.setAttribute('marker-end', 'url(#arrowhead-locked)');
                                line.setAttribute('opacity', '0.4');
                            }
                            
                            line.setAttribute('stroke-width', '3');
                            line.classList.add('connection-line');
                            
                            this.elements.mapSvg.appendChild(line);
                        }
                    });
                }
            });
        }

        drawConcepts() {
            state.concepts.forEach((concept, index) => {
                setTimeout(() => {
                    const node = this.createConceptNode(concept);
                    node.classList.add('revealing');
                    this.elements.conceptNodes.appendChild(node);
                }, index * 100);
            });
        }

        getConceptStatus(concept) {
            if (!concept.student_progress || concept.student_progress.length === 0) {
                return 'locked';
            }
            return concept.student_progress[0].status;
        }

        createConceptNode(concept) {
            const status = this.getConceptStatus(concept);
            const statusClass = this.getStatusClass(status);
            
            const node = document.createElement('div');
            node.className = `concept-node ${statusClass}`;
            node.style.left = `${concept.position_x}px`;
            node.style.top = `${concept.position_y}px`;
            node.setAttribute('data-concept-id', concept.concept_id);
            
            node.innerHTML = `
                <div class="concept-icon">
                    <i class="fas ${concept.icon_class}"></i>
                </div>
                <div class="concept-name">${concept.concept_name}</div>
            `;
            
            node.addEventListener('click', () => this.openConceptModal(concept));
            node.title = `${concept.concept_name} - ${status.toUpperCase()}`;
            
            return node;
        }

        getStatusClass(status) {
            const statusMap = {
                'completed': 'mastered',
                'in_progress': 'learning',
                'unlocked': 'available',
                'locked': 'locked'
            };
            return statusMap[status] || 'locked';
        }

        // Progress statistics
        updateProgressStats() {
            if (!state.concepts || state.concepts.length === 0) return;

            const total = state.concepts.length;
            const stats = state.concepts.reduce((acc, concept) => {
                const status = this.getConceptStatus(concept);
                acc[status] = (acc[status] || 0) + 1;
                return acc;
            }, {});

            const mastered = stats.completed || 0;
            const learning = stats.in_progress || 0;
            const available = stats.unlocked || 0;
            const locked = stats.locked || 0;

            // Update counts
            this.elements.masteredCount.textContent = mastered;
            this.elements.learningCount.textContent = learning;
            this.elements.availableCount.textContent = available;
            this.elements.lockedCount.textContent = locked;

            // Update progress ring
            const percentage = total > 0 ? Math.round((mastered / total) * 100) : 0;
            this.elements.progressPercentage.textContent = `${percentage}%`;
            
            const circumference = 339.292;
            const offset = circumference - (percentage / 100) * circumference;
            this.elements.progressRingFill.style.strokeDashoffset = offset;
        }

        updateAnalytics() {
            if (state.analytics) {
                this.elements.streakCount.textContent = state.studyStreak;
            }
        }

        updateRecommendations(recommendations) {
            if (!recommendations || recommendations.length === 0) {
                this.elements.recommendationsList.innerHTML = '<p class="empty-state">All caught up! Great progress!</p>';
                return;
            }

            this.elements.recommendationsList.innerHTML = '';
            recommendations.forEach(rec => {
                const concept = rec.knowledge_concepts;
                const item = document.createElement('div');
                item.className = 'recommendation-item';
                item.innerHTML = `
                    <div class="recommendation-title">${concept.concept_name}</div>
                    <div class="recommendation-desc">${concept.description || 'Important concept to master'}</div>
                    <div class="recommendation-meta">
                        <span class="meta-badge">${concept.estimated_time_minutes} mins</span>
                        <span class="meta-badge">${this.getDifficultyText(concept.difficulty_level)}</span>
                        <span class="meta-badge">${concept.knowledge_subjects.subject_name}</span>
                    </div>
                `;
                item.addEventListener('click', () => {
                    // Find full concept data and open modal
                    const fullConcept = state.concepts.find(c => c.concept_id === rec.concept_id);
                    if (fullConcept) {
                        this.openConceptModal(fullConcept);
                    }
                });
                this.elements.recommendationsList.appendChild(item);
            });
        }

        getDifficultyText(difficulty) {
            const levels = ['Beginner', 'Easy', 'Medium', 'Hard', 'Advanced'];
            return levels[difficulty - 1] || 'Medium';
        }

        // Modal management
        openConceptModal(concept) {
            const status = this.getConceptStatus(concept);
            const progress = concept.student_progress?.[0] || {};
            
            // Update modal content
            this.elements.conceptTitle.textContent = concept.concept_name;
            this.elements.conceptStatusBadge.className = `status-badge ${this.getStatusClass(status)}`;
            this.elements.conceptStatusBadge.textContent = status.toUpperCase().replace('_', ' ');
            this.elements.conceptDescription.textContent = concept.description || 'Master this important concept in your curriculum.';
            
            // Update action buttons
            this.updateConceptActionButtons(status, concept.concept_id, progress);
            
            // Show modal
            this.showModal('concept-modal');
        }

        updateConceptActionButtons(status, conceptId, progress) {
            // Hide all buttons
            this.elements.startLearningBtn.style.display = 'none';
            this.elements.continueLearningBtn.style.display = 'none';
            this.elements.takeAssessmentBtn.style.display = 'none';
            this.elements.reviewConceptBtn.style.display = 'none';

            // Show appropriate buttons
            if (status === 'unlocked') {
                this.elements.startLearningBtn.style.display = 'inline-block';
                this.elements.startLearningBtn.onclick = () => conceptActions.startLearning(conceptId);
            } else if (status === 'in_progress') {
                this.elements.continueLearningBtn.style.display = 'inline-block';
                this.elements.takeAssessmentBtn.style.display = 'inline-block';
                this.elements.continueLearningBtn.onclick = () => conceptActions.continueLearning(conceptId);
                this.elements.takeAssessmentBtn.onclick = () => conceptActions.takeAssessment(conceptId);
            } else if (status === 'completed') {
                this.elements.reviewConceptBtn.style.display = 'inline-block';
                this.elements.takeAssessmentBtn.style.display = 'inline-block';
                this.elements.reviewConceptBtn.onclick = () => conceptActions.reviewConcept(conceptId);
                this.elements.takeAssessmentBtn.onclick = () => conceptActions.takeAssessment(conceptId);
            }
        }

        // Assessment UI
        setupAssessmentModal(quiz, conceptId) {
            const concept = state.concepts.find(c => c.concept_id === conceptId);
            this.elements.assessmentTitle.textContent = `${concept.concept_name} Assessment`;
            this.elements.totalQuestions.textContent = quiz.questions.length;
            
            // Setup question indicators
            const indicatorsContainer = document.getElementById('question-indicators');
            if (indicatorsContainer) {
                indicatorsContainer.innerHTML = '';
                for (let i = 0; i < quiz.questions.length; i++) {
                    const indicator = document.createElement('div');
                    indicator.className = 'question-indicator';
                    indicator.textContent = i + 1;
                    indicator.addEventListener('click', () => assessmentManager.goToQuestion(i));
                    indicatorsContainer.appendChild(indicator);
                }
            }
        }

        showCurrentQuestion() {
            if (!state.currentAssessment) return;

            const question = state.currentAssessment.questions[state.currentQuestionIndex];
            
            this.elements.currentQuestion.textContent = state.currentQuestionIndex + 1;
            this.elements.questionText.textContent = question.question_text;
            
            // Setup options
            this.elements.optionsSection.innerHTML = '';
            question.options.forEach((option, index) => {
                const optionDiv = document.createElement('div');
                optionDiv.className = 'option-item';
                optionDiv.setAttribute('data-option', String.fromCharCode(65 + index));
                optionDiv.innerHTML = `<div class="option-text">${option}</div>`;
                
                if (state.assessmentAnswers[state.currentQuestionIndex] === index) {
                    optionDiv.classList.add('selected');
                }
                
                optionDiv.addEventListener('click', () => assessmentManager.selectOption(index));
                this.elements.optionsSection.appendChild(optionDiv);
            });
            
            this.updateAssessmentNavigation();
        }

        updateAssessmentNavigation() {
            this.elements.prevQuestionBtn.disabled = state.currentQuestionIndex === 0;
            
            const isLastQuestion = state.currentQuestionIndex === state.currentAssessment.questions.length - 1;
            const hasAnswer = state.assessmentAnswers[state.currentQuestionIndex] !== null;
            
            if (isLastQuestion) {
                this.elements.nextQuestionBtn.style.display = 'none';
                this.elements.submitAssessmentBtn.style.display = 'inline-block';
                this.elements.submitAssessmentBtn.disabled = !hasAnswer;
            } else {
                this.elements.nextQuestionBtn.style.display = 'inline-block';
                this.elements.submitAssessmentBtn.style.display = 'none';
                this.elements.nextQuestionBtn.disabled = !hasAnswer;
            }
        }

        showAssessmentResults(results) {
            this.elements.finalScore.textContent = results.score;
            
            if (results.passed) {
                this.elements.resultStatusText.textContent = 'Excellent!';
                this.elements.resultMessage.textContent = "You've mastered this concept!";
            } else {
                this.elements.resultStatusText.textContent = 'Keep Practicing!';
                this.elements.resultMessage.textContent = 'You need 80% to master this concept.';
            }
            
            this.elements.correctAnswers.textContent = results.correctAnswers;
            this.elements.incorrectAnswers.textContent = results.incorrectAnswers;
        }

        // Utility methods
        showModal(modalId) {
            const modal = document.getElementById(modalId);
            modal.classList.add('show');
            state.activeModal = modalId;
            document.body.style.overflow = 'hidden';
        }

        closeModal(modalId = null) {
            if (modalId) {
                document.getElementById(modalId).classList.remove('show');
            } else if (state.activeModal) {
                document.getElementById(state.activeModal).classList.remove('show');
            }
            state.activeModal = null;
            document.body.style.overflow = '';
        }

        openSidebar() {
            this.elements.progressSidebar.classList.add('open');
            state.sidebarOpen = true;
        }

        closeSidebar() {
            this.elements.progressSidebar.classList.remove('open');
            state.sidebarOpen = false;
        }

        showWelcomeMessage() {
            this.elements.welcomeMessage.style.display = 'block';
        }

        hideWelcomeMessage() {
            this.elements.welcomeMessage.style.display = 'none';
        }

        showNotification(message, type = 'info') {
            const notification = document.createElement('div');
            notification.className = `notification-toast ${type}`;
            notification.textContent = message;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.style.animation = 'slideOutRight 0.3s ease forwards';
                setTimeout(() => notification.remove(), 300);
            }, 4000);
        }

        // Map navigation
        resetView() {
            state.zoomLevel = 1;
            state.panX = 0;
            state.panY = 0;
            this.updateMapTransform();
        }

        zoomIn() {
            state.zoomLevel = Math.min(state.zoomLevel * 1.2, 3);
            this.updateMapTransform();
        }

        zoomOut() {
            state.zoomLevel = Math.max(state.zoomLevel / 1.2, 0.5);
            this.updateMapTransform();
        }

        updateMapTransform() {
            const transform = `scale(${state.zoomLevel}) translate(${state.panX}px, ${state.panY}px)`;
            this.elements.conceptNodes.style.transform = transform;
            this.elements.mapSvg.style.transform = transform;
        }
    }

    // ============= CONCEPT ACTIONS =============
    const conceptActions = {
        async startLearning(conceptId) {
            try {
                const result = await apiService.startLearning(conceptId);
                ui.closeModal();
                ui.showNotification(result.message, 'success');
                // Refresh the map
                await loadSubjectMap(state.currentSubjectId);
            } catch (error) {
                console.error('Failed to start learning:', error);
                ui.showNotification('Failed to start learning session', 'error');
            }
        },

        async continueLearning(conceptId) {
            try {
                // Update progress with 30 minutes of study time
                await apiService.updateProgress(conceptId, 30);
                ui.closeModal();
                ui.showNotification('Continue studying! Take the assessment when ready.', 'info');
                await loadSubjectMap(state.currentSubjectId);
            } catch (error) {
                console.error('Failed to update progress:', error);
                ui.showNotification('Failed to update progress', 'error');
            }
        },

        async takeAssessment(conceptId) {
            try {
                const quiz = await apiService.getQuiz(conceptId);
                state.startAssessment(quiz, conceptId);
                
                ui.closeModal();
                ui.setupAssessmentModal(quiz, conceptId);
                ui.showModal('assessment-modal');
                assessmentManager.startTimer();
                ui.showCurrentQuestion();
            } catch (error) {
                console.error('Failed to load assessment:', error);
                ui.showNotification('Assessment not available for this concept', 'error');
            }
        },

        reviewConcept(conceptId) {
            ui.showNotification('Review your NCERT textbook and practice problems', 'info');
            ui.closeModal();
        }
    };

    // ============= ASSESSMENT MANAGER =============
    const assessmentManager = {
        startTimer() {
            if (state.assessmentTimer) {
                clearInterval(state.assessmentTimer);
            }

            state.assessmentTimer = setInterval(() => {
                state.timeRemaining--;
                
                const minutes = Math.floor(state.timeRemaining / 60);
                const seconds = state.timeRemaining % 60;
                ui.elements.timerText.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                
                if (state.timeRemaining <= 0) {
                    this.submitAssessment();
                }
            }, 1000);
        },

        selectOption(optionIndex) {
            // Clear previous selection
            document.querySelectorAll('.option-item').forEach(opt => opt.classList.remove('selected'));
            
            // Select current option
            document.querySelectorAll('.option-item')[optionIndex].classList.add('selected');
            
            // Store answer
            state.assessmentAnswers[state.currentQuestionIndex] = optionIndex;
            
            // Enable navigation
            ui.elements.nextQuestionBtn.disabled = false;
            ui.elements.submitAssessmentBtn.disabled = false;
        },

        goToQuestion(index) {
            state.currentQuestionIndex = index;
            ui.showCurrentQuestion();
        },

        previousQuestion() {
            if (state.currentQuestionIndex > 0) {
                state.currentQuestionIndex--;
                ui.showCurrentQuestion();
            }
        },

        nextQuestion() {
            if (state.currentQuestionIndex < state.currentAssessment.questions.length - 1) {
                state.currentQuestionIndex++;
                ui.showCurrentQuestion();
            }
        },

        async submitAssessment() {
            if (state.assessmentTimer) {
                clearInterval(state.assessmentTimer);
            }

            try {
                const answers = state.assessmentAnswers.map((answer, index) => ({
                    questionId: state.currentAssessment.questions[index].id,
                    selectedAnswer: answer
                }));

                const timeSpent = Math.round((Date.now() - state.currentAssessment.startTime) / 1000);
                
                const results = await apiService.submitQuiz(
                    state.currentAssessment.conceptId, 
                    answers, 
                    timeSpent
                );

                ui.closeModal('assessment-modal');
                ui.showAssessmentResults(results);
                ui.showModal('results-modal');

                // Refresh map if concept was mastered
                if (results.passed) {
                    await loadSubjectMap(state.currentSubjectId);
                }
            } catch (error) {
                console.error('Failed to submit assessment:', error);
                ui.showNotification('Failed to submit assessment', 'error');
            }
        }
    };

    // ============= MAIN APPLICATION FUNCTIONS =============
    async function init() {
        try {
            ui.showNotification('Loading your knowledge map...', 'info');
            
            // Check authentication and get user info
            const userData = await apiService.checkAuth();
            state.setUserInfo(userData.loggedInUser, userData.studentInfo);
            
            // Load subjects
            const subjects = await apiService.getSubjects();
            state.setSubjects(subjects);
            
            // Load analytics
            const analytics = await apiService.getAnalytics();
            state.setAnalytics(analytics);
            
            // Setup event listeners
            setupEventListeners();
            
            ui.showNotification('Knowledge map ready!', 'success');
        } catch (error) {
            console.error('Initialization failed:', error);
            if (error.message === 'Authentication failed') {
                window.location.href = 'login.html';
            } else {
                ui.showNotification('Failed to load knowledge map', 'error');
            }
        }
    }

    async function loadSubjectMap(subjectId) {
        try {
            ui.showNotification('Loading subject map...', 'info');
            
            const mapData = await apiService.getSubjectMap(subjectId);
            const subjectName = state.subjects.find(s => s.id == subjectId)?.subject_name || 'Unknown Subject';
            
            state.setCurrentSubject(subjectName, subjectId);
            state.setMapData(mapData);
            
            ui.showNotification(`${subjectName} knowledge map loaded`, 'success');
        } catch (error) {
            console.error('Failed to load subject map:', error);
            ui.showNotification('Failed to load subject map', 'error');
        }
    }

    // ============= EVENT LISTENERS =============
    function setupEventListeners() {
        // Subject selector
        ui.elements.subjectSelector.addEventListener('change', (e) => {
            if (e.target.value) {
                loadSubjectMap(e.target.value);
            } else {
                state.setCurrentSubject(null, null);
                state.setMapData({ concepts: [] });
                ui.showWelcomeMessage();
                ui.closeSidebar();
            }
        });

        // Map controls
        ui.elements.zoomInBtn.addEventListener('click', () => ui.zoomIn());
        ui.elements.zoomOutBtn.addEventListener('click', () => ui.zoomOut());
        ui.elements.resetViewBtn.addEventListener('click', () => ui.resetView());
        ui.elements.toggleSidebarBtn.addEventListener('click', () => {
            state.sidebarOpen ? ui.closeSidebar() : ui.openSidebar();
        });

        // Sidebar controls
        ui.elements.closeSidebarBtn.addEventListener('click', () => ui.closeSidebar());

        // Assessment navigation
        ui.elements.prevQuestionBtn.addEventListener('click', () => assessmentManager.previousQuestion());
        ui.elements.nextQuestionBtn.addEventListener('click', () => assessmentManager.nextQuestion());
        ui.elements.submitAssessmentBtn.addEventListener('click', () => assessmentManager.submitAssessment());

        // Continue journey button
        ui.elements.continueJourneyBtn.addEventListener('click', () => {
            ui.closeModal('results-modal');
        });

        // Modal close buttons
        document.querySelectorAll('.close-modal-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modalId = e.target.closest('.modal-overlay').id;
                ui.closeModal(modalId);
            });
        });

        // Click outside modal to close
        document.querySelectorAll('.modal-overlay').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    ui.closeModal(modal.id);
                }
            });
        });

        // Map panning
        let startX, startY;
        ui.elements.mapCanvas.addEventListener('mousedown', (e) => {
            if (e.target === ui.elements.mapCanvas || e.target === ui.elements.mapSvg) {
                state.isDragging = true;
                startX = e.clientX - state.panX;
                startY = e.clientY - state.panY;
                ui.elements.mapCanvas.style.cursor = 'grabbing';
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (state.isDragging) {
                state.panX = e.clientX - startX;
                state.panY = e.clientY - startY;
                ui.updateMapTransform();
            }
        });

        document.addEventListener('mouseup', () => {
            state.isDragging = false;
            ui.elements.mapCanvas.style.cursor = 'default';
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (state.activeModal === 'assessment-modal') {
                if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    assessmentManager.previousQuestion();
                } else if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    assessmentManager.nextQuestion();
                }
            }
            
            if (e.key === 'Escape' && state.activeModal) {
                ui.closeModal();
            }
        });

        // Logout
        document.querySelector('.logout-link')?.addEventListener('click', async (e) => {
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
    }

    // ============= INITIALIZATION =============
    const state = new AppState();
    const ui = new UIManager();
    
    // Start the application
    init();
});