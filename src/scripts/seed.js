import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import User from '../models/User.js';
import VendorProfile from '../models/VendorProfile.js';
import ServiceCategory from '../models/ServiceCategory.js';
import ServiceListing from '../models/ServiceListing.js';
import ServicePackage from '../models/ServicePackage.js';
import WeddingProject from '../models/WeddingProject.js';
import WeddingEvent from '../models/WeddingEvent.js';
import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';
import Guest from '../models/Guest.js';
import Expense from '../models/Expense.js';
import WeddingTask from '../models/WeddingTask.js';
import Review from '../models/Review.js';
import Notification from '../models/Notification.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/wedplan';

const seedDatabase = async () => {
  console.log('🌸 WedPlan — Database Seeding Script Initiated');
  console.log(`Connecting to MongoDB at: ${MONGODB_URI}...`);

  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000
    });
    console.log('✅ Connected to MongoDB successfully.');
  } catch (err) {
    console.error('⚠️ Could not establish connection to MongoDB: ' + err.message);
    console.log('💡 Ensure MongoDB service or MongoDB Atlas cluster is online.');
    process.exit(0);
  }

  try {
    console.log('🧹 Purging existing test records...');
    await Promise.all([
      User.deleteMany({}),
      VendorProfile.deleteMany({}),
      ServiceCategory.deleteMany({}),
      ServiceListing.deleteMany({}),
      ServicePackage.deleteMany({}),
      WeddingProject.deleteMany({}),
      WeddingEvent.deleteMany({}),
      Booking.deleteMany({}),
      Payment.deleteMany({}),
      Guest.deleteMany({}),
      Expense.deleteMany({}),
      WeddingTask.deleteMany({}),
      Review.deleteMany({}),
      Notification.deleteMany({})
    ]);

    console.log('✨ 1. Seeding 8 Pakistani Wedding Categories...');
    const categoriesData = [
      {
        name: 'Wedding Venues & Banquets',
        slug: 'venues',
        tagline: 'Royal banquets, open-air lawns & grand marquees in Lahore, Karachi & Islamabad',
        icon: 'Building',
        order: 1
      },
      {
        name: 'Car Rental & Luxury Fleet',
        slug: 'cars',
        tagline: 'Chauffeur-driven luxury bridal sedans, vintage convertibles & guest vans',
        icon: 'Car',
        order: 2
      },
      {
        name: 'Feast & Royal Catering',
        slug: 'catering',
        tagline: 'Authentic Pakistani Dastarkhwan: Special Biryani, Live BBQ, Qorma & Sweets',
        icon: 'Utensils',
        order: 3
      },
      {
        name: 'Photography & Cinema',
        slug: 'photography',
        tagline: 'Award-winning bridal portraits, cinematic teaser reels & drone coverage',
        icon: 'Camera',
        order: 4
      },
      {
        name: 'Decoration & Stage Floral Art',
        slug: 'decoration',
        tagline: 'Majestic floral arches, royal velvet backdrops & vibrant Mehndi jhoolas',
        icon: 'Sparkles',
        order: 5
      },
      {
        name: 'Bridal Salons & Makeup',
        slug: 'makeup',
        tagline: 'Signature HD makeover, jewelry styling & groom grooming specialists',
        icon: 'Palette',
        order: 6
      },
      {
        name: 'Wedding Dresses & Sherwanis',
        slug: 'dresses',
        tagline: 'Designer zardozi bridal lehengas, prince coat sherwanis & rental attire',
        icon: 'Shirt',
        order: 7
      },
      {
        name: 'Wedding Planners & Hospitality',
        slug: 'planners',
        tagline: 'Full multi-day event management, guest concierge & zero-stress coordination',
        icon: 'CalendarCheck',
        order: 8
      }
    ];

    const categories = await ServiceCategory.insertMany(categoriesData);
    const catMap = {};
    categories.forEach((c) => {
      catMap[c.slug] = c._id;
    });

    console.log('👤 2. Seeding Core Users...');
    // We instantiate with new User(...) so the pre('save') bcrypt hook runs properly
    const adminUser = new User({
      name: 'Sajjad Wazir',
      email: 'sajjadwazir4459@email.com',
      password: 'Admin@123',
      phone: '03069122770',
      city: 'Islamabad',
      role: 'admin',
      isEmailVerified: true
    });
    await adminUser.save();

    const vendorUser = new User({
      name: 'Sheikh Tariq Mahmood',
      email: 'vendor@wedplan.pk',
      password: 'Vendor@123',
      phone: '+923219876543',
      city: 'Lahore',
      role: 'vendor',
      isEmailVerified: true
    });
    await vendorUser.save();

    const customerUser = new User({
      name: 'Hamza & Ayesha',
      email: 'customer@wedplan.pk',
      password: 'Customer@123',
      phone: '+923334567890',
      city: 'Lahore',
      role: 'customer',
      isEmailVerified: true
    });
    await customerUser.save();

    console.log('🏢 3. Seeding Verified Vendor Profile...');
    const vendorProfile = await VendorProfile.create({
      user: vendorUser._id,
      businessName: 'Royal Palm Marquee & Banquets',
      city: 'Lahore',
      address: '52 Canal Bank Road, Gulberg V, Lahore',
      categories: [catMap['venues']],
      categorySlugs: ['venues'],
      description: 'Lahore premier luxury wedding marquee accommodating 300 to 1200 guests with central climate control, executive VIP bridal suites, and valet parking.',
      phone: '+923219876543',
      whatsapp: '+923219876543',
      cnicOrNtn: '35201-1234567-9 / NTN-786012',
      isVerified: true,
      verificationStatus: 'approved',
      rating: 4.95,
      reviewsCount: 38
    });

    vendorUser.vendorProfile = vendorProfile._id;
    await vendorUser.save();

    console.log('📋 4. Seeding Marketplace Services & Packages...');
    const venueService = await ServiceListing.create({
      vendor: vendorProfile._id,
      category: catMap['venues'],
      categorySlug: 'venues',
      title: 'Grand Crystal Ballroom & Marquee',
      description: 'Magnificent banquet hall equipped with crystal chandeliers, acoustic surround system, and lush manicured lawn photo garden.',
      city: 'Lahore',
      location: 'Canal Road, Gulberg, Lahore',
      images: [
        'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80'
      ],
      startingPrice: 350000,
      priceUnit: 'per evening slot',
      capacity: 850,
      venueType: 'Indoor Hall & Lawn Combo',
      amenities: [
        'Central Air Conditioning & Heating',
        'Valet Parking for 200+ Cars',
        'Bridal Room with Private Washroom',
        'Generator Backup 500kVA',
        'CCTV Security & Guards'
      ],
      isFeatured: true,
      isActive: true
    });

    await ServicePackage.create([
      {
        listing: venueService._id,
        vendor: vendorProfile._id,
        packageName: 'Silver Evening Package',
        pricePKR: 350000,
        priceUnit: 'per slot',
        description: 'Standard 4-hour evening marquee reservation with stage lighting and basic furniture setup.',
        includedItems: ['Hall rental 7:30 PM - 11:30 PM', 'Basic carpet & stage', 'AC & generator power', 'Valet parking'],
        excludedItems: ['Floral decor', 'DJ & sound system', 'Catering']
      },
      {
        listing: venueService._id,
        vendor: vendorProfile._id,
        packageName: 'Royal Platinum Bundle',
        pricePKR: 650000,
        priceUnit: 'per slot',
        description: 'Comprehensive hall setup including ambient lighting, VIP stage sofa set, bridal lounge amenities, and red carpet.',
        includedItems: ['Full ballroom & lawn access', 'Stage furniture & chandeliers', 'Extended 5-hour duration', 'Security team', 'Cleaning crew']
      }
    ]);

    console.log('💍 5. Seeding Customer Wedding Project & Events...');
    const weddingProject = await WeddingProject.create({
      customer: customerUser._id,
      title: 'Hamza & Ayesha Royal Wedding 2026',
      coupleNames: {
        bride: 'Ayesha Khan',
        groom: 'Hamza Tariq'
      },
      city: 'Lahore',
      totalBudgetPKR: 3500000,
      weddingDate: new Date('2026-12-25'),
      guestCount: 500,
      description: 'A traditional 3-day Pakistani celebration with family and friends.',
      status: 'active'
    });

    const baraatEvent = await WeddingEvent.create({
      project: weddingProject._id,
      customer: customerUser._id,
      eventType: 'Baraat',
      customTitle: 'The Grand Baraat & Reception',
      date: new Date('2026-12-25'),
      startTime: '19:30',
      endTime: '23:30',
      location: 'Grand Crystal Ballroom, Lahore',
      expectedGuests: 500,
      notes: 'Main departure ceremony, strict on-time protocol for dinner at 9:00 PM.'
    });

    await WeddingEvent.create({
      project: weddingProject._id,
      customer: customerUser._id,
      eventType: 'Walima',
      customTitle: 'Walima Celebration Banquet',
      date: new Date('2026-12-27'),
      startTime: '20:00',
      endTime: '23:30',
      location: 'Pearl Continental Marquee, Lahore',
      expectedGuests: 400
    });

    console.log('📅 6. Seeding Confirmed Booking & Advance Payment...');
    const booking = await Booking.create({
      bookingNumber: 'WP-BK-2026-8812',
      customer: customerUser._id,
      vendor: vendorProfile._id,
      vendorUser: vendorUser._id,
      service: venueService._id,
      weddingProject: weddingProject._id,
      weddingEvent: baraatEvent._id,
      eventName: 'Baraat',
      eventDate: new Date('2026-12-25'),
      timeSlot: 'evening',
      guestCount: 500,
      status: 'confirmed',
      totalAmount: 350000,
      paidAmount: 70000, // 20% advance milestone
      balanceAmount: 280000,
      paymentStatus: 'partially_paid',
      specialRequests: 'Please keep bridal suite chilled from 6:00 PM.',
      packageSnapshot: {
        title: venueService.title,
        pricePKR: 350000,
        pricingModel: 'fixed',
        city: 'Lahore'
      }
    });

    await Payment.create({
      paymentNumber: 'WP-PAY-2026-001',
      invoiceNumber: 'WP-INV-2026-001',
      booking: booking._id,
      customer: customerUser._id,
      vendor: vendorProfile._id,
      amount: 70000,
      paymentMethod: 'bank_transfer',
      paymentType: 'advance_deposit',
      paymentStatus: 'completed',
      bankReference: 'HBL-FT-991204881',
      notes: '20% advance booking deposit confirmed via HBL online transfer.'
    });

    console.log('📝 7. Seeding Planning Hub (Guests, Budget & Tasks)...');
    await Guest.create([
      {
        project: weddingProject._id,
        customer: customerUser._id,
        name: 'Chaudhry Nadeem Akhtar',
        side: 'groom',
        category: 'close_family',
        phone: '+923005551234',
        plusOnes: 3,
        rsvpStatus: 'attending',
        dietaryRestrictions: 'Non-spicy'
      },
      {
        project: weddingProject._id,
        customer: customerUser._id,
        name: 'Dr. Farah Naz',
        side: 'bride',
        category: 'vip',
        phone: '+923214445678',
        plusOnes: 2,
        rsvpStatus: 'attending'
      }
    ]);

    await Expense.create([
      {
        project: weddingProject._id,
        customer: customerUser._id,
        category: 'venue',
        title: 'Grand Crystal Ballroom Advance',
        allocatedBudgetPKR: 400000,
        actualSpentPKR: 70000,
        paidTo: 'Royal Palm Marquee',
        paymentStatus: 'partially_paid'
      },
      {
        project: weddingProject._id,
        customer: customerUser._id,
        category: 'catering',
        title: 'Hanif Rajput Mutton Dastarkhwan Budget',
        allocatedBudgetPKR: 1200000,
        actualSpentPKR: 0,
        paymentStatus: 'unpaid'
      }
    ]);

    await WeddingTask.create([
      {
        project: weddingProject._id,
        customer: customerUser._id,
        title: 'Confirm stage floral color palette with designer',
        category: 'decoration',
        assignedTo: 'Ayesha Khan',
        dueDate: new Date('2026-11-15'),
        priority: 'high',
        isCompleted: true
      },
      {
        project: weddingProject._id,
        customer: customerUser._id,
        title: 'Finalize Nikah registrar and witness signatures',
        category: 'general',
        assignedTo: 'Hamza Tariq',
        dueDate: new Date('2026-12-01'),
        priority: 'urgent',
        isCompleted: false
      }
    ]);

    console.log('⭐ 8. Seeding Verified Review & Notification...');
    await Review.create({
      booking: booking._id,
      vendor: vendorProfile._id,
      customer: customerUser._id,
      rating: 5,
      aspectRatings: {
        professionalism: 5,
        punctuality: 5,
        quality: 5,
        valueForMoney: 5
      },
      comment: 'Exceptional service! The hall was spotless, temperature was perfectly controlled, and the management made our Baraat unforgettable.',
      isVerifiedBooking: true,
      isVisible: true
    });

    await Notification.create({
      recipient: customerUser._id,
      sender: vendorUser._id,
      title: 'Booking Confirmed!',
      message: 'Royal Palm Marquee has officially confirmed your Baraat reservation for Dec 25, 2026.',
      type: 'booking_accepted',
      link: '/customer/dashboard'
    });

    console.log('\n======================================================');
    console.log('🎉 WedPlan Database Seed Completed Successfully!');
    console.log('======================================================');
    console.log('Credentials Summary:');
    console.log(' • Administrator : sajjadwazir4459@email.com / Admin@123 (Sajjad Wazir)');
    console.log(' • Verified Vendor: vendor@wedplan.pk   / Vendor@123');
    console.log(' • Customer       : customer@wedplan.pk / Customer@123');
    console.log('======================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error during seeding: ' + error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

seedDatabase();
