import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import User, { UserType } from '../models/User';

// Get all users (for super admin only)
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 10, userType, search } = req.query;
    
    const query: any = {};
    
    // Filter by user type if provided
    if (userType && Object.values(UserType).includes(userType as UserType)) {
      query.userType = userType;
    }
    
    // Search functionality
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    const skip = (Number(page) - 1) * Number(limit);
    
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));
    
    const total = await User.countDocuments(query);
    
    res.json({
      users,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        totalUsers: total,
        usersPerPage: Number(limit)
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get user by ID (for super admin and manufacturer)
export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id).select('-password');
    if (!user) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }
    
    res.json({ user });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update user status (activate/deactivate) - super admin only
export const updateUserStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    
    if (typeof isActive !== 'boolean') {
      res.status(400).json({ message: 'isActive must be a boolean value.' });
      return;
    }
    
    const user = await User.findByIdAndUpdate(
      id,
      { isActive },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }
    
    res.json({
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update user type (super admin only)
export const updateUserType = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { userType } = req.body;
    
    if (!Object.values(UserType).includes(userType)) {
      res.status(400).json({ message: 'Invalid user type.' });
      return;
    }
    
    const user = await User.findByIdAndUpdate(
      id,
      { userType },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }
    
    res.json({
      message: 'User type updated successfully',
      user
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete user (super admin only)
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }
    
    res.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get user statistics (super admin only)
export const getUserStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = await User.aggregate([
      {
        $group: {
          _id: '$userType',
          count: { $sum: 1 },
          activeUsers: {
            $sum: { $cond: ['$isActive', 1, 0] }
          }
        }
      }
    ]);
    
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    
    res.json({
      totalUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
      byType: stats
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get app users only (for super admin)
export const getAppUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    
    const query: any = { userType: UserType.APP_USER };
    
    // Search functionality
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    const skip = (Number(page) - 1) * Number(limit);
    
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));
    
    const total = await User.countDocuments(query);
    
    res.json({
      users,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        totalUsers: total,
        usersPerPage: Number(limit)
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get manufacturers only (for super admin)
export const getManufacturers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    
    const query: any = { userType: UserType.MANUFACTURER };
    
    // Search functionality
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    const skip = (Number(page) - 1) * Number(limit);
    
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));
    
    const total = await User.countDocuments(query);
    
    res.json({
      users,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        totalUsers: total,
        usersPerPage: Number(limit)
      }
    });
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
        id: manufacturer._id,
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
