const supabase = require('../config/supabase');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Helper to format Supabase user response (convert DB schema to frontend expected formats)
const formatUser = (user) => {
  if (!user) return null;
  return {
    id: user.user_id,
    username: user.username,
    email: user.email,
    role: user.role ? user.role.toLowerCase() : 'member', // frontend expects: 'admin', 'staff', 'member'
    isActive: user.status === 'Active',
    isApproved: user.status === 'Active' || user.role === 'ADMIN' || user.role === 'STAFF',
    createdAt: user.created_at
  };
};

// Register a new staff user (defaults to Inactive, waiting for Admin approval)
exports.register = async (req, res) => {
  try {
    const { username, email, password, full_name } = req.body;

    // Check if username already exists
    const { data: existingUser } = await supabase
      .from('User')
      .select('user_id')
      .eq('username', username)
      .maybeSingle();

    if (existingUser) {
      return res.status(400).json({ message: 'Username is already taken' });
    }

    // Check if email already exists
    const { data: existingEmail } = await supabase
      .from('User')
      .select('user_id')
      .eq('email', email)
      .maybeSingle();

    if (existingEmail) {
      return res.status(400).json({ message: 'Email is already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 8);
    
    const { error: insertError } = await supabase
      .from('User')
      .insert({
        username,
        email,
        password_hash: hashedPassword,
        full_name: username,
        role: 'MEMBER',
        status: 'Pending'
      });

    if (insertError) throw insertError;

    res.status(201).json({ message: 'Register request submitted! Please wait for Admin approval.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const { data: user } = await supabase
      .from('User')
      .select('*')
      .eq('username', username)
      .maybeSingle();
    
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Check if account is active/suspended
    if (user.status === 'Suspended') {
      return res.status(403).json({ message: 'บัญชีนี้ถูกระงับการใช้งานชั่วคราว' });
    }

    // For member who hasn't been approved to staff yet
    if (user.role === 'MEMBER' && user.status === 'Pending') {
      return res.status(403).json({ message: 'บัญชีของคุณยังอยู่ระหว่างรออนุมัติสิทธิ์เข้าใช้งาน' });
    }

    const passwordIsValid = await bcrypt.compare(password, user.password_hash);
    if (!passwordIsValid) {
      return res.status(401).json({ message: 'Invalid Password!' });
    }

    const token = jwt.sign({ id: user.user_id, role: user.role.toLowerCase() }, process.env.JWT_SECRET, {
      expiresIn: 86400 // 24 hours
    });

    res.status(200).json({
      id: user.user_id,
      username: user.username,
      email: user.email,
      role: user.role.toLowerCase(),
      accessToken: token
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* --- Admin User Management Methods --- */

// Get all users
exports.getUsers = async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('User')
      .select('user_id, username, email, role, status, created_at')
      .in('role', ['ADMIN', 'STAFF']);

    if (error) throw error;

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get pending staff requests (Inactive status)
exports.getPendingUsers = async (req, res) => {
  try {
    const { data: pendingUsers, error } = await supabase
      .from('User')
      .select('user_id, username, email, role, status, created_at')
      .eq('role', 'MEMBER')
      .eq('status', 'Pending');

    if (error) throw error;

    const formattedUsers = (pendingUsers || []).map(formatUser);
    res.status(200).json(formattedUsers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Approve member to staff
exports.approveUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const { data: user, error } = await supabase
      .from('User')
      .update({
        role: 'STAFF',
        status: 'Active'
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ message: 'User not found' });
      }
      throw error;
    }

    res.status(200).json({ message: `Approved user ${user.username} as Staff successfully!`, user: formatUser(user) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Reject member staff request
exports.rejectUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const { error } = await supabase
      .from('User')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;

    res.status(200).json(pendingUsers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Approve/Activate user
exports.activateUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const { data: user, error } = await supabase
      .from('User')
      .update({ status: 'Active' })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ message: 'User not found' });
      }
      throw error;
    }

    res.status(200).json({ message: 'Account activated successfully', user: formatUser(user) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Deactivate user
exports.deactivateUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const { data: user, error } = await supabase
      .from('User')
      .update({ status: 'Suspended' })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ message: 'User not found' });
      }
      throw error;
    }

    res.status(200).json({ message: 'Account deactivated successfully', user: formatUser(user) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete user permanently
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const { error } = await supabase
      .from('User')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;

    res.status(200).json({ message: 'User deleted permanently' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Bind LINE account to user email
exports.bindLine = async (req, res) => {
  try {
    const { lineUserId } = req.body;
    if (!lineUserId) {
      return res.status(400).json({ message: 'lineUserId is required' });
    }

    const { data: user, error } = await supabase
      .from('User')
      .select('email, username')
      .eq('user_id', req.userId)
      .single();

    if (error || !user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const lineBindings = require('../config/lineBindings');
    const matchingService = require('../services/matchingService');

    // Perform binding
    lineBindings.bind(user.email, lineUserId);

    // Send a confirmation LINE Push Notification
    const confirmationText = `[ระบบ Unifind] 🎉 ยินดีด้วย! 

บัญชีไลน์นี้ได้รับการผูกเชื่อมโยงเข้ากับระบบ Unifind ของเจ้าหน้าที่ "${user.username}" (อีเมล: ${user.email}) เรียบร้อยแล้วครับ!

นับจากนี้ท่านจะได้รับการแจ้งเตือนด่วนทันทีหากระบบตรวจพบคู่ของหายที่ตรงกันครับ`;

    await matchingService.sendPushToLine(lineUserId, confirmationText);

    res.status(200).json({ message: 'LINE account bound successfully', email: user.email });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

