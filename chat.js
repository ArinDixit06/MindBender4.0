// File: chat.js (Complete and Final Code)
document.addEventListener('DOMContentLoaded', () => {
    const API_URL = "http://localhost:5000";
    
    // State variables
    let userInfo = null;
    let studentInfo = null;
    let chatHistory = JSON.parse(localStorage.getItem('chatHistory')) || [];
    let currentSubject = '';

    // DOM Elements
    const chatWindow = document.getElementById('chat-window');
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    const subjectSelect = document.getElementById('chat-subject');
    const quickPrompts = document.querySelectorAll('.quick-prompt');

    async function init() {
        try {
            // Securely fetch user data from the server based on the session cookie
            const meResponse = await fetch(`${API_URL}/api/me`, { credentials: 'include' });
            if (!meResponse.ok) {
                // If not authenticated, redirect to the login page
                window.location.href = 'login.html';
                return;
            }
            const meData = await meResponse.json();
            userInfo = meData.loggedInUser;
            studentInfo = meData.studentInfo;
            
            // Now that we are authenticated, load the chat content
            displayStudentInfo();
            await loadSubjects();
            loadChatHistory();
            setupEventListeners();
        } catch (error) {
            console.error("Chat Initialization Error:", error);
            window.location.href = 'login.html';
        }
    }

    function displayStudentInfo() {
        if (studentInfo) {
            const infoText = `${studentInfo.board} Board, Class ${studentInfo.class}${studentInfo.stream ? ' (' + studentInfo.stream + ')' : ''}`;
            document.getElementById('student-info-chat').textContent = infoText;
        }
    }

    async function loadSubjects() {
        try {
            const res = await fetch(`${API_URL}/api/subjects/${studentInfo?.class}/${studentInfo?.stream || ''}`);
            if (res.ok) {
                const subjects = await res.json();
                const customSubjects = JSON.parse(localStorage.getItem('customSubjects')) || [];
                [...subjects, ...customSubjects].forEach(subject => {
                    const option = document.createElement('option');
                    option.value = subject;
                    option.textContent = subject;
                    subjectSelect.appendChild(option);
                });
            }
        } catch (err) {
            console.error('Error loading subjects:', err);
        }
    }

    function loadChatHistory() {
        chatHistory.slice(-10).forEach(msg => appendMessage(msg.text, msg.sender, false));
        if (chatHistory.length > 0) chatWindow.scrollTop = chatWindow.scrollHeight;
    }

    async function sendMessage() {
        const messageText = chatInput.value.trim();
        if (!messageText) return;

        appendMessage(messageText, 'user');
        chatInput.value = '';
        chatInput.style.height = 'auto';

        const typingIndicator = showTypingIndicator();

        try {
            const res = await fetch(`${API_URL}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ message: messageText, subject: currentSubject || null })
            });

            if (!res.ok) throw new Error('Server error');
            const data = await res.json();
            
            chatWindow.removeChild(typingIndicator);
            appendMessage(data.reply, 'bot');

        } catch (error) {
            console.error('Chat error:', error);
            if (typingIndicator?.parentNode) chatWindow.removeChild(typingIndicator);
            appendMessage("Sorry, I couldn't connect to the server. Please try again later.", 'bot');
        }
    }

    function appendMessage(text, sender, save = true) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', `${sender}-message`);
        messageDiv.innerHTML = formatMessage(text);
        chatWindow.appendChild(messageDiv);
        chatWindow.scrollTop = chatWindow.scrollHeight;

        if (save) {
            chatHistory.push({ text, sender });
            localStorage.setItem('chatHistory', JSON.stringify(chatHistory.slice(-50)));
        }
    }

    function formatMessage(text) {
        return text.split('\n').filter(p => p.trim()).map(p => {
            p = p.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>').replace(/`(.*?)`/g, '<code>$1</code>');
            if (p.startsWith('- ')) p = '• ' + p.substring(2);
            return `<p>${p}</p>`;
        }).join('');
    }

    function showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot-message typing-indicator';
        typingDiv.innerHTML = '<span></span><span></span><span></span>';
        chatWindow.appendChild(typingDiv);
        chatWindow.scrollTop = chatWindow.scrollHeight;
        return typingDiv;
    }

    function setupEventListeners() {
        sendBtn.addEventListener('click', sendMessage);
        chatInput.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } });
        chatInput.addEventListener('input', () => { chatInput.style.height = 'auto'; chatInput.style.height = `${chatInput.scrollHeight}px`; });
        subjectSelect.addEventListener('change', e => { currentSubject = e.target.value; });
        quickPrompts.forEach(btn => btn.addEventListener('click', () => { chatInput.value += ` ${btn.dataset.prompt}`; chatInput.focus(); }));
        
        
        const clearChatBtn = document.getElementById('clear-chat-btn');
        if (clearChatBtn) {
            clearChatBtn.addEventListener('click', async () => {
                if (confirm("Are you sure you want to delete your entire chat history? This cannot be undone.")) {
                    try {
                        const res = await fetch(`${API_URL}/api/chat/history`, {
                            method: 'DELETE',
                            credentials: 'include'
                        });
                        
                        if (res.ok) {
                            // Clear the chat window on the frontend
                            chatWindow.innerHTML = '<div class="message bot-message"><p>Chat history cleared. How can I help you start fresh?</p></div>';
                            // Clear the history from local storage as well
                            localStorage.removeItem('chatHistory');
                            chatHistory = [];
                        } else {
                            alert("Failed to clear chat history."); 
                        }
                    } catch (error) {
                        console.error("Clear chat error:", error);
                        alert("Could not connect to the server to clear history.");
                    }
                }
            });
        }
        
        document.querySelector('.logout-link').addEventListener('click', async e => {
            e.preventDefault();
            await fetch(`${API_URL}/logout`, { method: 'POST', credentials: 'include' });
            localStorage.clear();
            window.location.href = 'login.html';
        });
    }

    init();
});
