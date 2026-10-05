const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Student = require('../models/Student');
const Staff = require('../models/Staff');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });

const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: 'Please provide username and password' });
    let user = await User.findOne({ username });
    if (!user) user = await User.findOne({ email: username });
    if (!user || !(await user.matchPassword(password))) return res.status(401).json({ message: 'Invalid credentials' });
    if (user.status !== 'active') return res.status(401).json({ message: 'Account is disabled. Contact admin.' });
    let profileData = null;
    if (user.role === 'student') profileData = await Student.findOne({ userId: user._id });
    else if (user.role === 'staff') profileData = await Staff.findOne({ userId: user._id });
    res.json({ token: generateToken(user._id), user: { _id: user._id, username: user.username, email: user.email, role: user.role, profile: profileData } });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    let profileData = null;
    if (user.role === 'student') profileData = await Student.findOne({ userId: user._id });
    else if (user.role === 'staff') profileData = await Staff.findOne({ userId: user._id });
    res.json({ user, profile: profileData });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const registerStaff = async (req, res) => {
  try {
    const { username, email, password, name, department, phone } = req.body;
    if (await User.findOne({ username })) return res.status(400).json({ message: 'Username already exists' });
    if (await User.findOne({ email })) return res.status(400).json({ message: 'Email already exists' });
    const user = await User.create({ username, email, password, role: 'staff' });
    const staff = await Staff.create({ name, department, email, phone, userId: user._id });
    res.status(201).json({ message: 'Staff created successfully', user, staff });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    if (!(await user.matchPassword(currentPassword))) return res.status(401).json({ message: 'Current password is incorrect' });
    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password changed successfully' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports = { login, getMe, registerStaff, changePassword };
