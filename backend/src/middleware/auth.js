const jwt = require('jsonwebtoken');
const { supabaseAdmin } = require('../config/supabase');

/**
 * Verifies the JWT from the Authorization header.
 * Supports:
 *   - User JWTs (mentees, mentors) — 7d expiry
 *   - Admin JWTs — 4h expiry (issued by /api/admin/auth/login)
 *   - Static ADMIN_API_KEY — only for server-to-server / dev use
 *
 * Attaches req.user = { id, email, role, username } on success.
 */
async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  // Static admin API key — only accepted in non-production or for internal routes
  if (process.env.ADMIN_API_KEY && token === process.env.ADMIN_API_KEY) {
    if (process.env.NODE_ENV === 'production') {
      // In production, static key is not accepted — must use JWT
      return res.status(401).json({ error: 'Static API key not accepted in production. Use JWT.' });
    }
    try {
      const { data: adminProfile } = await supabaseAdmin
        .from('profiles')
        .select('id, username, email, role')
        .eq('role', 'admin')
        .limit(1)
        .maybeSingle();

      req.user = adminProfile
        ? { id: adminProfile.id, email: adminProfile.email, role: 'admin', username: adminProfile.username }
        : { id: null, email: 'admin@leadhouse.co.ke', role: 'admin', username: 'Admin' };
    } catch {
      req.user = { id: null, email: 'admin@leadhouse.co.ke', role: 'admin', username: 'Admin' };
    }
    return next();
  }

  // JWT verification
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Validate required fields exist in token
    if (!decoded.id || !decoded.role) {
      return res.status(401).json({ error: 'Invalid token payload' });
    }

    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Session expired. Please sign in again.' });
    }
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Restricts access to specific roles.
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' }); // don't reveal required role
    }
    next();
  };
}

/**
 * Returns the correct table name and ID column for the current user.
 */
function userTable(user) {
  if (user.role === 'admin')  return { table: 'profiles', idCol: 'id' };
  if (user.role === 'mentor') return { table: 'mentors',  idCol: 'profile_id' };
  return                             { table: 'users',    idCol: 'id' };
}

module.exports = { authenticate, requireRole, userTable };
