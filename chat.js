// File: chat.js (Corrected Code)
document.addEventListener('DOMContentLoaded', () => {
    // The API_URL should match the port your server is running on.
    const API_URL = "http://localhost:5000"; 
    
    // DOM Elements
    const chatWindow = document.getElementById('chat-window');
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    const subjectSelect = document.getElementById('chat-subject');
    const quickPrompts = document.querySelectorAll('.quick-prompt');
    const clearChatBtn = document.getElementById('clear-chat-btn');
    const logoutLink = document.querySelector('.logout-link');

    // --- Main Function to Send a Message ---
    async function sendMessage() {
        const messageText = chatInput.value.trim();
        if (!messageText) return;

        const currentSubject = subjectSelect.value;
        appendMessage(messageText, 'user');
        chatInput.value = '';

        const typingIndicator = showTypingIndicator();

        try {
            // FIX #1: Changed the URL from "/api/chat" to "/chat" to match server.js
            const res = await fetch(`${API_URL}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // credentials: 'include', // Only needed if you are strictly enforcing sessions for this route
                body: JSON.stringify({ message: messageText, subject: currentSubject || null })
            });

            if (!res.ok) {
                // Provide more specific error feedback
                const errorData = await res.json();
                throw new Error(errorData.error || 'Server error');
            }

            const data = await res.json();
            
            chatWindow.removeChild(typingIndicator);
            appendMessage(data.reply, 'bot');

        } catch (error) {
            console.error('Chat error:', error);
            if (typingIndicator?.parentNode) chatWindow.removeChild(typingIndicator);
            appendMessage(`Sorry, an error occurred: ${error.message}`, 'bot');
        }
    }

    // --- Helper Functions (Mostly unchanged) ---
    function appendMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', `${sender}-message`);
        // Simple text formatting for display
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
    
    // --- Event Listeners Setup ---
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
        
        if (clearChatBtn) {
            clearChatBtn.addEventListener('click', () => {
                if (confirm("Are you sure you want to clear the chat window?")) {
                    // This clears the frontend only. For persistence, you'd need a backend implementation.
                    chatWindow.innerHTML = '<div class="message bot-message"><p>Chat cleared. How can I help?</p></div>';
                }
            });
        }
        
        if(logoutLink) {
            logoutLink.addEventListener('click', async e => {
                e.preventDefault();
                try {
                    await fetch(`${API_URL}/logout`, { method: 'POST', credentials: 'include' });
                } catch (err) {
                    console.error("Logout failed:", err);
                } finally {
                    // Clear any local session data and redirect
                    localStorage.clear(); 
                    window.location.href = 'login.html';
                }
            });
        }
    }

    // FIX #2: Simplified initialization. Removed calls to non-existent endpoints.
    function init() {
        console.log("Chat page initialized.");
        // We assume the user is logged in if they reach this page.
        // The more complex auth checks were removed as the endpoints do not exist.
        setupEventListeners();
    }

    init();
});
