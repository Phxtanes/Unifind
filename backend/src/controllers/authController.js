const supabase = require('../config/supabase');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Helper to format user response
const formatUser = (user) => {
  if (!user) return null;
  return {
    id: user.user_id,
    user_id: user.user_id,
    username: user.username,
    email: user.email,
    full_name: user.full_name,
    nickname: user.nickname,
    role: user.role ? user.role.toLowerCase() : 'staff',
    status: user.status,
    isActive: user.status === 'Active',
    isApproved: user.status === 'Active' || user.role === 'ADMIN' || user.role === 'STAFF',
  };
};

// Register a new staff user (defaults to Inactive, waiting for Admin approval)
exports.register = async (req, res) => {
  try {
    const { username, email, password, full_name, nickname } = req.body;

    const { data: existingUser } = await supabase
      .from('users')
      .select('user_id')
      .eq('username', username)
      .maybeSingle();

    if (existingUser) {
      return res.status(400).json({ message: 'Username is already taken' });
    }

    const { data: existingEmail } = await supabase
      .from('users')
      .select('user_id')
      .eq('email', email)
      .maybeSingle();

    if (existingEmail) {
      return res.status(400).json({ message: 'Email is already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 8);

    const { error: insertError } = await supabase
      .from('users')
      .insert({
        username,
        email,
        password_hash: hashedPassword,
        full_name: full_name || username,
        nickname: nickname || null,
        role: 'STAFF',
        status: 'Inactive',
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
      .from('users')
      .select('*')
      .eq('username', username)
      .maybeSingle();

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (user.status === 'Inactive' || user.status === 'Suspended') {
      return res.status(403).json({ message: 'บัญชีของคุณยังไม่ได้รับการอนุมัติสิทธิ์เข้าใช้งาน หรือ ถูกระงับการใช้งานชั่วคราว' });
    }

    const passwordIsValid = await bcrypt.compare(password, user.password_hash);
    if (!passwordIsValid) {
      return res.status(401).json({ message: 'Invalid Password!' });
    }

    const token = jwt.sign(
      { id: user.user_id, role: user.role.toLowerCase() },
      process.env.JWT_SECRET,
      { expiresIn: 86400 }
    );

    res.status(200).json({
      id: user.user_id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      role: user.role.toLowerCase(),
      accessToken: token,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all active users
exports.getUsers = async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('user_id, username, email, full_name, nickname, role, status')
      .in('role', ['ADMIN', 'STAFF'])
      .in('status', ['Active', 'Suspended']);

    if (error) throw error;

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin creates a new user directly
exports.createUser = async (req, res) => {
  try {
    const { username, email, password, full_name, nickname, role = 'STAFF', status = 'Active' } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email, and password are required' });
    }

    const { data: existingUser } = await supabase
      .from('users')
      .select('user_id')
      .eq('username', username)
      .maybeSingle();

    if (existingUser) {
      return res.status(400).json({ message: 'Username is already taken' });
    }

    const { data: existingEmail } = await supabase
      .from('users')
      .select('user_id')
      .eq('email', email)
      .maybeSingle();

    if (existingEmail) {
      return res.status(400).json({ message: 'Email is already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 8);

    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        username,
        email,
        password_hash: hashedPassword,
        full_name: full_name || username,
        nickname: nickname || null,
        role: role.toUpperCase(),
        status,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    res.status(201).json({ message: 'User created successfully', user: formatUser(newUser) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get pending staff requests (Inactive status)
exports.getPendingUsers = async (req, res) => {
  try {
    const { data: pendingUsers, error } = await supabase
      .from('users')
      .select('user_id, username, email, full_name, nickname, role, status')
      .eq('role', 'STAFF')
      .eq('status', 'Inactive');

    if (error) throw error;

    res.status(200).json((pendingUsers || []).map(formatUser));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Approve user (set Active + STAFF)
exports.approveUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const { data: user, error } = await supabase
      .from('users')
      .update({ role: 'STAFF', status: 'Active' })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') return res.status(404).json({ message: 'User not found' });
      throw error;
    }

    res.status(200).json({ message: `Approved user ${user.username} as Staff successfully!`, user: formatUser(user) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Reject and delete staff request
exports.rejectUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;

    res.status(200).json({ message: 'User request rejected and removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Activate user
exports.activateUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const { data: user, error } = await supabase
      .from('users')
      .update({ status: 'Active' })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') return res.status(404).json({ message: 'User not found' });
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
      .from('users')
      .update({ status: 'Suspended' })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') return res.status(404).json({ message: 'User not found' });
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
      .from('users')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;

    res.status(200).json({ message: 'User deleted permanently' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update user details
exports.updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { username, email, password, full_name, nickname, role, status } = req.body;

    const { data: user, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (findError || !user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (username && username !== user.username) {
      const { data: existingUser } = await supabase
        .from('users')
        .select('user_id')
        .eq('username', username)
        .maybeSingle();

      if (existingUser) {
        return res.status(400).json({ message: 'Username is already taken' });
      }
    }

    if (email && email !== user.email) {
      const { data: existingEmail } = await supabase
        .from('users')
        .select('user_id')
        .eq('email', email)
        .maybeSingle();

      if (existingEmail) {
        return res.status(400).json({ message: 'Email is already registered' });
      }
    }

    const updates = {};
    if (username) updates.username = username;
    if (email) updates.email = email;
    if (full_name) updates.full_name = full_name;
    if (nickname !== undefined) updates.nickname = nickname;
    if (role) updates.role = role.toUpperCase();
    if (status) updates.status = status;

    if (password) {
      updates.password_hash = await bcrypt.hash(password, 8);
    }

    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) throw updateError;

    res.status(200).json({ message: 'User updated successfully', user: formatUser(updatedUser) });
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
      .from('users')
      .select('email, username')
      .eq('user_id', req.userId)
      .single();

    if (error || !user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const lineBindings = require('../config/lineBindings');
    const matchingService = require('../services/matchingService');

    lineBindings.bind(user.email, lineUserId);

    const confirmationText = `[ระบบ Unifind] 🎉 ยินดีด้วย! \n\nบัญชีไลน์นี้ได้รับการผูกเชื่อมโยงเข้ากับระบบ Unifind ของเจ้าหน้าที่ "${user.username}" (อีเมล: ${user.email}) เรียบร้อยแล้วครับ!\n\nนับจากนี้ท่านจะได้รับการแจ้งเตือนด่วนทันทีหากระบบตรวจพบคู่ของหายที่ตรงกันครับ`;

    await matchingService.sendPushToLine(lineUserId, confirmationText);

    res.status(200).json({ message: 'LINE account bound successfully', email: user.email });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
