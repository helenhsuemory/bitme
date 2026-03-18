"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBusySlots = exports.outlookAuthCallback = exports.googleAuthCallback = exports.getOutlookAuthUrl = exports.getGoogleAuthUrl = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const googleapis_1 = require("googleapis");
admin.initializeApp();
const db = admin.firestore();
// Helpers for OAuth
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5001/bitme-admin-auth/us-central1/googleAuthCallback';
const OUTLOOK_CLIENT_ID = process.env.OUTLOOK_CLIENT_ID || 'dummy_outlook_client_id';
const OUTLOOK_CLIENT_SECRET = process.env.OUTLOOK_CLIENT_SECRET || 'dummy_outlook_secret';
const OUTLOOK_REDIRECT_URI = process.env.OUTLOOK_REDIRECT_URI || 'http://localhost:5001/bitme-admin-auth/us-central1/outlookAuthCallback';
const getGoogleOAuth2Client = () => {
    return new googleapis_1.google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI);
};
exports.getGoogleAuthUrl = functions.https.onCall(async (data, context) => {
    if (!context.auth)
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');
    const oauth2Client = getGoogleOAuth2Client();
    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/calendar.readonly'],
        state: context.auth.uid,
        prompt: 'consent' // ensure we get a refresh token
    });
    return { url };
});
exports.getOutlookAuthUrl = functions.https.onCall(async (data, context) => {
    if (!context.auth)
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');
    const params = new URLSearchParams({
        client_id: OUTLOOK_CLIENT_ID,
        response_type: 'code',
        redirect_uri: OUTLOOK_REDIRECT_URI,
        response_mode: 'query',
        scope: 'offline_access Calendars.Read',
        state: context.auth.uid
    });
    const url = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;
    return { url };
});
exports.googleAuthCallback = functions.https.onRequest(async (req, res) => {
    const code = req.query.code;
    const uid = req.query.state;
    if (!code || !uid) {
        res.status(400).send('Missing code or state argument');
        return;
    }
    try {
        const oauth2Client = getGoogleOAuth2Client();
        const { tokens } = await oauth2Client.getToken(code);
        // Save tokens in Firestore under the user's document
        await db.collection('users').doc(uid).set({
            integrations: {
                google: {
                    access_token: tokens.access_token,
                    refresh_token: tokens.refresh_token,
                    expiry_date: tokens.expiry_date
                }
            }
        }, { merge: true });
        // Redirect the user back to the admin settings page
        res.redirect('http://localhost:5173/admin/settings?integration=google_success');
    }
    catch (error) {
        console.error('Error exchanging google token', error);
        res.status(500).send('Failed to authenticate with Google');
    }
});
exports.outlookAuthCallback = functions.https.onRequest(async (req, res) => {
    const code = req.query.code;
    const uid = req.query.state;
    if (!code || !uid) {
        res.status(400).send('Missing code or state argument');
        return;
    }
    try {
        const params = new URLSearchParams({
            client_id: OUTLOOK_CLIENT_ID,
            client_secret: OUTLOOK_CLIENT_SECRET,
            code,
            redirect_uri: OUTLOOK_REDIRECT_URI,
            grant_type: 'authorization_code'
        });
        const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
            method: 'POST',
            body: params,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        const tokens = await response.json();
        if (!response.ok)
            throw new Error(tokens.error_description || 'Outlook token exchange failed');
        await db.collection('users').doc(uid).set({
            integrations: {
                outlook: {
                    access_token: tokens.access_token,
                    refresh_token: tokens.refresh_token,
                    expiry_date: Date.now() + (tokens.expires_in * 1000)
                }
            }
        }, { merge: true });
        res.redirect('http://localhost:5173/admin/settings?integration=outlook_success');
    }
    catch (error) {
        console.error('Error exchanging outlook token', error);
        res.status(500).send('Failed to authenticate with Outlook');
    }
});
exports.getBusySlots = functions.https.onCall(async (data, context) => {
    var _a, _b;
    const { userId } = data;
    if (!userId)
        throw new functions.https.HttpsError('invalid-argument', 'Missing userId');
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists)
        return { busy: [] };
    const userData = userDoc.data();
    const busySlots = [];
    // 1. Fetch Google Calendar
    if ((_a = userData === null || userData === void 0 ? void 0 : userData.integrations) === null || _a === void 0 ? void 0 : _a.google) {
        try {
            const g = userData.integrations.google;
            const oauth2Client = getGoogleOAuth2Client();
            oauth2Client.setCredentials({
                access_token: g.access_token,
                refresh_token: g.refresh_token,
                expiry_date: g.expiry_date
            });
            const calendar = googleapis_1.google.calendar({ version: 'v3', auth: oauth2Client });
            const response = await calendar.events.list({
                calendarId: 'primary',
                timeMin: new Date().toISOString(),
                timeMax: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                singleEvents: true,
                orderBy: 'startTime',
            });
            const events = response.data.items || [];
            events.forEach(e => {
                var _a, _b;
                if (((_a = e.start) === null || _a === void 0 ? void 0 : _a.dateTime) && ((_b = e.end) === null || _b === void 0 ? void 0 : _b.dateTime)) {
                    busySlots.push({ start: e.start.dateTime, end: e.end.dateTime });
                }
            });
        }
        catch (err) {
            console.error('Error fetching Google Calendar', err);
        }
    }
    // 2. Fetch Outlook Calendar
    if ((_b = userData === null || userData === void 0 ? void 0 : userData.integrations) === null || _b === void 0 ? void 0 : _b.outlook) {
        try {
            const o = userData.integrations.outlook;
            // Note: In simplified version we assume token is still valid or handle refresh logic
            const response = await fetch('https://graph.microsoft.com/v1.0/me/calendar/calendarView?' + new URLSearchParams({
                startDateTime: new Date().toISOString(),
                endDateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            }), {
                headers: { 'Authorization': `Bearer ${o.access_token}` }
            });
            if (response.ok) {
                const data = await response.json();
                data.value.forEach((e) => {
                    busySlots.push({ start: e.start.dateTime, end: e.end.dateTime });
                });
            }
        }
        catch (err) {
            console.error('Error fetching Outlook Calendar', err);
        }
    }
    return { busy: busySlots };
});
//# sourceMappingURL=index.js.map