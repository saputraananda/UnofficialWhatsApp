const makeWASocket = require('@whiskeysockets/baileys').default;
const { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const pino = require('pino');
const path = require('path');
const fs = require('fs');
const QRCode = require('qrcode');

const sessionConfig = {
    'alora': { displayName: 'Alora Business', icon: 'fa-solid fa-building' },
    'cleanox': { displayName: 'Cleanox Business', icon: 'fa-solid fa-spray-can-sparkles' },
    'waschen_utama': { displayName: 'Waschen Utama', icon: 'fa-solid fa-soap' },
    'waschen_legenda': { displayName: 'Waschen Legenda', icon: 'fa-solid fa-socks' },
    'waschen_citra': { displayName: 'Waschen Citra', icon: 'fa-solid fa-shirt' },
    'waschen_canadian': { displayName: 'Waschen Canadian', icon: 'fa-solid fa-snowflake' },
    'waschen_sentra_eropa': { displayName: 'Waschen Sentra Eropa', icon: 'fa-solid fa-globe' },
    'waschen_raffles': { displayName: 'Waschen Raffles', icon: 'fa-solid fa-crown' }
};
const sessionNames = Object.keys(sessionConfig);
const sessions = {};

// Initialize status fields for the sessions
for (const name of sessionNames) {
    sessions[name] = {
        sock: null,
        status: 'disconnected', // 'disconnected', 'connecting', 'qr', 'connected'
        qr: null,
        qrImage: null,
        info: null
    };
}

/**
 * Clean and format recipient phone number to JID
 */
function formatJid(phone) {
    if (!phone) return null;
    let clean = phone.toString().trim();
    if (clean.endsWith('@s.whatsapp.net') || clean.endsWith('@g.us')) {
        return clean;
    }
    // Remove all non-digit characters
    clean = clean.replace(/[^0-9]/g, '');
    
    // Convert local format (08xx) to international format (628xx)
    if (clean.startsWith('0')) {
        clean = '62' + clean.slice(1);
    }
    
    return `${clean}@s.whatsapp.net`;
}

/**
 * Initialize a single session
 */
async function initSession(sessionId) {
    if (!sessionNames.includes(sessionId)) {
        console.error(`[Session Manager] Invalid session ID requested: ${sessionId}`);
        return;
    }

    const sessionObj = sessions[sessionId];
    if (sessionObj.sock && ['connecting', 'connected'].includes(sessionObj.status)) {
        console.log(`[Session: ${sessionId}] Already running or connecting.`);
        return;
    }

    console.log(`[Session: ${sessionId}] Starting initialization...`);
    sessionObj.status = 'connecting';
    sessionObj.qr = null;
    sessionObj.qrImage = null;
    sessionObj.info = null;

    const sessionPath = path.join(__dirname, 'sessions', sessionId);
    if (!fs.existsSync(sessionPath)) {
        fs.mkdirSync(sessionPath, { recursive: true });
    }

    let authState;
    try {
        authState = await useMultiFileAuthState(sessionPath);
    } catch (err) {
        console.error(`[Session: ${sessionId}] Auth state file corruption detected. Resetting session folder.`, err);
        try {
            fs.rmSync(sessionPath, { recursive: true, force: true });
        } catch (e) {}
        authState = await useMultiFileAuthState(sessionPath);
    }

    const { state, saveCreds } = authState;

    // Fetch the latest Baileys version safely
    let version = [2, 3000, 1015947707];
    try {
        const latest = await fetchLatestBaileysVersion();
        version = latest.version;
        console.log(`[Session: ${sessionId}] Using latest Baileys version: v${version.join('.')}`);
    } catch (err) {
        console.warn(`[Session: ${sessionId}] Could not fetch latest Baileys version. Using default.`, err.message);
    }

    // Configure Baileys socket options
    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: true,
        logger: pino({ level: 'silent' }), // Suppress internal logs to keep server console clean
        defaultQueryTimeoutMs: 30000,
        connectTimeoutMs: 30000,
    });

    sessionObj.sock = sock;

    // Listeners
    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log(`[Session: ${sessionId}] New QR Code received.`);
            sessionObj.status = 'qr';
            sessionObj.qr = qr;
            try {
                sessionObj.qrImage = await QRCode.toDataURL(qr);
            } catch (err) {
                console.error(`[Session: ${sessionId}] QRCode Generation error:`, err);
            }
        }

        if (connection === 'connecting') {
            sessionObj.status = 'connecting';
            sessionObj.qr = null;
            sessionObj.qrImage = null;
        }

        if (connection === 'open') {
            console.log(`[Session: ${sessionId}] Connection opened successfully!`);
            sessionObj.status = 'connected';
            sessionObj.qr = null;
            sessionObj.qrImage = null;
            sessionObj.info = sock.user;
        }

        if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

            console.log(`[Session: ${sessionId}] Connection closed. Reason status: ${statusCode || 'unknown'}. Reconnecting: ${shouldReconnect}`);

            sessionObj.status = 'disconnected';
            sessionObj.qr = null;
            sessionObj.qrImage = null;
            sessionObj.info = null;
            sessionObj.sock = null;

            if (shouldReconnect) {
                console.log(`[Session: ${sessionId}] Will try to reconnect in 5 seconds...`);
                setTimeout(() => {
                    initSession(sessionId);
                }, 5000);
            } else {
                console.log(`[Session: ${sessionId}] Logged out. Cleaning credentials...`);
                try {
                    fs.rmSync(sessionPath, { recursive: true, force: true });
                } catch (err) {
                    console.error(`[Session: ${sessionId}] Error deleting credentials directory:`, err);
                }
            }
        }
    });
}

/**
 * Initialize all defined sessions
 */
async function initAll() {
    for (const name of sessionNames) {
        await initSession(name);
    }
}

/**
 * Get status of all sessions
 */
function getAllSessionsStatus() {
    const response = {};
    for (const name of sessionNames) {
        response[name] = {
            status: sessions[name].status,
            qrImage: sessions[name].qrImage,
            info: sessions[name].info,
            displayName: sessionConfig[name].displayName,
            icon: sessionConfig[name].icon
        };
    }
    return response;
}

/**
 * Get status of a single session
 */
function getSessionStatus(sessionId) {
    if (!sessionNames.includes(sessionId)) return null;
    return {
        status: sessions[sessionId].status,
        qrImage: sessions[sessionId].qrImage,
        info: sessions[sessionId].info,
        displayName: sessionConfig[sessionId].displayName,
        icon: sessionConfig[sessionId].icon
    };
}

/**
 * Send text message through a specific session
 */
async function sendMessage(sessionId, to, message) {
    if (!sessionNames.includes(sessionId)) {
        return { success: false, error: 'Invalid session ID' };
    }

    const session = sessions[sessionId];
    if (session.status !== 'connected' || !session.sock) {
        return { success: false, error: `Session is not connected (Current status: ${session.status})` };
    }

    const jid = formatJid(to);
    if (!jid) {
        return { success: false, error: 'Invalid recipient phone number' };
    }

    try {
        console.log(`[Session: ${sessionId}] Sending message to ${jid}`);
        const result = await session.sock.sendMessage(jid, { text: message });
        return { success: true, result };
    } catch (err) {
        console.error(`[Session: ${sessionId}] Send message error:`, err);
        return { success: false, error: err.message };
    }
}

/**
 * Log out and clear session credentials
 */
async function logoutSession(sessionId) {
    if (!sessionNames.includes(sessionId)) {
        return { success: false, error: 'Invalid session ID' };
    }

    const session = sessions[sessionId];
    const sessionPath = path.join(__dirname, 'sessions', sessionId);

    if (session.sock) {
        try {
            await session.sock.logout();
        } catch (err) {
            console.warn(`[Session: ${sessionId}] Error during logout:`, err.message);
            // Force reset
            if (session.sock) {
                session.sock.ev.removeAllListeners('connection.update');
                try {
                    session.sock.end(undefined);
                } catch (e) {}
            }
            try {
                fs.rmSync(sessionPath, { recursive: true, force: true });
            } catch (e) {}
            session.sock = null;
            session.status = 'disconnected';
            session.qr = null;
            session.qrImage = null;
            session.info = null;
        }
        return { success: true };
    } else {
        // If not connected but files exist, clean files
        try {
            if (fs.existsSync(sessionPath)) {
                fs.rmSync(sessionPath, { recursive: true, force: true });
            }
            session.status = 'disconnected';
            session.qr = null;
            session.qrImage = null;
            session.info = null;
            return { success: true };
        } catch (err) {
            return { success: false, error: err.message };
        }
    }
}

module.exports = {
    initAll,
    initSession,
    getAllSessionsStatus,
    getSessionStatus,
    sendMessage,
    logoutSession,
    sessionNames
};
