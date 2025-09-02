import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import User, { UserType, IUser } from '../models/User';
import { Types } from 'mongoose';

// Helper function to safely convert ObjectId to string
const safeObjectIdToString = (id: Types.ObjectId | unknown): string => {
  if (id instanceof Types.ObjectId) {
    return id.toString();
  }
  if (typeof id === 'string') {
    return id;
  }
  throw new Error('Invalid ID format');
};

// Generate JWT token
const generateToken = (userId: string, userType: UserType, email: string): string => {
  return jwt.sign(
    { userId, userType, email },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );
};

// User registration (app users only)
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { email, password, firstName, lastName, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ message: 'User with this email already exists.' });
      return;
    }

    // Create new user (always app_user type)
    const user = new User({
      email,
      password,
      userType: UserType.APP_USER, // Force app_user type
      firstName,
      lastName,
      phone
    });

    await user.save();

    // Generate token
    const token = generateToken(safeObjectIdToString(user._id), user.userType, user.email);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: safeObjectIdToString(user._id),
        email: user.email,
        userType: user.userType,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// User login
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({ message: 'Invalid credentials.' });
      return;
    }

    // Check if user is active
    if (!user.isActive) {
      res.status(401).json({ message: 'Account is deactivated.' });
      return;
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      res.status(401).json({ message: 'Invalid credentials.' });
      return;
    }

    // Generate token
    const token = generateToken(safeObjectIdToString(user._id), user.userType, user.email);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: safeObjectIdToString(user._id),
        email: user.email,
        userType: user.userType,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get current user profile
export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'User not authenticated.' });
      return;
    }

    res.json({
      user: {
        id: safeObjectIdToString(req.user._id),
        email: req.user.email,
        userType: req.user.userType,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        phone: req.user.phone,
        isActive: req.user.isActive,
        lastLogin: req.user.lastLogin,
        createdAt: req.user.createdAt
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update user profile
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'User not authenticated.' });
      return;
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { firstName, lastName, phone } = req.body;

    // Update user profile
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { firstName, lastName, phone },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: safeObjectIdToString(updatedUser._id),
        email: updatedUser.email,
        userType: updatedUser.userType,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        phone: updatedUser.phone,
        isActive: updatedUser.isActive,
        lastLogin: updatedUser.lastLogin,
        createdAt: updatedUser.createdAt
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Change password
export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'User not authenticated.' });
      return;
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { currentPassword, newPassword } = req.body;

    // Verify current password
    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }

    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      res.status(400).json({ message: 'Current password is incorrect.' });
      return;
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Logout (client-side token removal, but we can track here if needed)
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    // In a more complex system, you might want to blacklist the token
    // For now, we'll just return a success message
    res.json({ message: 'Logged out successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create manufacturer (super admin only)
export const createManufacturer = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { email, password, firstName, lastName, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ message: 'User with this email already exists.' });
      return;
    }

    // Create new manufacturer
    const manufacturer = new User({
      email,
      password,
      userType: UserType.MANUFACTURER,
      firstName,
      lastName,
      phone,
      isActive: true
    });

    await manufacturer.save();

    res.status(201).json({
      message: 'Manufacturer created successfully',
      user: {
        id: safeObjectIdToString(manufacturer._id),
        email: manufacturer.email,
        userType: manufacturer.userType,
        firstName: manufacturer.firstName,
        lastName: manufacturer.lastName,
        phone: manufacturer.phone,
        isActive: manufacturer.isActive
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
