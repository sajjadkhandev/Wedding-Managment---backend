import mongoose from 'mongoose';
import Guest from '../models/Guest.js';
import Expense from '../models/Expense.js';
import WeddingTask from '../models/WeddingTask.js';
import WeddingProject from '../models/WeddingProject.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

// Fallback in-memory dataset for guests, expenses, tasks
const FALLBACK_GUESTS = [
  {
    _id: 'g-demo-1',
    name: 'Tariq Mehmood',
    familyTitle: 'Chaudhry Family',
    side: 'bride',
    phone: '03009876543',
    city: 'Lahore',
    totalMembers: 4,
    eventsInvited: ['Mehndi', 'Baraat', 'Walima'],
    rsvpStatus: 'attending',
    rsvpConfirmedCount: 4,
    tableNumber: 'Table A-1',
    invitationSent: true
  },
  {
    _id: 'g-demo-2',
    name: 'Dr. Kamran Siddiqui',
    familyTitle: 'Siddiqui Family',
    side: 'groom',
    phone: '03214567890',
    city: 'Karachi',
    totalMembers: 3,
    eventsInvited: ['Baraat', 'Walima'],
    rsvpStatus: 'attending',
    rsvpConfirmedCount: 3,
    tableNumber: 'Table B-3',
    invitationSent: true
  },
  {
    _id: 'g-demo-3',
    name: 'Farhan Zaidi',
    familyTitle: 'Zaidi Household',
    side: 'both',
    phone: '03331122334',
    city: 'Islamabad',
    totalMembers: 2,
    eventsInvited: ['Walima'],
    rsvpStatus: 'pending',
    rsvpConfirmedCount: 0,
    tableNumber: '',
    invitationSent: false
  }
];

const FALLBACK_EXPENSES = [
  {
    _id: 'exp-demo-1',
    category: 'venue',
    title: 'The Royal Crystal Ballroom - Hall Rental',
    estimatedCostPKR: 350000,
    actualCostPKR: 350000,
    paidAmountPKR: 70000,
    status: 'deposit_paid',
    paymentMethod: 'bank_transfer',
    notes: '20% deposit cleared. Remaining due on event day.'
  },
  {
    _id: 'exp-demo-2',
    category: 'catering',
    title: 'Royal Dastarkhwan (Mutton Biryani + Charcoal BBQ)',
    estimatedCostPKR: 850000,
    actualCostPKR: 832500,
    paidAmountPKR: 200000,
    status: 'deposit_paid',
    paymentMethod: 'bank_transfer',
    notes: '450 guests @ Rs. 1,850/head.'
  },
  {
    _id: 'exp-demo-3',
    category: 'photography',
    title: 'Signature Cinematic Video & Couple Studio Shoot',
    estimatedCostPKR: 160000,
    actualCostPKR: 160000,
    paidAmountPKR: 50000,
    status: 'deposit_paid',
    paymentMethod: 'cash',
    notes: 'Advance given for Mehndi + Baraat coverage.'
  },
  {
    _id: 'exp-demo-4',
    category: 'car_rental',
    title: 'Rolls Royce Ghost Bridal Car with Chauffeur',
    estimatedCostPKR: 95000,
    actualCostPKR: 95000,
    paidAmountPKR: 20000,
    status: 'deposit_paid',
    paymentMethod: 'easypaisa',
    notes: 'Pickup from Gulberg III.'
  }
];

const FALLBACK_TASKS = [
  {
    _id: 'tsk-demo-1',
    title: 'Finalize Baraat stage backdrop color scheme with decorator',
    category: 'Decor',
    assignedTo: 'Bride & Sister',
    dueDate: new Date('2026-11-05'),
    priority: 'high',
    isCompleted: true,
    completedAt: new Date('2026-10-01')
  },
  {
    _id: 'tsk-demo-2',
    title: 'Confirm sweet boxes (Mithai) order with Rehmat-e-Shereen',
    category: 'Catering',
    assignedTo: 'Groom’s Father',
    dueDate: new Date('2026-11-10'),
    priority: 'medium',
    isCompleted: false
  },
  {
    _id: 'tsk-demo-3',
    title: 'Dispatch digital wedding card invitations via WhatsApp to RSVP list',
    category: 'Invitations',
    assignedTo: 'Hassan',
    dueDate: new Date('2026-10-25'),
    priority: 'urgent',
    isCompleted: false
  }
];

// Helper: Calculate Budget Breakdown
export const computeBudgetSummary = (totalBudgetPKR, expenseList) => {
  const totalEstimated = expenseList.reduce((acc, exp) => acc + (exp.estimatedCostPKR || 0), 0);
  const totalActual = expenseList.reduce((acc, exp) => acc + (exp.actualCostPKR || 0), 0);
  const totalPaid = expenseList.reduce((acc, exp) => acc + (exp.paidAmountPKR || 0), 0);
  const remainingBudget = totalBudgetPKR - totalActual;
  const pendingPayments = totalActual - totalPaid;

  return {
    totalBudgetPKR,
    totalEstimatedPKR: totalEstimated,
    totalActualPKR: totalActual,
    totalPaidPKR: totalPaid,
    remainingBudgetPKR: remainingBudget,
    pendingPaymentsPKR: pendingPayments > 0 ? pendingPayments : 0,
    budgetUtilizationPercent: totalBudgetPKR > 0 ? Math.round((totalActual / totalBudgetPKR) * 100) : 0
  };
};

// ==========================================
// GUEST LIST CONTROLLERS
// ==========================================

export const getGuests = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { side, rsvpStatus } = req.query;

  if (mongoose.connection.readyState !== 1) {
    let list = [...FALLBACK_GUESTS];
    if (side) list = list.filter(g => g.side === side);
    if (rsvpStatus) list = list.filter(g => g.rsvpStatus === rsvpStatus);

    const stats = {
      totalGuests: list.reduce((acc, g) => acc + (g.totalMembers || 1), 0),
      confirmedAttending: list.filter(g => g.rsvpStatus === 'attending').reduce((acc, g) => acc + (g.rsvpConfirmedCount || g.totalMembers || 1), 0),
      pendingRSVP: list.filter(g => g.rsvpStatus === 'pending').reduce((acc, g) => acc + (g.totalMembers || 1), 0)
    };

    return ApiResponse.ok(res, { guests: list, stats }, 'Guest list retrieved');
  }

  const query = { weddingProject: projectId };
  if (side) query.side = side;
  if (rsvpStatus) query.rsvpStatus = rsvpStatus;

  const guests = await Guest.find(query).sort({ createdAt: -1 });

  const stats = {
    totalGuests: guests.reduce((acc, g) => acc + (g.totalMembers || 1), 0),
    confirmedAttending: guests.filter(g => g.rsvpStatus === 'attending').reduce((acc, g) => acc + (g.rsvpConfirmedCount || g.totalMembers || 1), 0),
    pendingRSVP: guests.filter(g => g.rsvpStatus === 'pending').reduce((acc, g) => acc + (g.totalMembers || 1), 0)
  };

  return ApiResponse.ok(res, { guests, stats }, 'Guest list retrieved successfully');
});

export const createGuest = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { name, familyTitle, side = 'bride', phone, email, city, totalMembers = 1, eventsInvited = ['Baraat'], tableNumber } = req.body;

  if (!name) throw ApiError.badRequest('Guest name is required');

  if (mongoose.connection.readyState !== 1) {
    const demoGuest = {
      _id: `g-demo-${Date.now()}`,
      weddingProject: projectId,
      name,
      familyTitle,
      side,
      phone,
      email,
      city: city || 'Lahore',
      totalMembers: Number(totalMembers),
      eventsInvited,
      rsvpStatus: 'pending',
      rsvpConfirmedCount: 0,
      tableNumber,
      invitationSent: false
    };
    FALLBACK_GUESTS.unshift(demoGuest);
    return ApiResponse.created(res, { guest: demoGuest }, 'Guest added successfully');
  }

  const newGuest = await Guest.create({
    weddingProject: projectId,
    name,
    familyTitle,
    side,
    phone,
    email,
    city: city || 'Lahore',
    totalMembers: Number(totalMembers),
    eventsInvited,
    tableNumber
  });

  return ApiResponse.created(res, { guest: newGuest }, 'Guest added successfully');
});

export const updateRSVP = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rsvpStatus, rsvpConfirmedCount } = req.body;

  if (!rsvpStatus) throw ApiError.badRequest('RSVP status is required');

  if (mongoose.connection.readyState !== 1) {
    const guest = FALLBACK_GUESTS.find(g => g._id === id) || FALLBACK_GUESTS[0];
    guest.rsvpStatus = rsvpStatus;
    if (rsvpConfirmedCount !== undefined) {
      guest.rsvpConfirmedCount = Number(rsvpConfirmedCount);
    } else if (rsvpStatus === 'attending') {
      guest.rsvpConfirmedCount = guest.totalMembers;
    }
    return ApiResponse.ok(res, { guest }, 'RSVP updated');
  }

  const guest = await Guest.findById(id);
  if (!guest) throw ApiError.notFound('Guest not found');

  guest.rsvpStatus = rsvpStatus;
  if (rsvpConfirmedCount !== undefined) {
    guest.rsvpConfirmedCount = Number(rsvpConfirmedCount);
  } else if (rsvpStatus === 'attending') {
    guest.rsvpConfirmedCount = guest.totalMembers;
  }
  await guest.save();

  return ApiResponse.ok(res, { guest }, 'RSVP updated successfully');
});

export const deleteGuest = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (mongoose.connection.readyState !== 1) {
    const idx = FALLBACK_GUESTS.findIndex(g => g._id === id);
    if (idx !== -1) FALLBACK_GUESTS.splice(idx, 1);
    return ApiResponse.ok(res, null, 'Guest removed');
  }

  await Guest.findByIdAndDelete(id);
  return ApiResponse.ok(res, null, 'Guest removed successfully');
});

// ==========================================
// BUDGET & EXPENSES CONTROLLERS
// ==========================================

export const getExpenses = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  if (mongoose.connection.readyState !== 1) {
    const totalBudgetPKR = 3500000;
    const summary = computeBudgetSummary(totalBudgetPKR, FALLBACK_EXPENSES);
    return ApiResponse.ok(res, { expenses: FALLBACK_EXPENSES, summary }, 'Expenses retrieved');
  }

  const project = await WeddingProject.findById(projectId);
  const totalBudgetPKR = project?.totalBudgetPKR || 0;

  const expenses = await Expense.find({ weddingProject: projectId }).sort({ createdAt: -1 });
  const summary = computeBudgetSummary(totalBudgetPKR, expenses);

  return ApiResponse.ok(res, { expenses, summary }, 'Expenses and budget summary retrieved');
});

export const createExpense = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { category, title, estimatedCostPKR, actualCostPKR = 0, paidAmountPKR = 0, status = 'planned', paymentMethod = 'bank_transfer', notes = '' } = req.body;

  if (!category || !title || estimatedCostPKR === undefined) {
    throw ApiError.badRequest('Category, title, and estimatedCostPKR are required');
  }

  if (mongoose.connection.readyState !== 1) {
    const demoExpense = {
      _id: `exp-demo-${Date.now()}`,
      weddingProject: projectId,
      category,
      title,
      estimatedCostPKR: Number(estimatedCostPKR),
      actualCostPKR: Number(actualCostPKR),
      paidAmountPKR: Number(paidAmountPKR),
      status,
      paymentMethod,
      notes
    };
    FALLBACK_EXPENSES.unshift(demoExpense);
    return ApiResponse.created(res, { expense: demoExpense }, 'Expense added');
  }

  const expense = await Expense.create({
    weddingProject: projectId,
    category,
    title,
    estimatedCostPKR: Number(estimatedCostPKR),
    actualCostPKR: Number(actualCostPKR),
    paidAmountPKR: Number(paidAmountPKR),
    status,
    paymentMethod,
    notes
  });

  return ApiResponse.created(res, { expense }, 'Expense recorded successfully');
});

export const deleteExpense = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (mongoose.connection.readyState !== 1) {
    const idx = FALLBACK_EXPENSES.findIndex(e => e._id === id);
    if (idx !== -1) FALLBACK_EXPENSES.splice(idx, 1);
    return ApiResponse.ok(res, null, 'Expense removed');
  }

  await Expense.findByIdAndDelete(id);
  return ApiResponse.ok(res, null, 'Expense removed successfully');
});

// ==========================================
// TASKS & CHECKLIST CONTROLLERS
// ==========================================

export const getTasks = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  if (mongoose.connection.readyState !== 1) {
    const total = FALLBACK_TASKS.length;
    const completed = FALLBACK_TASKS.filter(t => t.isCompleted).length;
    return ApiResponse.ok(res, {
      tasks: FALLBACK_TASKS,
      stats: { total, completed, pending: total - completed, percent: Math.round((completed / total) * 100) || 0 }
    }, 'Tasks retrieved');
  }

  const tasks = await WeddingTask.find({ weddingProject: projectId }).sort({ isCompleted: 1, priority: -1 });
  const total = tasks.length;
  const completed = tasks.filter(t => t.isCompleted).length;

  return ApiResponse.ok(res, {
    tasks,
    stats: { total, completed, pending: total - completed, percent: Math.round((completed / total) * 100) || 0 }
  }, 'Tasks retrieved successfully');
});

export const createTask = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { title, category = 'General', assignedTo = '', dueDate, priority = 'medium' } = req.body;

  if (!title) throw ApiError.badRequest('Task title is required');

  if (mongoose.connection.readyState !== 1) {
    const demoTask = {
      _id: `tsk-demo-${Date.now()}`,
      weddingProject: projectId,
      title,
      category,
      assignedTo,
      dueDate: dueDate ? new Date(dueDate) : null,
      priority,
      isCompleted: false
    };
    FALLBACK_TASKS.unshift(demoTask);
    return ApiResponse.created(res, { task: demoTask }, 'Task created');
  }

  const task = await WeddingTask.create({
    weddingProject: projectId,
    title,
    category,
    assignedTo,
    dueDate: dueDate ? new Date(dueDate) : null,
    priority
  });

  return ApiResponse.created(res, { task }, 'Task created successfully');
});

export const toggleTask = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (mongoose.connection.readyState !== 1) {
    const task = FALLBACK_TASKS.find(t => t._id === id) || FALLBACK_TASKS[0];
    task.isCompleted = !task.isCompleted;
    task.completedAt = task.isCompleted ? new Date() : null;
    return ApiResponse.ok(res, { task }, 'Task status toggled');
  }

  const task = await WeddingTask.findById(id);
  if (!task) throw ApiError.notFound('Task not found');

  task.isCompleted = !task.isCompleted;
  task.completedAt = task.isCompleted ? new Date() : null;
  await task.save();

  return ApiResponse.ok(res, { task }, 'Task status updated successfully');
});

export const deleteTask = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (mongoose.connection.readyState !== 1) {
    const idx = FALLBACK_TASKS.findIndex(t => t._id === id);
    if (idx !== -1) FALLBACK_TASKS.splice(idx, 1);
    return ApiResponse.ok(res, null, 'Task removed');
  }

  await WeddingTask.findByIdAndDelete(id);
  return ApiResponse.ok(res, null, 'Task removed successfully');
});
