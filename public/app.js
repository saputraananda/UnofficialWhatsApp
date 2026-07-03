// WhatsApp Gateway Console App Script

let pollInterval;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    fetchSessionStatus();
    // Poll statuses every 2.5 seconds
    pollInterval = setInterval(fetchSessionStatus, 2500);
});

// Fetch status from API
async function fetchSessionStatus() {
    try {
        const response = await fetch('/api/sessions');
        const data = await response.json();
        
        if (data.success) {
            updateSessionUI('alora', data.sessions.alora);
            updateSessionUI('cleanox', data.sessions.cleanox);
        } else {
            console.error('API responded with error:', data.error);
        }
    } catch (err) {
        console.error('Failed to fetch session statuses:', err);
    }
}

// Update UI elements for a specific session
function updateSessionUI(sessionId, sessionData) {
    const cardObj = document.getElementById(`session-${sessionId}`);
    if (!cardObj) return;

    const badge = cardObj.querySelector('.status-badge');
    const badgeText = badge.querySelector('.status-text');
    
    // Reset class names
    badge.className = 'status-badge';
    
    // Hide all state containers first
    cardObj.querySelectorAll('.state-container').forEach(el => el.classList.add('hidden'));
    
    const testFormFooter = document.getElementById(`test-form-${sessionId}`);

    // Update based on status
    if (sessionData.status === 'disconnected') {
        badge.classList.add('status-disconnected');
        badgeText.textContent = 'Disconnected';
        cardObj.querySelector('.state-disconnected').classList.remove('hidden');
        testFormFooter.classList.add('hidden');
    } 
    else if (sessionData.status === 'connecting') {
        badge.classList.add('status-connecting');
        badgeText.textContent = 'Connecting';
        cardObj.querySelector('.state-connecting').classList.remove('hidden');
        testFormFooter.classList.add('hidden');
    } 
    else if (sessionData.status === 'qr') {
        badge.classList.add('status-qr');
        badgeText.textContent = 'Scan QR';
        
        const qrContainer = cardObj.querySelector('.state-qr');
        const qrImg = qrContainer.querySelector('.qr-image');
        
        if (sessionData.qrImage) {
            qrImg.src = sessionData.qrImage;
        }
        
        qrContainer.classList.remove('hidden');
        testFormFooter.classList.add('hidden');
    } 
    else if (sessionData.status === 'connected') {
        badge.classList.add('status-connected');
        badgeText.textContent = 'Connected';
        
        const connectedContainer = cardObj.querySelector('.state-connected');
        const nameEl = connectedContainer.querySelector('.user-name');
        const phoneEl = connectedContainer.querySelector('.user-phone');
        
        const userName = sessionData.info?.name || 'WhatsApp Account';
        const userJid = sessionData.info?.id ? sessionData.info.id.split(':')[0] : 'Unknown';
        
        nameEl.textContent = userName;
        phoneEl.textContent = `+${userJid}`;
        
        connectedContainer.classList.remove('hidden');
        testFormFooter.classList.remove('hidden');
    }
}

// Initiate session connection
async function initiateSession(sessionId) {
    console.log(`Initializing session: ${sessionId}`);
    const cardObj = document.getElementById(`session-${sessionId}`);
    const initBtn = cardObj.querySelector('.btn-init');
    
    if (initBtn) {
        initBtn.disabled = true;
        initBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Triggering...';
    }

    try {
        const response = await fetch(`/api/sessions/${sessionId}/init`, {
            method: 'POST'
        });
        const data = await response.json();
        if (data.success) {
            console.log(`Session ${sessionId} initialized successfully`);
            fetchSessionStatus();
        } else {
            alert(`Failed to initialize session: ${data.error}`);
            if (initBtn) {
                initBtn.disabled = false;
                initBtn.innerHTML = '<i class="fa-solid fa-power-off"></i> Initialize Session';
            }
        }
    } catch (err) {
        console.error(err);
        alert('Network error connecting to API');
        if (initBtn) {
            initBtn.disabled = false;
            initBtn.innerHTML = '<i class="fa-solid fa-power-off"></i> Initialize Session';
        }
    }
}

// Log out and disconnect session
async function logoutSession(sessionId) {
    if (!confirm(`Are you sure you want to disconnect ${sessionId} session?`)) {
        return;
    }

    const cardObj = document.getElementById(`session-${sessionId}`);
    const logoutBtn = cardObj.querySelector('.btn-logout');
    
    if (logoutBtn) {
        logoutBtn.disabled = true;
        logoutBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Disconnecting...';
    }

    try {
        const response = await fetch(`/api/sessions/${sessionId}/logout`, {
            method: 'POST'
        });
        const data = await response.json();
        if (data.success) {
            console.log(`Session ${sessionId} logged out`);
            fetchSessionStatus();
        } else {
            alert(`Failed to disconnect: ${data.error}`);
            if (logoutBtn) {
                logoutBtn.disabled = false;
                logoutBtn.innerHTML = '<i class="fa-solid fa-right-from-bracket"></i> Disconnect Session';
            }
        }
    } catch (err) {
        console.error(err);
        alert('Network error disconnecting session');
        if (logoutBtn) {
            logoutBtn.disabled = false;
            logoutBtn.innerHTML = '<i class="fa-solid fa-right-from-bracket"></i> Disconnect Session';
        }
    }
}

// Handle sending test message
async function handleSend(event, sessionId) {
    event.preventDefault();
    
    const cardObj = document.getElementById(`session-${sessionId}`);
    const toInput = document.getElementById(`to-${sessionId}`);
    const msgInput = document.getElementById(`msg-${sessionId}`);
    const sendBtn = cardObj.querySelector('.btn-send');
    const feedback = cardObj.querySelector('.send-feedback');

    const to = toInput.value.trim();
    const message = msgInput.value.trim();

    if (!to || !message) {
        showFeedback(feedback, 'Phone and message fields are required!', 'error');
        return;
    }

    // Set UI loading state
    sendBtn.disabled = true;
    sendBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending...';
    hideFeedback(feedback);

    try {
        const response = await fetch(`/api/sessions/${sessionId}/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ to, message })
        });

        const data = await response.json();
        if (data.success) {
            showFeedback(feedback, 'Message sent successfully!', 'success');
            msgInput.value = ''; // Clear message input
        } else {
            showFeedback(feedback, `Error: ${data.error || 'Failed to send message'}`, 'error');
        }
    } catch (err) {
        console.error(err);
        showFeedback(feedback, 'Network error sending message', 'error');
    } finally {
        sendBtn.disabled = false;
        sendBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Send Message';
    }
}

// Helpers for feedback UI
function showFeedback(element, text, type) {
    element.textContent = text;
    element.className = `send-feedback ${type}`;
    element.classList.remove('hidden');
}

function hideFeedback(element) {
    element.classList.add('hidden');
    element.className = 'send-feedback';
}
