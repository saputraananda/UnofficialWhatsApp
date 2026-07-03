const express = require('express');
const sessionManager = require('./sessionManager');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// API: Get all sessions status
app.get('/api/sessions', (req, res) => {
    try {
        const statuses = sessionManager.getAllSessionsStatus();
        res.json({ success: true, sessions: statuses });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// API: Get single session status
app.get('/api/sessions/:id', (req, res) => {
    try {
        const status = sessionManager.getSessionStatus(req.params.id);
        if (!status) {
            return res.status(404).json({ success: false, error: 'Session not found' });
        }
        res.json({ success: true, session: status });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// API: Manually initialize/re-connect a session
app.post('/api/sessions/:id/init', async (req, res) => {
    try {
        const { id } = req.params;
        if (!sessionManager.sessionNames.includes(id)) {
            return res.status(404).json({ success: false, error: 'Session not found' });
        }
        await sessionManager.initSession(id);
        res.json({ success: true, message: `Session ${id} initialization triggered` });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// API: Logout and disconnect session
app.post('/api/sessions/:id/logout', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await sessionManager.logoutSession(id);
        if (result.success) {
            res.json({ success: true, message: `Session ${id} logged out successfully` });
        } else {
            res.status(400).json(result);
        }
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// API: General send message (session specified in body)
app.post('/api/send-message', async (req, res) => {
    try {
        const { session, to, message } = req.body;
        if (!session || !to || !message) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing parameters. Required fields: session, to, message' 
            });
        }

        const result = await sessionManager.sendMessage(session, to, message);
        if (result.success) {
            res.json({ success: true, result: result.result });
        } else {
            res.status(400).json(result);
        }
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// API: Direct send message to specific session URL
app.post('/api/sessions/:id/send', async (req, res) => {
    try {
        const { id } = req.params;
        const { to, message } = req.body;
        if (!to || !message) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing parameters. Required fields: to, message' 
            });
        }

        const result = await sessionManager.sendMessage(id, to, message);
        if (result.success) {
            res.json({ success: true, result: result.result });
        } else {
            res.status(400).json(result);
        }
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Express global error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
});

// Start Express Server
app.listen(PORT, async () => {
    console.log(`=================================================`);
    console.log(`🚀 Unofficial WhatsApp Server running on port ${PORT}`);
    console.log(`🌐 Dashboard: http://localhost:${PORT}`);
    console.log(`=================================================`);
    
    // Automatically trigger Baileys startup on launch
    await sessionManager.initAll();
});
