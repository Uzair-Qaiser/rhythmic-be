import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User, { UserType } from '../models/User';
import connectDB from '../config/database';

dotenv.config();

const createSuperAdmin = async (): Promise<void> => {
  try {
    await connectDB();
    
    // Check if super admin already exists
    const existingSuperAdmin = await User.findOne({ userType: UserType.SUPER_ADMIN });
    
    if (existingSuperAdmin) {
      console.log('✅ Super admin already exists');
      process.exit(0);
    }
    
    // Create super admin user
    const superAdmin = new User({
      email: process.env.SUPER_ADMIN_EMAIL || 'admin@rhythmic.com',
      password: process.env.SUPER_ADMIN_PASSWORD || 'Admin123!',
      userType: UserType.SUPER_ADMIN,
      firstName: 'Super',
      lastName: 'Admin',
      phone: process.env.SUPER_ADMIN_PHONE || '+1234567890',
      isActive: true
    });
    
    await superAdmin.save();
    
    console.log('✅ Super admin created successfully');
    console.log(`📧 Email: ${superAdmin.email}`);
    console.log(`🔑 Password: ${process.env.SUPER_ADMIN_PASSWORD || 'Admin123!'}`);
    console.log('⚠️  Please change the password after first login!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating super admin:', error);
    process.exit(1);
  }
};

// Run if this file is executed directly
if (require.main === module) {
  createSuperAdmin();
}

export default createSuperAdmin;
