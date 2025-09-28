document.addEventListener('DOMContentLoaded', () => {
    const API_URL = "https://mindbender4-0.onrender.com"; 
    
    // DOM Elements
    const chatWindow = document.getElementById('chat-window');
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    const subjectSelect = document.getElementById('chat-subject');
    const quickPrompts = document.querySelectorAll('.quick-prompt');
    const clearChatBtn = document.getElementById('clear-chat-btn');
    const newChatBtn = document.getElementById('new-chat-btn');
    const logoutLink = document.querySelector('.logout-link');
    const historyList = document.getElementById('history-list');

    // Chat state
    let currentSessionId = null;
    let chatSessions = [];

    // --- Initialize the application ---
    async function init() {
        console.log("Chat page initialized.");
        setupEventListeners();
        await loadChatHistory();
        await createNewChatSession();
    }

    // --- Create a new chat session ---
    async function createNewChatSession() {
        try {
            const response = await fetch(`${API_URL}/api/chat-sessions`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ title: generateChatTitle() })
            });

            if (!response.ok) {
                throw new Error('Failed to create chat session');
            }

            const data = await response.json();
            currentSessionId = data.session.id;
            
            // Clear the chat window and show welcome message
            clearChatWindow();
            showWelcomeMessage();
            
            // Reload chat history to include the new session
            await loadChatHistory();
            
            // Mark the new session as active
            markSessionAsActive(currentSessionId);
            
        } catch (error) {
            console.error('Error creating new chat session:', error);
            showError('Failed to create new chat session');
        }
    }

    // --- Generate a default chat title ---
    function generateChatTitle() {
        const now = new Date();
        const options = { 
            month: 'short', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
        };
        return `Chat ${now.toLocaleDateString('en-US', options)}`;
    }

    // --- Load chat history from server ---
    async function loadChatHistory() {
        try {
            const response = await fetch(`${API_URL}/api/chat-sessions`, {
                method: 'GET',
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Failed to load chat history');
            }

            const data = await response.json();
            chatSessions = data.sessions;
            renderChatHistory();
            
        } catch (error) {
            console.error('Error loading chat history:', error);
            showHistoryError('Failed to load chat history');
        }
    }

    // --- Render chat history in the sidebar ---
    function renderChatHistory() {
        if (!chatSessions || chatSessions.length === 0) {
            historyList.innerHTML = `
                <div class="history-placeholder">
                    <i class="fas fa-comments"></i>
                    <p>Your chat history will appear here</p>
                </div>
            `;
            return;
        }

        historyList.innerHTML = chatSessions.map(session => `
            <div class="history-item" data-session-id="${session.id}">
                <h3 class="history-item-title">${escapeHtml(session.title)}</h3>
                <p class="history-item-date">${formatDate(session.updated_at)}</p>
                <div class="history-item-actions">
                    <button class="history-action-btn rename-btn" title="Rename">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="history-action-btn delete-btn" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');

        // Add event listeners to history items
        document.querySelectorAll('.history-item').forEach(item => {
            const sessionId = item.dataset.sessionId;
            
            item.addEventListener('click', (e) => {
                if (!e.target.closest('.history-item-actions')) {
                    loadChatSession(sessionId);
                }
            });

            item.querySelector('.rename-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                renameChatSession(sessionId);
            });

            item.querySelector('.delete-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                deleteChatSession(sessionId);
            });
        });
    }

    // --- Load a specific chat session ---
    async function loadChatSession(sessionId) {
        try {
            currentSessionId = sessionId;
            markSessionAsActive(sessionId);
            
            const response = await fetch(`${API_URL}/api/chat-messages/${sessionId}`, {
                method: 'GET',
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Failed to load chat messages');
            }

            const data = await response.json();
            
            // Clear the chat window and load messages
            clearChatWindow();
            
            if (data.messages.length === 0) {
                showWelcomeMessage();
            } else {
                data.messages.forEach(message => {
                    appendMessage(message.content, message.message_type);
                });
            }
            
        } catch (error) {
            console.error('Error loading chat session:', error);
            showError('Failed to load chat session');
        }
    }

    // --- Mark a session as active in the history ---
    function markSessionAsActive(sessionId) {
        document.querySelectorAll('.history-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const activeItem = document.querySelector(`[data-session-id="${sessionId}"]`);
        if (activeItem) {
            activeItem.classList.add('active');
        }
    }

    // --- Rename a chat session ---
    async function renameChatSession(sessionId) {
        const session = chatSessions.find(s => s.id === sessionId);
        if (!session) return;

        const newTitle = prompt('Enter new chat title:', session.title);
        if (!newTitle || newTitle.trim() === '') return;

        try {
            const response = await fetch(`${API_URL}/api/chat-sessions/${sessionId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ title: newTitle.trim() })
            });

            if (!response.ok) {
                throw new Error('Failed to rename chat session');
            }

            await loadChatHistory();
            
        } catch (error) {
            console.error('Error renaming chat session:', error);
            alert('Failed to rename chat session');
        }
    }

    // --- Delete a chat session ---
    async function deleteChatSession(sessionId) {
        if (!confirm('Are you sure you want to delete this chat?')) return;

        try {
            // Note: You'll need to implement a DELETE endpoint on the server
            // For now, we'll just remove it from the UI
            console.log('Delete functionality needs to be implemented on the server');
            alert('Delete functionality will be implemented soon');
            
        } catch (error) {
            console.error('Error deleting chat session:', error);
            alert('Failed to delete chat session');
        }
    }

    // --- Send a message ---
    async function sendMessage() {
        const messageText = chatInput.value.trim();
        if (!messageText) return;

        // Create a new session if none exists
        if (!currentSessionId) {
            await createNewChatSession();
        }

        const currentSubject = subjectSelect.value;
        appendMessage(messageText, 'user');
        chatInput.value = '';

        const typingIndicator = showTypingIndicator();

        try {
            const res = await fetch(`${API_URL}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ 
                    message: messageText, 
                    subject: currentSubject || null,
                    session_id: currentSessionId 
                })
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Server error');
            }

            const data = await res.json();
            
            chatWindow.removeChild(typingIndicator);
            appendMessage(data.reply, 'bot');

            // Update the session title if this is the first message
            await updateSessionTitleIfNeeded(messageText);
            
            // Reload history to update the timestamp
            await loadChatHistory();

        } catch (error) {
            console.error('Chat error:', error);
            if (typingIndicator?.parentNode) chatWindow.removeChild(typingIndicator);
            appendMessage(`Sorry, an error occurred: ${error.message}`, 'bot');
        }
    }

    // --- Update session title with first message ---
    async function updateSessionTitleIfNeeded(firstMessage) {
        if (!currentSessionId) return;
        
        const session = chatSessions.find(s => s.id === currentSessionId);
        if (!session) return;
        
        // Only update if it's still the default title
        if (session.title.startsWith('Chat ')) {
            const newTitle = firstMessage.length > 30 
                ? firstMessage.substring(0, 30) + '...'
                : firstMessage;
                
            try {
                await fetch(`${API_URL}/api/chat-sessions/${currentSessionId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ title: newTitle })
                });
            } catch (error) {
                console.error('Error updating session title:', error);
            }
        }
    }

    // --- Helper Functions ---
    function appendMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', `${sender}-message`);
        const p = document.createElement('p');
        p.textContent = text;
        messageDiv.appendChild(p);
        chatWindow.appendChild(messageDiv);
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }

    function showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot-message typing-indicator';
        typingDiv.innerHTML = '<p>Scholarly is thinking...</p>';
        chatWindow.appendChild(typingDiv);
        chatWindow.scrollTop = chatWindow.scrollHeight;
        return typingDiv;
    }

    function clearChatWindow() {
        chatWindow.innerHTML = '';
    }

    function showWelcomeMessage() {
        chatWindow.innerHTML = `
            <div class="message bot-message">
                <p>Hello! I'm Scholarly, your AI Study Buddy! 📚</p>
                <p>I'm here to help you with your studies. I know you're studying <span id="student-info-chat"></span>.</p>
                <p>What would you like to learn about today?</p>
            </div>
        `;
    }

    function showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error';
        errorDiv.textContent = message;
        chatWindow.appendChild(errorDiv);
    }

    function showHistoryError(message) {
        historyList.innerHTML = `
            <div class="error">
                <i class="fas fa-exclamation-triangle"></i>
                <p>${message}</p>
            </div>
        `;
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = (now - date) / (1000 * 60 * 60);

        if (diffInHours < 24) {
            return date.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        } else if (diffInHours < 24 * 7) {
            return date.toLocaleDateString('en-US', { 
                weekday: 'short',
                hour: '2-digit', 
                minute: '2-digit' 
            });
        } else {
            return date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
            });
        }
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // --- Event Listeners ---
    function setupEventListeners() {
        sendBtn.addEventListener('click', sendMessage);
        
        chatInput.addEventListener('keydown', e => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        quickPrompts.forEach(btn => btn.addEventListener('click', () => {
            chatInput.value = btn.dataset.prompt;
            chatInput.focus();
        }));
        
        if (newChatBtn) {
            newChatBtn.addEventListener('click', createNewChatSession);
        }
        
        if (clearChatBtn) {
            clearChatBtn.addEventListener('click', () => {
                if (confirm("Are you sure you want to clear the current chat?")) {
                    clearChatWindow();
                    showWelcomeMessage();
                }
            });
        }
        
        if (logoutLink) {
            logoutLink.addEventListener('click', async e => {
                e.preventDefault();
                try {
                    await fetch(`${API_URL}/logout`, { 
                        method: 'POST', 
                        credentials: 'include' 
                    });
                } catch (err) {
                    console.error("Logout failed:", err);
                } finally {
                    localStorage.clear(); 
                    window.location.href = 'login.html';
                }
            });
        }
    }

    // Initialize the application
    init();
});
