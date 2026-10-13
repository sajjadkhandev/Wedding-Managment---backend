import mongoose from 'mongoose';
import WeddingProject from '../models/WeddingProject.js';
import WeddingEvent from '../models/WeddingEvent.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

// Fallback project dataset for offline development / test runner
const FALLBACK_PROJECT = {
  _id: 'proj-demo-1',
  title: 'Hassan & Ayesha’s Royal Wedding',
  coupleNames: { bride: 'Ayesha Malik', groom: 'Hassan Khan' },
  city: 'Lahore',
  totalBudgetPKR: 3500000,
  weddingDate: new Date('2026-11-20'),
  guestCount: 500,
  status: 'planning',
  events: [
    {
      _id: 'ev-1',
      eventType: 'Mehndi',
      customTitle: 'Festive Mehndi & Dholki Night',
      date: new Date('2026-11-18'),
      startTime: '19:00',
      endTime: '23:30',
      location: 'Mughal Heritage Lawn, Lahore',
      expectedGuests: 250,
      status: 'upcoming'
    },
    {
      _id: 'ev-2',
      eventType: 'Baraat',
      customTitle: 'Grand Baraat Reception',
      date: new Date('2026-11-20'),
      startTime: '19:30',
      endTime: '23:30',
      location: 'The Royal Crystal Ballroom, Gulberg III, Lahore',
      expectedGuests: 500,
      status: 'upcoming'
    },
    {
      _id: 'ev-3',
      eventType: 'Walima',
      customTitle: 'Elegant Walima Dinner',
      date: new Date('2026-11-22'),
      startTime: '20:00',
      endTime: '23:30',
      location: 'Pearl Continental Grand Hall, Lahore',
      expectedGuests: 400,
      status: 'upcoming'
    }
  ]
};

/**
 * @route   GET /api/v1/weddings
 * @desc    Get all wedding projects owned by the authenticated customer
 * @access  Private (Customer)
 */
export const getMyProjects = asyncHandler(async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return ApiResponse.ok(res, [FALLBACK_PROJECT], 'Projects retrieved (offline fallback)');
  }

  let projects = await WeddingProject.find({ customer: req.user._id }).sort({ createdAt: -1 });

  // If user has no project yet, auto-create initial wedding project with traditional Pakistani events
  if (projects.length === 0) {
    const defaultDate = new Date();
    defaultDate.setMonth(defaultDate.getMonth() + 2);

    const newProject = await WeddingProject.create({
      customer: req.user._id,
      title: `${req.user.name.split(' ')[0]}’s Wedding Celebration`,
      city: req.user.city || 'Lahore',
      totalBudgetPKR: 3000000,
      weddingDate: defaultDate,
      guestCount: 450,
      status: 'planning'
    });

    // Seed Mehndi, Baraat, Walima events
    const mehndiDate = new Date(defaultDate);
    mehndiDate.setDate(mehndiDate.getDate() - 2);

    const walimaDate = new Date(defaultDate);
    walimaDate.setDate(walimaDate.getDate() + 2);

    await WeddingEvent.insertMany([
      {
        project: newProject._id,
        customer: req.user._id,
        eventType: 'Mehndi',
        customTitle: 'Colorful Mehndi Night',
        date: mehndiDate,
        startTime: '19:00',
        endTime: '23:30',
        location: 'Lawn or Banquet to be decided',
        expectedGuests: 250
      },
      {
        project: newProject._id,
        customer: req.user._id,
        eventType: 'Baraat',
        customTitle: 'Grand Baraat Ceremony',
        date: defaultDate,
        startTime: '19:30',
        endTime: '23:30',
        location: 'Marriage Hall to be reserved',
        expectedGuests: 450
      },
      {
        project: newProject._id,
        customer: req.user._id,
        eventType: 'Walima',
        customTitle: 'Walima Reception Dinner',
        date: walimaDate,
        startTime: '20:00',
        endTime: '23:30',
        location: 'Banquet Hall to be reserved',
        expectedGuests: 350
      }
    ]);

    projects = [newProject];
  }

  return ApiResponse.ok(res, projects, 'Wedding projects retrieved');
});

/**
 * @route   POST /api/v1/weddings
 * @desc    Create a new wedding project
 * @access  Private (Customer)
 */
export const createProject = asyncHandler(async (req, res) => {
  const { title, brideName, groomName, city, totalBudgetPKR, weddingDate, guestCount, description } = req.body;

  if (!title) {
    throw ApiError.badRequest('Please provide a wedding title');
  }

  const project = await WeddingProject.create({
    customer: req.user._id,
    title,
    coupleNames: { bride: brideName || 'Bride', groom: groomName || 'Groom' },
    city: city || req.user.city || 'Lahore',
    totalBudgetPKR: totalBudgetPKR || 2500000,
    weddingDate: weddingDate ? new Date(weddingDate) : undefined,
    guestCount: guestCount || 400,
    description: description || ''
  });

  return ApiResponse.created(res, project, 'Wedding project created successfully');
});

/**
 * @route   GET /api/v1/weddings/:id
 * @desc    Get wedding project details and all associated events
 * @access  Private (Customer)
 */
export const getProjectById = asyncHandler(async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return ApiResponse.ok(res, FALLBACK_PROJECT, 'Project details retrieved (offline fallback)');
  }

  const project = await WeddingProject.findById(req.params.id);

  if (!project) {
    throw ApiError.notFound('Wedding project not found');
  }

  if (project.customer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw ApiError.forbidden('You are not authorized to access another customer’s wedding project');
  }

  const events = await WeddingEvent.find({ project: project._id }).sort({ date: 1 });

  // Schedule conflict detection: Check if any 2 events share the exact same calendar date
  const dateMap = {};
  const conflicts = [];
  events.forEach((ev) => {
    const dateKey = new Date(ev.date).toISOString().split('T')[0];
    if (dateMap[dateKey]) {
      conflicts.push({
        date: dateKey,
        event1: dateMap[dateKey].eventType,
        event2: ev.eventType,
        message: `Timing Warning: ${dateMap[dateKey].eventType} and ${ev.eventType} are scheduled on the same date (${dateKey}).`
      });
    } else {
      dateMap[dateKey] = ev;
    }
  });

  return ApiResponse.ok(res, { project, events, conflicts }, 'Wedding project details retrieved');
});

/**
 * @route   PUT /api/v1/weddings/:id
 * @desc    Update wedding project
 * @access  Private (Customer)
 */
export const updateProject = asyncHandler(async (req, res) => {
  const project = await WeddingProject.findById(req.params.id);

  if (!project) {
    throw ApiError.notFound('Wedding project not found');
  }

  if (project.customer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw ApiError.forbidden('Access forbidden: You do not own this project');
  }

  const updated = await WeddingProject.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  return ApiResponse.ok(res, updated, 'Wedding project updated successfully');
});

/**
 * @route   DELETE /api/v1/weddings/:id
 * @desc    Delete wedding project and cascade delete events
 * @access  Private (Customer)
 */
export const deleteProject = asyncHandler(async (req, res) => {
  const project = await WeddingProject.findById(req.params.id);

  if (!project) {
    throw ApiError.notFound('Wedding project not found');
  }

  if (project.customer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw ApiError.forbidden('Access forbidden: You do not own this project');
  }

  await WeddingEvent.deleteMany({ project: project._id });
  await WeddingProject.findByIdAndDelete(req.params.id);

  return ApiResponse.ok(res, null, 'Wedding project and associated events deleted');
});

/**
 * @route   POST /api/v1/weddings/:id/events
 * @desc    Add a wedding event (Mehndi, Baraat, Walima, Nikah) to project
 * @access  Private (Customer)
 */
export const addEventToProject = asyncHandler(async (req, res) => {
  const { eventType, customTitle, date, startTime, endTime, location, expectedGuests, notes } = req.body;

  if (!eventType || !date) {
    throw ApiError.badRequest('Event type and date are required');
  }

  const project = await WeddingProject.findById(req.params.id);
  if (!project) {
    throw ApiError.notFound('Wedding project not found');
  }

  if (project.customer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw ApiError.forbidden('Access forbidden: You do not own this project');
  }

  const event = await WeddingEvent.create({
    project: project._id,
    customer: req.user._id,
    eventType,
    customTitle: customTitle || `${eventType} Function`,
    date: new Date(date),
    startTime: startTime || '19:30',
    endTime: endTime || '23:30',
    location: location || 'To be decided',
    expectedGuests: expectedGuests || project.guestCount || 350,
    notes: notes || ''
  });

  return ApiResponse.created(res, event, `${eventType} event added successfully to project`);
});

/**
 * @route   PUT /api/v1/weddings/events/:eventId
 * @desc    Update a specific wedding event
 * @access  Private (Customer)
 */
export const updateEvent = asyncHandler(async (req, res) => {
  const event = await WeddingEvent.findById(req.params.eventId);
  if (!event) {
    throw ApiError.notFound('Wedding event not found');
  }

  if (event.customer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw ApiError.forbidden('Access forbidden: You do not own this event');
  }

  const updated = await WeddingEvent.findByIdAndUpdate(req.params.eventId, req.body, {
    new: true,
    runValidators: true
  });

  return ApiResponse.ok(res, updated, 'Wedding event updated successfully');
});

/**
 * @route   DELETE /api/v1/weddings/events/:eventId
 * @desc    Delete a specific wedding event
 * @access  Private (Customer)
 */
export const deleteEvent = asyncHandler(async (req, res) => {
  const event = await WeddingEvent.findById(req.params.eventId);
  if (!event) {
    throw ApiError.notFound('Wedding event not found');
  }

  if (event.customer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw ApiError.forbidden('Access forbidden: You do not own this event');
  }

  await WeddingEvent.findByIdAndDelete(req.params.eventId);

  return ApiResponse.ok(res, null, 'Wedding event deleted successfully');
});
