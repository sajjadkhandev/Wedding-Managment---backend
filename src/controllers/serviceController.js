import mongoose from 'mongoose';
import ServiceListing from '../models/ServiceListing.js';
import ServicePackage from '../models/ServicePackage.js';
import ServiceCategory from '../models/ServiceCategory.js';
import VendorProfile from '../models/VendorProfile.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

// Sample fallback services when MongoDB is offline / unit testing without live db
// Sample fallback services when MongoDB is offline / unit testing without live db
const FALLBACK_SERVICES = [
  {
    _id: 'srv-1',
    title: 'The Royal Crystal Ballroom',
    categorySlug: 'venues',
    city: 'Lahore',
    location: 'Gulberg III, Lahore',
    startingPrice: 350000,
    priceUnit: 'per event slot',
    capacity: 650,
    venueType: 'Indoor Luxury Hall',
    rating: 4.9,
    reviewsCount: 38,
    images: ['https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=800&q=80'],
    amenities: ['100% Generator Backup', 'Bridal Suite with Private Washroom', 'Valet Parking for 200 Cars', 'Central Air Conditioning'],
    description: 'An architectural marvel featuring Italian chandeliers, high ceilings, and royal carpeted flooring ideal for Baraat and Walima receptions.'
  },
  {
    _id: 'srv-2',
    title: 'Grand Serena Marquee',
    categorySlug: 'venues',
    city: 'Islamabad',
    location: 'Club Road, Islamabad',
    startingPrice: 450000,
    priceUnit: 'per event slot',
    capacity: 800,
    venueType: 'Modern Marquee',
    rating: 4.88,
    reviewsCount: 52,
    images: ['https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=800&q=80'],
    amenities: ['Margalla View Lawn', 'Separate Dining Hall', 'Helipad Facility', 'Dedicated Security Guard Team'],
    description: 'Set amidst the lush greenery of Islamabad, offering grand outdoor views with state-of-the-art climate-controlled marquee amenities.'
  },
  {
    _id: 'srv-3',
    title: 'Mughal Heritage Lawn & Banquet',
    categorySlug: 'venues',
    city: 'Karachi',
    location: 'KDA Scheme 1, Karachi',
    startingPrice: 280000,
    priceUnit: 'per event slot',
    capacity: 500,
    venueType: 'Open Lawn & Banquet',
    rating: 4.7,
    reviewsCount: 29,
    images: ['https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=800&q=80'],
    amenities: ['Lush Green Turf', 'Traditional Fountains', 'Bridal Dressing Room', 'Ample Parking'],
    description: 'Traditional Pakistani open-air lawn ambiance coupled with an opulent covered stage setup for colorful Mehndis and Baraats.'
  },
  {
    _id: 'srv-4',
    title: 'Royal Palm Golf & Country Club Marquee',
    categorySlug: 'venues',
    city: 'Lahore',
    location: 'Canal Bank Road, Lahore',
    startingPrice: 520000,
    priceUnit: 'per event slot',
    capacity: 1000,
    venueType: 'Modern Marquee',
    rating: 4.95,
    reviewsCount: 64,
    images: ['https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=800&q=80'],
    amenities: ['Lakeside Golf Course View', 'Executive Bridal Lounge', 'Valet Parking for 400+ Cars', 'Triple 500kVA Generators'],
    description: 'Prestigious country club marquee with panoramic golf course views, crystal chandeliers, and ultra-luxurious dining halls for royal wedding celebrations.'
  },
  {
    _id: 'srv-5',
    title: 'Beach Luxury Waterfront Banquet & Marquee',
    categorySlug: 'venues',
    city: 'Karachi',
    location: 'Moulvi Tamizuddin Khan Rd, Lalazar, Karachi',
    startingPrice: 380000,
    priceUnit: 'per event slot',
    capacity: 750,
    venueType: 'Open Lawn & Banquet',
    rating: 4.82,
    reviewsCount: 41,
    images: ['https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=800&q=80'],
    amenities: ['Sea Breeze Open Lawn', 'Covered Glass Marquee', 'Valet Waterfront Parking', 'Full Acoustic Lighting'],
    description: 'Karachi premier seaside wedding destination featuring historic palms, sea breezes, and stunning waterfront banquet setups for memorable Walimas.'
  },
  {
    _id: 'srv-6',
    title: 'The Monal Margalla Greens Marquee',
    categorySlug: 'venues',
    city: 'Islamabad',
    location: 'Margalla Foothills, Islamabad',
    startingPrice: 420000,
    priceUnit: 'per event slot',
    capacity: 600,
    venueType: 'Modern Marquee',
    rating: 4.9,
    reviewsCount: 35,
    images: ['https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80'],
    amenities: ['Margalla Mountain Panorama', 'Heated & Air-Conditioned', 'VIP Helicopter Pad', 'Live Floral Entryway'],
    description: 'Breathtaking mountain foothill venue with transparent marquee glass walls, scenic lighting, and elite catering options for destination-style weddings.'
  },
  {
    _id: 'srv-7',
    title: "Faletti's Heritage Grand Ballroom",
    categorySlug: 'venues',
    city: 'Lahore',
    location: 'Egerton Road, Lahore',
    startingPrice: 310000,
    priceUnit: 'per event slot',
    capacity: 450,
    venueType: 'Indoor Luxury Hall',
    rating: 4.88,
    reviewsCount: 47,
    images: ['https://images.unsplash.com/photo-1478146896981-b80fe463b330?auto=format&fit=crop&w=800&q=80'],
    amenities: ['Colonial Heritage Architecture', 'Red Carpet VIP Foyer', 'Bridal Suite with Dressing Salon', 'Central Climate Control'],
    description: 'Rich historical charm from 1880 combined with modern five-star banquet hospitality, antique gold trimmings, and regal ambience.'
  },
  {
    _id: 'srv-8',
    title: 'Pearl Continental Marquee & Banquet',
    categorySlug: 'venues',
    city: 'Rawalpindi',
    location: 'The Mall, Rawalpindi Cantt',
    startingPrice: 480000,
    priceUnit: 'per event slot',
    capacity: 850,
    venueType: 'Modern Marquee',
    rating: 4.92,
    reviewsCount: 58,
    images: ['https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=800&q=80'],
    amenities: ['5-Star Hotel Standards', 'Dedicated Valet 300 Cars', 'Integrated Buffet Area', 'Private VIP Rooms'],
    description: 'Twin Cities favorite five-star marquee facility offering massive column-free interior capacity and impeccable hospitality.'
  },
  {
    _id: 'srv-9',
    title: 'Chenab Palace & Royal Banquet',
    categorySlug: 'venues',
    city: 'Faisalabad',
    location: 'Jaranwala Road, Faisalabad',
    startingPrice: 290000,
    priceUnit: 'per event slot',
    capacity: 700,
    venueType: 'Indoor Luxury Hall',
    rating: 4.78,
    reviewsCount: 31,
    images: ['https://images.unsplash.com/photo-1523438885200-e635ba2c371e?auto=format&fit=crop&w=800&q=80'],
    amenities: ['Grand Stage Depth', 'Huge Dining Section', 'Uninterrupted Power Backup', 'Ample Car Parking'],
    description: 'Faisalabad largest luxury wedding banquet featuring majestic ceiling heights, intricate stage backdrops, and spacious guest walkways.'
  },
  {
    _id: 'srv-10',
    title: 'Mercedes-Benz S-Class (White Bridal Special)',
    categorySlug: 'cars',
    city: 'Lahore',
    startingPrice: 35000,
    priceUnit: 'per day (10 hrs)',
    carType: 'Luxury Sedan',
    rating: 4.9,
    reviewsCount: 44,
    images: ['https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=800&q=80']
  }
];

/**
 * @route   GET /api/v1/services
 * @desc    Search and browse service listings across Pakistan
 * @access  Public
 */
export const getServices = asyncHandler(async (req, res) => {
  const { category, city, minPrice, maxPrice, search, page = 1, limit = 12 } = req.query;

  // If MongoDB is not connected, return fallback dataset immediately
  if (mongoose.connection.readyState !== 1) {
    let filtered = FALLBACK_SERVICES;
    if (category) filtered = filtered.filter(s => s.categorySlug === category);
    if (city) filtered = filtered.filter(s => s.city.toLowerCase() === city.toLowerCase());
    return ApiResponse.ok(
      res,
      {
        services: filtered,
        pagination: {
          total: filtered.length,
          page: 1,
          pages: 1
        }
      },
      'Services retrieved (offline fallback)'
    );
  }

  const query = { isActive: true };

  if (category) query.categorySlug = category;
  if (city) query.city = city;
  if (minPrice || maxPrice) {
    query.startingPrice = {};
    if (minPrice) query.startingPrice.$gte = Number(minPrice);
    if (maxPrice) query.startingPrice.$lte = Number(maxPrice);
  }
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { location: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const total = await ServiceListing.countDocuments(query);
  const services = await ServiceListing.find(query)
    .populate('vendor', 'businessName rating isVerified city coverImage')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit, 10));

  return ApiResponse.ok(
    res,
    {
      services,
      pagination: {
        total,
        page: parseInt(page, 10),
        pages: Math.ceil(total / parseInt(limit, 10))
      }
    },
    'Services retrieved successfully'
  );
});

/**
 * @route   GET /api/v1/services/:id
 * @desc    Get single service listing details with packages
 * @access  Public
 */
export const getServiceById = asyncHandler(async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    const fallback = FALLBACK_SERVICES.find(s => s._id === req.params.id) || FALLBACK_SERVICES[0];
    return ApiResponse.ok(res, { service: fallback, packages: [] }, 'Service details retrieved (offline fallback)');
  }

  const service = await ServiceListing.findById(req.params.id)
    .populate('vendor', 'businessName phone whatsapp city rating isVerified description')
    .populate('category', 'name slug icon');

  if (!service) {
    throw ApiError.notFound('Service listing not found');
  }

  const packages = await ServicePackage.find({ listing: service._id, isActive: true });

  return ApiResponse.ok(res, { service, packages }, 'Service details retrieved');
});

/**
 * @route   POST /api/v1/services
 * @desc    Create new service listing
 * @access  Private (Vendor only)
 */
export const createService = asyncHandler(async (req, res) => {
  const {
    title,
    categorySlug,
    description,
    city,
    location,
    startingPrice,
    priceUnit,
    images,
    capacity,
    venueType,
    amenities,
    carType,
    modelYear,
    passengerCapacity,
    withDriver,
    highlights,
    packageIncludes
  } = req.body;

  if (!title || !categorySlug || !startingPrice) {
    throw ApiError.badRequest('Please provide title, category, and starting price in PKR');
  }

  // Find vendor profile associated with current user
  const vendor = await VendorProfile.findOne({ user: req.user._id });
  if (!vendor) {
    throw ApiError.forbidden('You must complete your vendor profile before creating listings');
  }

  // Find category document
  let categoryDoc = await ServiceCategory.findOne({ slug: categorySlug });
  if (!categoryDoc) {
    categoryDoc = await ServiceCategory.create({
      name: categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1),
      slug: categorySlug
    });
  }

  const listing = await ServiceListing.create({
    vendor: vendor._id,
    category: categoryDoc._id,
    categorySlug,
    title,
    description,
    city: city || vendor.city || 'Lahore',
    location: location || vendor.address,
    startingPrice,
    priceUnit: priceUnit || 'per event slot',
    images: images && images.length > 0 ? images : [vendor.coverImage],
    capacity: capacity || 0,
    venueType: venueType || 'Indoor Hall',
    amenities: amenities || [],
    carType: carType || '',
    modelYear: modelYear || undefined,
    passengerCapacity: passengerCapacity || 4,
    withDriver: withDriver !== undefined ? withDriver : true,
    highlights: highlights || [],
    packageIncludes: packageIncludes || []
  });

  return ApiResponse.created(res, listing, 'Service listing created successfully');
});

/**
 * @route   PUT /api/v1/services/:id
 * @desc    Update service listing (Enforces vendor ownership!)
 * @access  Private (Vendor only)
 */
export const updateService = asyncHandler(async (req, res) => {
  const listing = await ServiceListing.findById(req.params.id);

  if (!listing) {
    throw ApiError.notFound('Service listing not found');
  }

  // Verify ownership
  const vendor = await VendorProfile.findOne({ user: req.user._id });
  if (!vendor || listing.vendor.toString() !== vendor._id.toString()) {
    throw ApiError.forbidden('You are not authorized to edit another vendor’s listing');
  }

  const updatedListing = await ServiceListing.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  return ApiResponse.ok(res, updatedListing, 'Service listing updated successfully');
});

/**
 * @route   DELETE /api/v1/services/:id
 * @desc    Deactivate/delete service listing (Enforces vendor ownership!)
 * @access  Private (Vendor only)
 */
export const deleteService = asyncHandler(async (req, res) => {
  const listing = await ServiceListing.findById(req.params.id);

  if (!listing) {
    throw ApiError.notFound('Service listing not found');
  }

  const vendor = await VendorProfile.findOne({ user: req.user._id });
  if (!vendor || listing.vendor.toString() !== vendor._id.toString()) {
    throw ApiError.forbidden('You are not authorized to delete another vendor’s listing');
  }

  listing.isActive = false;
  await listing.save();

  return ApiResponse.ok(res, null, 'Service listing deactivated successfully');
});

/**
 * @route   POST /api/v1/services/:id/packages
 * @desc    Add a package to a service listing
 * @access  Private (Vendor only)
 */
export const addPackage = asyncHandler(async (req, res) => {
  const { packageName, pricePKR, priceUnit, description, includedItems, excludedItems } = req.body;

  if (!packageName || !pricePKR) {
    throw ApiError.badRequest('Package name and price in PKR are required');
  }

  const listing = await ServiceListing.findById(req.params.id);
  if (!listing) {
    throw ApiError.notFound('Service listing not found');
  }

  const vendor = await VendorProfile.findOne({ user: req.user._id });
  if (!vendor || listing.vendor.toString() !== vendor._id.toString()) {
    throw ApiError.forbidden('You can only add packages to your own listings');
  }

  const newPackage = await ServicePackage.create({
    listing: listing._id,
    vendor: vendor._id,
    packageName,
    pricePKR,
    priceUnit: priceUnit || listing.priceUnit,
    description: description || '',
    includedItems: includedItems || [],
    excludedItems: excludedItems || []
  });

  return ApiResponse.created(res, newPackage, 'Service package added successfully');
});

/**
 * @route   GET /api/v1/services/:id/packages
 * @desc    Get all active packages for a service listing
 * @access  Public
 */
export const getPackages = asyncHandler(async (req, res) => {
  const packages = await ServicePackage.find({ listing: req.params.id, isActive: true });
  return ApiResponse.ok(res, packages, 'Packages retrieved successfully');
});
