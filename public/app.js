// WhatsApp Gateway Console App Script

let pollInterval;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    fetchSessionStatus();
    // Poll statuses setiap 2.5 detik
    pollInterval = setInterval(fetchSessionStatus, 2500);
});

// Fetch status dari API
async function fetchSessionStatus() {
    try {
        const response = await fetch('/api/sessions');
        const data = await response.json();
        
        if (data.success) {
            ensureSessionCards(data.sessions);
            for (const sessionId in data.sessions) {
                updateSessionUI(sessionId, data.sessions[sessionId]);
            }
        } else {
            console.error('API responded with error:', data.error);
        }
    } catch (err) {
        console.error('Failed to fetch session statuses:', err);
    }
}

// Pastikan elemen kartu sesi ter-render di dashboard secara dinamis
function ensureSessionCards(sessionsData) {
    const container = document.getElementById('sessions-container');
    if (!container) return;

    // Bersihkan loading spinner jika ada
    const loadingState = container.querySelector('.loading-state');
    if (loadingState) {
        container.innerHTML = '';
    }

    for (const sessionId in sessionsData) {
        if (document.getElementById(`session-${sessionId}`)) {
            continue; // Kartu sudah ada
        }

        const session = sessionsData[sessionId];
        const displayName = session.displayName || sessionId;
        const iconClass = session.icon || 'fa-solid fa-circle-nodes';

        const card = document.createElement('section');
        card.className = 'session-card';
        card.id = `session-${sessionId}`;
        card.setAttribute('data-session', sessionId);

        card.innerHTML = `
            <div class="card-header">
                <div class="session-title">
                    <i class="${iconClass}"></i>
                    <h2>${displayName}</h2>
                </div>
                <span class="status-badge status-disconnected">
                    <span class="pulse"></span>
                    <span class="status-text">Disconnected</span>
                </span>
            </div>
            
            <div class="card-body">
                <!-- States -->
                <div class="state-container state-disconnected">
                    <div class="icon-circle"><i class="fa-solid fa-plug"></i></div>
                    <p class="state-desc">Sesi belum aktif. Klik tombol di bawah untuk membuat QR Code login.</p>
                    <button class="btn btn-primary btn-init" onclick="initiateSession('${sessionId}')">
                        <i class="fa-solid fa-power-off"></i> Inisialisasi Sesi
                    </button>
                </div>

                <div class="state-container state-connecting hidden">
                    <div class="spinner"></div>
                    <p class="state-desc">Menghubungkan ke server WhatsApp. Silakan tunggu...</p>
                </div>

                <div class="state-container state-qr hidden">
                    <p class="state-desc font-semibold">Scan QR Code dengan WhatsApp Anda:</p>
                    <div class="qr-wrapper">
                        <img src="" alt="WhatsApp QR Code" class="qr-image">
                        <div class="qr-overlay hidden"><i class="fa-solid fa-rotate-right"></i> Menyegarkan</div>
                    </div>
                    <p class="qr-hint"><i class="fa-solid fa-info-circle"></i> Buka WhatsApp > Perangkat Tertaut > Tautkan Perangkat</p>
                </div>

                <div class="state-container state-connected hidden">
                    <div class="success-circle"><i class="fa-solid fa-check"></i></div>
                    <div class="user-info">
                        <h3 class="user-name">WhatsApp Account</h3>
                        <p class="user-phone">Unknown Number</p>
                    </div>
                    <button class="btn btn-danger btn-logout" onclick="logoutSession('${sessionId}')">
                        <i class="fa-solid fa-right-from-bracket"></i> Putuskan Sesi
                    </button>
                </div>
            </div>

            <div class="card-footer border-t hidden" id="test-form-${sessionId}">
                <h3>Kirim Uji Coba</h3>
                <form onsubmit="handleSend(event, '${sessionId}')" class="test-send-form">
                    <div class="form-group">
                        <label for="to-${sessionId}">Nomor Penerima (dengan kode negara):</label>
                        <div class="input-with-icon">
                            <i class="fa-solid fa-phone"></i>
                            <input type="text" id="to-${sessionId}" placeholder="628xxxxxxxxxx" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="msg-${sessionId}">Isi Pesan:</label>
                        <textarea id="msg-${sessionId}" rows="2" placeholder="Tulis pesan uji coba..." required></textarea>
                    </div>
                    <button type="submit" class="btn btn-success w-full btn-send">
                        <i class="fa-solid fa-paper-plane"></i> Kirim Pesan
                    </button>
                    <div class="send-feedback hidden"></div>
                </form>
            </div>
        `;

        container.appendChild(card);
    }
}

// Update status visual untuk kartu sesi tertentu
function updateSessionUI(sessionId, sessionData) {
    const cardObj = document.getElementById(`session-${sessionId}`);
    if (!cardObj) return;

    const badge = cardObj.querySelector('.status-badge');
    const badgeText = badge.querySelector('.status-text');
    
    // Reset status classes
    badge.className = 'status-badge';
    
    // Sembunyikan semua state
    cardObj.querySelectorAll('.state-container').forEach(el => el.classList.add('hidden'));
    
    const testFormFooter = document.getElementById(`test-form-${sessionId}`);

    // Update UI berdasarkan status sesi
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
        
        const userName = sessionData.info?.name || 'Akun WhatsApp';
        const userJid = sessionData.info?.id ? sessionData.info.id.split(':')[0] : 'Unknown';
        
        nameEl.textContent = userName;
        phoneEl.textContent = `+${userJid}`;
        
        connectedContainer.classList.remove('hidden');
        testFormFooter.classList.remove('hidden');
    }
}

// Inisialisasi/koneksi sesi
async function initiateSession(sessionId) {
    console.log(`Initializing session: ${sessionId}`);
    const cardObj = document.getElementById(`session-${sessionId}`);
    const initBtn = cardObj.querySelector('.btn-init');
    
    if (initBtn) {
        initBtn.disabled = true;
        initBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Memulai...';
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
            alert(`Gagal inisialisasi sesi: ${data.error}`);
            if (initBtn) {
                initBtn.disabled = false;
                initBtn.innerHTML = '<i class="fa-solid fa-power-off"></i> Inisialisasi Sesi';
            }
        }
    } catch (err) {
        console.error(err);
        alert('Kesalahan jaringan saat menghubungi API');
        if (initBtn) {
            initBtn.disabled = false;
            initBtn.innerHTML = '<i class="fa-solid fa-power-off"></i> Inisialisasi Sesi';
        }
    }
}

// Log out dan putuskan koneksi sesi
async function logoutSession(sessionId) {
    const cardObj = document.getElementById(`session-${sessionId}`);
    const displayName = cardObj.querySelector('.session-title h2').textContent;

    if (!confirm(`Apakah Anda yakin ingin memutuskan sesi ${displayName}?`)) {
        return;
    }

    const logoutBtn = cardObj.querySelector('.btn-logout');
    
    if (logoutBtn) {
        logoutBtn.disabled = true;
        logoutBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Memutuskan...';
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
            alert(`Gagal memutuskan: ${data.error}`);
            if (logoutBtn) {
                logoutBtn.disabled = false;
                logoutBtn.innerHTML = '<i class="fa-solid fa-right-from-bracket"></i> Putuskan Sesi';
            }
        }
    } catch (err) {
        console.error(err);
        alert('Kesalahan jaringan saat memutus sesi');
        if (logoutBtn) {
            logoutBtn.disabled = false;
            logoutBtn.innerHTML = '<i class="fa-solid fa-right-from-bracket"></i> Putuskan Sesi';
        }
    }
}

// Kirim pesan uji coba
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
        showFeedback(feedback, 'Nomor penerima dan isi pesan wajib diisi!', 'error');
        return;
    }

    // Set UI loading state
    sendBtn.disabled = true;
    sendBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Mengirim...';
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
            showFeedback(feedback, 'Pesan terkirim sukses!', 'success');
            msgInput.value = ''; // Reset textarea
        } else {
            showFeedback(feedback, `Error: ${data.error || 'Gagal mengirim pesan'}`, 'error');
        }
    } catch (err) {
        console.error(err);
        showFeedback(feedback, 'Kesalahan jaringan saat mengirim pesan', 'error');
    } finally {
        sendBtn.disabled = false;
        sendBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Kirim Pesan';
    }
}

// Tampilkan umpan balik (feedback) sukses/gagal
function showFeedback(element, text, type) {
    element.textContent = text;
    element.className = `send-feedback ${type}`;
    element.classList.remove('hidden');
}

// Sembunyikan umpan balik
function hideFeedback(element) {
    element.classList.add('hidden');
    element.className = 'send-feedback';
}
