const supabase = require('../config/supabase');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Helper to format Supabase user response (convert snake_case to camelCase)
const formatUser = (user) => {
  if (!user) return null;
  const { is_active, is_approved, ...rest } = user;
  return {
    ...rest,
    isActive: is_active,
    isApproved: is_approved
  };
};

// Register a member requesting to be staff
exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if username already exists
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .maybeSingle();

    if (existingUser) {
      return res.status(400).json({ message: 'Username is already taken' });
    }

    // Check if email already exists
    const { data: existingEmail, error: emailError } = await supabase
      .from('users')
      .select('id')
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
        password: hashedPassword,
        role: 'member',
        is_approved: false,
        is_active: true
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

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .maybeSingle();
    
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Check if account is active
    if (!user.is_active) {
      return res.status(403).json({ message: 'บัญชีนี้ถูกระงับการใช้งานชั่วคราว' });
    }

    // For staff, check if approved by Admin
    if (user.role === 'staff' && !user.is_approved) {
      return res.status(403).json({ message: 'บัญชีนี้ยังไม่ได้รับการอนุมัติจากผู้ดูแลระบบ' });
    }

    // For member who hasn't been approved yet
    if (user.role === 'member') {
      return res.status(403).json({ message: 'บัญชีของคุณยังอยู่ระหว่างรออนุมัติสิทธิ์เข้าใช้งาน' });
    }

    const passwordIsValid = await bcrypt.compare(password, user.password);
    if (!passwordIsValid) {
      return res.status(401).json({ message: 'Invalid Password!' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: 86400 // 24 hours
    });

    res.status(200).json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      accessToken: token
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* --- Admin User Management Methods --- */

// Get all admins and staff
exports.getUsers = async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, username, email, role, is_active, is_approved, created_at')
      .in('role', ['admin', 'staff']);

    if (error) throw error;

    const formattedUsers = (users || []).map(formatUser);
    res.status(200).json(formattedUsers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get pending staff requests (members)
exports.getPendingUsers = async (req, res) => {
  try {
    const { data: pendingUsers, error } = await supabase
      .from('users')
      .select('id, username, email, role, is_active, is_approved, created_at')
      .eq('role', 'member')
      .eq('is_approved', false);

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
      .from('users')
      .update({
        role: 'staff',
        is_approved: true,
        is_active: true
      })
      .eq('id', userId)
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
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) throw error;

    res.status(200).json({ message: 'Rejected and deleted staff request successfully.' });
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
      .update({ is_active: true })
      .eq('id', userId)
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
      .from('users')
      .update({ is_active: false })
      .eq('id', userId)
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
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) throw error;

    res.status(200).json({ message: 'User deleted permanently' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
