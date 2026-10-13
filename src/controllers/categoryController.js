import mongoose from 'mongoose';
import ServiceCategory from '../models/ServiceCategory.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

// Default Pakistani Wedding Categories to Seed if collection is empty
const DEFAULT_CATEGORIES = [
  { _id: 'cat-1', name: 'Wedding Venues & Halls', slug: 'venues', tagline: 'Banquet halls, marquees & lawns', icon: 'Building2', order: 1 },
  { _id: 'cat-2', name: 'Car Rental & Transport', slug: 'cars', tagline: 'Bridal luxury cars & guest buses', icon: 'Car', order: 2 },
  { _id: 'cat-3', name: 'Catering & Food', slug: 'catering', tagline: 'Pakistani Biryani, Karahi & BBQ buffets', icon: 'Utensils', order: 3 },
  { _id: 'cat-4', name: 'Photography & Cinema', slug: 'photography', tagline: 'Cinematic films, candid shots & drone reels', icon: 'Camera', order: 4 },
  { _id: 'cat-5', name: 'Stage Decor & Florists', slug: 'decoration', tagline: 'Royal stage designs & fresh floral arches', icon: 'Sparkles', order: 5 },
  { _id: 'cat-6', name: 'Bridal Makeup & Salons', slug: 'makeup', tagline: 'Certified bridal stylists & glam salons', icon: 'Palette', order: 6 },
  { _id: 'cat-7', name: 'Wedding Dresses', slug: 'dresses', tagline: 'Handmade Lehengas & royal Sherwanis', icon: 'Shirt', order: 7 },
  { _id: 'cat-8', name: 'Wedding Planners', slug: 'planners', tagline: 'Full event management & hospitality', icon: 'CalendarCheck', order: 8 }
];

/**
 * @route   GET /api/v1/categories
 * @desc    Fetch all active service categories (Auto-seeds default if empty or offline fallback)
 * @access  Public
 */
export const getCategories = asyncHandler(async (req, res) => {
  // If MongoDB is not connected (e.g. offline dev or test runner without live mongod), return default categories immediately
  if (mongoose.connection.readyState !== 1) {
    return ApiResponse.ok(res, DEFAULT_CATEGORIES, 'Categories retrieved (offline fallback)');
  }

  let categories = await ServiceCategory.find({ isActive: true }).sort({ order: 1 });

  // Auto-seed if database collection is empty
  if (categories.length === 0) {
    try {
      await ServiceCategory.insertMany(DEFAULT_CATEGORIES);
      categories = await ServiceCategory.find({ isActive: true }).sort({ order: 1 });
    } catch (e) {
      return ApiResponse.ok(res, DEFAULT_CATEGORIES, 'Categories retrieved (default seed)');
    }
  }

  return ApiResponse.ok(res, categories, 'Categories retrieved successfully');
});

/**
 * @route   POST /api/v1/categories
 * @desc    Create new service category
 * @access  Private (Admin only)
 */
export const createCategory = asyncHandler(async (req, res) => {
  const { name, slug, tagline, icon, image, order } = req.body;

  if (!name || !slug) {
    throw ApiError.badRequest('Please provide category name and slug');
  }

  const existing = await ServiceCategory.findOne({ slug: slug.toLowerCase() });
  if (existing) {
    throw ApiError.conflict('Category with this slug already exists');
  }

  const category = await ServiceCategory.create({
    name,
    slug: slug.toLowerCase(),
    tagline,
    icon,
    image,
    order: order || 0
  });

  return ApiResponse.created(res, category, 'Service category created successfully');
});

/**
 * @route   PUT /api/v1/categories/:id
 * @desc    Update category
 * @access  Private (Admin only)
 */
export const updateCategory = asyncHandler(async (req, res) => {
  const category = await ServiceCategory.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!category) {
    throw ApiError.notFound('Category not found');
  }

  return ApiResponse.ok(res, category, 'Category updated successfully');
});

/**
 * @route   DELETE /api/v1/categories/:id
 * @desc    Deactivate/delete category
 * @access  Private (Admin only)
 */
export const deleteCategory = asyncHandler(async (req, res) => {
  const category = await ServiceCategory.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  );

  if (!category) {
    throw ApiError.notFound('Category not found');
  }

  return ApiResponse.ok(res, null, 'Category deactivated successfully');
});
