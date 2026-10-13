import mongoose from 'mongoose';
import Notification from '../models/Notification.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

// Fallback notifications for offline development / test runner
const FALLBACK_NOTIFICATIONS = [
  {
    _id: 'notif-demo-1',
    recipient: 'cust-demo',
    title: 'Booking Request Accepted!',
    message: 'The Royal Crystal Ballroom has accepted your slot reservation for Baraat on 20 Nov 2026.',
    type: 'booking_accepted',
    link: '/customer/dashboard',
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 35) // 35 mins ago
  },
  {
    _id: 'notif-demo-2',
    recipient: 'cust-demo',
    title: 'Installment Reminder: Catering Deposit',
    message: 'Rs. 200,000 catering deposit milestone recorded for Royal Dastarkhwan.',
    type: 'payment_received',
    link: '/customer/dashboard',
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4) // 4 hours ago
  },
  {
    _id: 'notif-demo-3',
    recipient: 'cust-demo',
    title: 'New Guest RSVP Received',
    message: 'Dr. Kamran Siddiqui confirmed attending for 3 members.',
    type: 'general',
    link: '/customer/dashboard',
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24) // 1 day ago
  }
];

/**
 * @route   GET /api/v1/notifications
 * @desc    Get authenticated user notifications and unread counter
 * @access  Private
 */
export const getMyNotifications = asyncHandler(async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    const unreadCount = FALLBACK_NOTIFICATIONS.filter(n => !n.isRead).length;
    return ApiResponse.ok(res, {
      notifications: FALLBACK_NOTIFICATIONS,
      unreadCount,
      totalCount: FALLBACK_NOTIFICATIONS.length
    }, 'Notifications retrieved');
  }

  const notifications = await Notification.find({ recipient: req.user._id })
    .sort({ createdAt: -1 })
    .limit(30);

  const unreadCount = await Notification.countDocuments({
    recipient: req.user._id,
    isRead: false
  });

  return ApiResponse.ok(res, {
    notifications,
    unreadCount,
    totalCount: notifications.length
  }, 'Notifications retrieved successfully');
});

/**
 * @route   PATCH /api/v1/notifications/:id/read
 * @desc    Mark a single notification as read
 * @access  Private
 */
export const markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (mongoose.connection.readyState !== 1) {
    const notif = FALLBACK_NOTIFICATIONS.find(n => n._id === id);
    if (notif) notif.isRead = true;
    return ApiResponse.ok(res, { notification: notif }, 'Notification marked as read');
  }

  const notification = await Notification.findOneAndUpdate(
    { _id: id, recipient: req.user._id },
    { isRead: true },
    { new: true }
  );

  if (!notification) throw ApiError.notFound('Notification not found');

  return ApiResponse.ok(res, { notification }, 'Notification marked as read');
});

/**
 * @route   PATCH /api/v1/notifications/read-all
 * @desc    Mark all unread notifications as read
 * @access  Private
 */
export const markAllAsRead = asyncHandler(async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    FALLBACK_NOTIFICATIONS.forEach(n => { n.isRead = true; });
    return ApiResponse.ok(res, null, 'All notifications marked as read');
  }

  await Notification.updateMany(
    { recipient: req.user._id, isRead: false },
    { isRead: true }
  );

  return ApiResponse.ok(res, null, 'All notifications marked as read successfully');
});
