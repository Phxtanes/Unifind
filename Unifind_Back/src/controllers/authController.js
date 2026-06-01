const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Register a member requesting to be staff
exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if username or email already exists
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ message: 'Username is already taken' });
    }

    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) {
      return res.status(400).json({ message: 'Email is already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 8);
    await User.create({
      username,
      email,
      password: hashedPassword,
      role: 'member',
      isApproved: false,
      isActive: true
    });

    res.status(201).json({ message: 'Register request submitted! Please wait for Admin approval.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ where: { username } });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({ message: 'บัญชีนี้ถูกระงับการใช้งานชั่วคราว' });
    }

    // For staff, check if approved by Admin
    if (user.role === 'staff' && !user.isApproved) {
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
    const users = await User.findAll({
      where: {
        role: ['admin', 'staff']
      },
      attributes: { exclude: ['password'] }
    });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get pending staff requests (members)
exports.getPendingUsers = async (req, res) => {
  try {
    const pendingUsers = await User.findAll({
      where: {
        role: 'member',
        isApproved: false
      },
      attributes: { exclude: ['password'] }
    });
    res.status(200).json(pendingUsers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Approve member to staff
exports.approveUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.update({
      role: 'staff',
      isApproved: true,
      isActive: true
    });

    res.status(200).json({ message: `Approved user ${user.username} as Staff successfully!`, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Reject member staff request
exports.rejectUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete request or mark as not approved
    await user.destroy(); // Deleting the request completely is cleaner so they can try again.
    res.status(200).json({ message: 'Rejected and deleted staff request successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Activate user
exports.activateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.update({ isActive: true });
    res.status(200).json({ message: 'Account activated successfully', user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Deactivate user
exports.deactivateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.update({ isActive: false });
    res.status(200).json({ message: 'Account deactivated successfully', user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete user permanently
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.destroy();
    res.status(200).json({ message: 'User deleted permanently' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
