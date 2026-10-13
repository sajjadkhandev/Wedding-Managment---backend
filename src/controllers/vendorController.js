import VendorProfile from '../models/VendorProfile.js';
import ServiceListing from '../models/ServiceListing.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * @route   GET /api/v1/vendors
 * @desc    Get verified vendor directory with filters
 * @access  Public
 */
export const getVendors = asyncHandler(async (req, res) => {
  const { city, category, search, page = 1, limit = 12 } = req.query;

  const query = { verificationStatus: 'approved' };

  if (city) query.city = city;
  if (category) query.categorySlugs = category;
  if (search) {
    query.$or = [
      { businessName: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const total = await VendorProfile.countDocuments(query);
  const vendors = await VendorProfile.find(query)
    .populate('categories', 'name slug icon')
    .sort({ rating: -1, createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit, 10));

  return ApiResponse.ok(
    res,
    {
      vendors,
      pagination: {
        total,
        page: parseInt(page, 10),
        pages: Math.ceil(total / parseInt(limit, 10))
      }
    },
    'Vendors retrieved successfully'
  );
});

/**
 * @route   GET /api/v1/vendors/:id
 * @desc    Get single vendor profile with listings
 * @access  Public
 */
export const getVendorById = asyncHandler(async (req, res) => {
  const vendor = await VendorProfile.findById(req.params.id)
    .populate('categories', 'name slug icon')
    .select('-cnicOrNtn'); // Protect CNIC/NTN from public view!

  if (!vendor) {
    throw ApiError.notFound('Vendor profile not found');
  }

  // Fetch active listings for this vendor
  const listings = await ServiceListing.find({ vendor: vendor._id, isActive: true });

  return ApiResponse.ok(res, { vendor, listings }, 'Vendor details retrieved');
});

/**
 * @route   GET /api/v1/vendors/profile/me
 * @desc    Get current authenticated vendor's private profile
 * @access  Private (Vendor only)
 */
export const getMyVendorProfile = asyncHandler(async (req, res) => {
  let profile = await VendorProfile.findOne({ user: req.user._id }).populate('categories');

  // If vendor profile does not exist yet (e.g. freshly registered), auto-create initial draft
  if (!profile) {
    profile = await VendorProfile.create({
      user: req.user._id,
      businessName: req.user.name,
      city: req.user.city || 'Lahore',
      address: 'Business address pending update',
      phone: req.user.phone,
      verificationStatus: req.user.status === 'active' ? 'approved' : 'pending'
    });
  }

  const listings = await ServiceListing.find({ vendor: profile._id });

  return ApiResponse.ok(res, { profile, listings }, 'Vendor profile retrieved');
});

/**
 * @route   PUT /api/v1/vendors/profile/me
 * @desc    Update current authenticated vendor's profile
 * @access  Private (Vendor only)
 */
export const updateMyVendorProfile = asyncHandler(async (req, res) => {
  const { businessName, city, address, description, coverImage, portfolioImages, phone, whatsapp } = req.body;

  let profile = await VendorProfile.findOne({ user: req.user._id });

  if (!profile) {
    throw ApiError.notFound('Vendor profile not found');
  }

  if (businessName) profile.businessName = businessName;
  if (city) profile.city = city;
  if (address) profile.address = address;
  if (description !== undefined) profile.description = description;
  if (coverImage) profile.coverImage = coverImage;
  if (portfolioImages) profile.portfolioImages = portfolioImages;
  if (phone) profile.phone = phone;
  if (whatsapp) profile.whatsapp = whatsapp;

  await profile.save();

  return ApiResponse.ok(res, profile, 'Vendor profile updated successfully');
});
