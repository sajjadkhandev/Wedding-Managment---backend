import mongoose from 'express';
import mongoosePackage from 'mongoose';
const { Schema, model } = mongoosePackage;
import bcrypt from 'bcryptjs';
import { ROLES, PAKISTAN_CITIES } from '../config/constants.js';

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide your full name'],
      trim: true,
      maxlength: [80, 'Name cannot exceed 80 characters']
    },
    email: {
      type: String,
      required: [true, 'Please provide an email address'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/,
        'Please provide a valid email address'
      ]
    },
    phone: {
      type: String,
      required: [true, 'Please provide a contact phone number'],
      trim: true
    },
    city: {
      type: String,
      enum: {
        values: PAKISTAN_CITIES,
        message: '{VALUE} is not currently supported'
      },
      default: 'Lahore'
    },
    role: {
      type: String,
      enum: {
        values: [ROLES.CUSTOMER, ROLES.VENDOR, ROLES.ADMIN],
        message: 'Invalid user role'
      },
      default: ROLES.CUSTOMER
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false // Excluded by default in queries
    },
    avatar: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['active', 'suspended', 'pending'],
      default: 'active'
    },
    isEmailVerified: {
      type: Boolean,
      default: false
    },
    vendorProfile: {
      type: Schema.Types.ObjectId,
      ref: 'VendorProfile'
    },
    passwordResetToken: String,
    passwordResetExpires: Date
  },
  {
    timestamps: true
  }
);

// Hash password before saving if modified
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Sanitize user object output (Never expose password or reset tokens in JSON)
userSchema.methods.toJSON = function () {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.passwordResetToken;
  delete userObject.passwordResetExpires;
  delete userObject.__v;
  return userObject;
};

const User = model('User', userSchema);

export default User;
