/**
 * Messages Routes — /api/messages
 */
require('dotenv').config();
const express = require('express');
const multer  = require('multer');
const path    = require('path');
const { body, validationResult } = require('express-validator');
const { supabaseAdmin } = require('../config/supabase');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// ── Helper: resolve names without aliasing (PostgREST bug workaround) ──
async function resolveNames(idList) {
  if (!idList || idList.length === 0) return {};
  const [{ data: uRows }, { data: mByPid }, { data: mById }, { data: pRows }] = await Promise.all([
    supabaseAdmin.from('users').select('id, username, role').in('id', idList),
    supabaseAdmin.from('mentors').select('profile_id, display_name').in('profile_id', idList),
    supabaseAdmin.from('mentors').select('id, display_name').in('id', idList),
    supabaseAdmin.from('profiles').select('id, username, role').in('id', idList),
  ]);
  const map = {};
  (uRows   || []).forEach(u => { map[u.id]         = { username: u.username,       role: u.role || 'mentee' }; });
  (mByPid  || []).forEach(m => { if (m.profile_id) map[m.profile_id] = { username: m.display_name, role: 'mentor' }; });
  (mById   || []).forEach(m => { if (!map[m.id])   map[m.id]         = { username: m.display_name, role: 'mentor' }; });
  (pRows   || []).forEach(p => { map[p.id]          = { username: p.username,       role: p.role || 'admin' }; });
  return map;
}

// File upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = ['image/jpeg','image/png','image/gif','image/webp','application/pdf',
      'video/mp4','audio/mpeg','application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    cb(null, ok.includes(file.mimetype));
  },
});

// POST /api/messages/upload
router.post('/upload', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided' });
    const safeName = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filename = `chat/${req.user.id}/${Date.now()}-${safeName}`;
    const isImage  = req.file.mimetype.startsWith('image/');
    const { error } = await supabaseAdmin.storage.from('chat-files')
      .upload(filename, req.file.buffer, { contentType: req.file.mimetype, upsert: false });
    if (error) throw error;
    const { data: urlData } = supabaseAdmin.storage.from('chat-files').getPublicUrl(filename);
    res.json({ url: urlData.publicUrl, name: req.file.originalname, type: isImage ? 'image' : 'file', size: req.file.size });
  } catch (err) { next(err); }
});

// GET /api/messages/my-mentees — mentor's matched mentees
router.get('/my-mentees', async (req, res, next) => {
  try {
    if (req.user.role !== 'mentor') return res.json({ mentees: [] });
    // mentor's id in JWT is their profile_id (Supabase auth uid)
    const { data, error } = await supabaseAdmin
      .from('match_requests')
      .select('mentee_id, mentee:users ( id, username, role )')
      .eq('mentor_id', req.user.id).eq('status', 'accepted');
    if (error) throw error;
    const mentees = (data || []).map(r => r.mentee).filter(Boolean).map(u => ({
      userId:   u.id,
      username: u.username,
      role:     'mentee',
    }));
    res.json({ mentees });
  } catch (err) { next(err); }
});

// GET /api/messages/my-mentor — mentee's matched mentor(s)
router.get('/my-mentor', async (req, res, next) => {
  try {
    if (req.user.role !== 'mentee') return res.json({ mentors: [] });
    const { data, error } = await supabaseAdmin
      .from('match_requests')
      .select('mentor_id, mentor:mentors ( id, profile_id, display_name, field, avatar_initials, county )')
      .eq('mentee_id', req.user.id).eq('status', 'accepted');
    if (error) throw error;
    const mentors = (data || []).map(r => r.mentor).filter(Boolean).map(m => ({
      userId:   m.profile_id,   // always use profile_id — this is the Supabase auth UID used in messages
      username: m.display_name,
      role:     'mentor',
      field:    m.field,
      avatar:   m.avatar_initials,
      county:   m.county,
    })).filter(m => m.userId);
    res.json({ mentors });
  } catch (err) { next(err); }
});

// GET /api/messages/admin/all-conversations — ALL platform conversations
router.get('/admin/all-conversations', async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    const { data, error } = await supabaseAdmin.from('messages')
      .select('id, content, is_read, created_at, sender_id, receiver_id')
      .order('created_at', { ascending: false });
    if (error) throw error;

    const allIds = new Set();
    (data || []).forEach(m => { allIds.add(m.sender_id); allIds.add(m.receiver_id); });
    const nameMap = await resolveNames(Array.from(allIds).filter(Boolean));

    const convMap = new Map();
    for (const msg of (data || [])) {
      // Always sort IDs so A↔B and B↔A map to the same key
      const [id1, id2] = [msg.sender_id, msg.receiver_id].sort();
      const key = `${id1}|${id2}`;
      if (!convMap.has(key)) {
        // Put the non-admin user as "sender" for display purposes
        const si = nameMap[msg.sender_id]   || { username: `User-${msg.sender_id.slice(0,6)}`,   role: 'mentee' };
        const ri = nameMap[msg.receiver_id] || { username: `User-${msg.receiver_id.slice(0,6)}`, role: 'mentee' };
        // Prefer showing the non-admin as the primary name
        const [displaySender, displayReceiver] = si.role === 'admin'
          ? [ri, si]
          : [si, ri];
        const [displaySenderId, displayReceiverId] = si.role === 'admin'
          ? [msg.receiver_id, msg.sender_id]
          : [msg.sender_id, msg.receiver_id];
        convMap.set(key, {
          key,
          senderId: displaySenderId, receiverId: displayReceiverId,
          senderName: displaySender.username, receiverName: displayReceiver.username,
          senderRole: displaySender.role,     receiverRole: displayReceiver.role,
          lastMsg: msg.content, lastTime: msg.created_at, unread: 0,
        });
      }
      if (!msg.is_read) convMap.get(key).unread += 1;
    }
    res.json({ conversations: Array.from(convMap.values()) });
  } catch (err) { next(err); }
});

// GET /api/messages/admin/users — all users admin can message
router.get('/admin/users', async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    const [{ data: mentees }, { data: mentors }] = await Promise.all([
      supabaseAdmin.from('users').select('id, username, role, is_active').order('username'),
      supabaseAdmin.from('mentors').select('profile_id, display_name, is_active, is_verified').order('display_name'),
    ]);
    const users = [
      ...(mentees || []).map(u => ({ id: u.id,          username: u.username,       role: 'mentee',  is_active: u.is_active })),
      ...(mentors || []).map(m => ({ id: m.profile_id,  username: m.display_name,   role: 'mentor',  is_active: m.is_active })),
    ].filter(u => u.id).sort((a, b) => a.username.localeCompare(b.username));
    res.json({ users });
  } catch (err) { next(err); }
});

// GET /api/messages/conversations — user's own conversations
router.get('/conversations', async (req, res, next) => {
  try {
    const userId = req.user.id;
    if (!userId) return res.json({ conversations: [] });

    const { data, error } = await supabaseAdmin.from('messages')
      .select('id, content, is_read, created_at, sender_id, receiver_id')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false });
    if (error) throw error;

    const otherIds = new Set();
    for (const msg of (data || [])) {
      const otherId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
      if (otherId) otherIds.add(otherId);
    }

    const nameMap = await resolveNames(Array.from(otherIds));

    const convMap = new Map();
    for (const msg of (data || [])) {
      const otherId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
      if (!otherId) continue;
      const info = nameMap[otherId] || { username: `User-${otherId.slice(0, 6)}`, role: 'mentee' };
      if (!convMap.has(otherId)) {
        convMap.set(otherId, { userId: otherId, username: info.username, role: info.role,
          lastMsg: msg.content, lastTime: msg.created_at, unread: 0 });
      }
      if (msg.receiver_id === userId && !msg.is_read) convMap.get(otherId).unread += 1;
    }
    res.json({ conversations: Array.from(convMap.values()) });
  } catch (err) { next(err); }
});

// GET /api/messages/:userId — message thread
// For admins: if viewAs param provided, show thread between viewAs and userId
router.get('/:userId', async (req, res, next) => {
  try {
    const me    = req.user.id;
    const other = req.params.userId;
    // Admin can pass ?viewAs=<id> to see a thread between two other users
    const viewAs = req.query.viewAs;
    const party1 = viewAs || me;
    const party2 = other;

    if (!party1) return res.json({ messages: [] });

    const { data, error } = await supabaseAdmin.from('messages')
      .select('id, content, is_read, created_at, sender_id, receiver_id, file_url, file_name, file_type')
      .or(`and(sender_id.eq.${party1},receiver_id.eq.${party2}),and(sender_id.eq.${party2},receiver_id.eq.${party1})`)
      .order('created_at', { ascending: true });
    if (error) throw error;

    // Only mark as read if it's the actual recipient viewing
    if (!viewAs) {
      const unreadIds = (data || []).filter(m => m.receiver_id === me && !m.is_read).map(m => m.id);
      if (unreadIds.length > 0) await supabaseAdmin.from('messages').update({ is_read: true }).in('id', unreadIds);
    }

    res.json({ messages: (data || []).map(m => ({
      id: m.id, content: m.content,
      senderId:  m.sender_id,
      isMe:      viewAs ? m.sender_id === viewAs : m.sender_id === me,
      isRead:    m.is_read, createdAt: m.created_at,
      fileUrl:   m.file_url  || null,
      fileName:  m.file_name || null,
      fileType:  m.file_type || null,
    })) });
  } catch (err) { next(err); }
});

// POST /api/messages — send a message
router.post('/',
  [
    body('receiverId').notEmpty().withMessage('Receiver is required'),
    body('content').optional().trim(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
      const { receiverId, content, fileUrl, fileName, fileType } = req.body;
      if (!req.user.id) return res.status(400).json({ error: 'Not authenticated' });
      if (!content?.trim() && !fileUrl) return res.status(400).json({ error: 'Message or file is required' });

      // Verify receiver exists in any table
      const [{ data: u }, { data: mPid }, { data: mId }, { data: p }] = await Promise.all([
        supabaseAdmin.from('users').select('id').eq('id', receiverId).maybeSingle(),
        supabaseAdmin.from('mentors').select('id').eq('profile_id', receiverId).maybeSingle(),
        supabaseAdmin.from('mentors').select('id').eq('id', receiverId).maybeSingle(),
        supabaseAdmin.from('profiles').select('id').eq('id', receiverId).maybeSingle(),
      ]);
      if (!u && !mPid && !mId && !p) return res.status(404).json({ error: 'Recipient not found' });

      const { data, error } = await supabaseAdmin.from('messages')
        .insert({ sender_id: req.user.id, receiver_id: receiverId, content: content?.trim() || '',
          is_read: false, file_url: fileUrl || null, file_name: fileName || null, file_type: fileType || null })
        .select().single();
      if (error) throw error;

      res.status(201).json({ message: 'Message sent', data: {
        id: data.id, content: data.content, senderId: data.sender_id, isMe: true,
        isRead: false, createdAt: data.created_at,
        fileUrl: data.file_url || null, fileName: data.file_name || null, fileType: data.file_type || null,
      }});
    } catch (err) { next(err); }
  }
);

module.exports = router;
