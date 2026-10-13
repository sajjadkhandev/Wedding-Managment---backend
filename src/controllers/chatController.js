import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * Intelligent Pakistani Wedding Concierge Response Generator
 */
export const generateWeddingResponse = (userMessage, context = {}) => {
  const query = (userMessage || '').toLowerCase().trim();

  // 1. Budget & Estimation Inquiries
  if (query.includes('budget') || query.includes('cost') || query.includes('kharcha') || query.includes('karcha') || query.includes('price estimate')) {
    const guestMatch = query.match(/(\d+)\s*(guests?|people|log|afraad)/i) || query.match(/(\d+)/);
    const guestCount = guestMatch ? parseInt(guestMatch[1], 10) : 400;

    const foodRate = 2000; // PKR per head average
    const foodTotal = guestCount * foodRate;
    const hallEstimate = guestCount > 500 ? 500000 : 350000;
    const decorEstimate = 180000;
    const photoEstimate = 120000;
    const carEstimate = 35000;
    const totalEstimate = foodTotal + hallEstimate + decorEstimate + photoEstimate + carEstimate;

    return {
      reply: `For an estimated **${guestCount} guests** in Pakistan, here is a realistic budget blueprint:\n\n` +
        `• **Catering (Royal Dastarkhwan @ Rs. ${foodRate.toLocaleString()}/head):** Rs. ${foodTotal.toLocaleString()}\n` +
        `• **Banquet Hall / Marquee Rental:** Rs. ${hallEstimate.toLocaleString()}\n` +
        `• **Stage Décor & Fresh Floral Setup:** Rs. ${decorEstimate.toLocaleString()}\n` +
        `• **Photography & 4K Cinema Reels:** Rs. ${photoEstimate.toLocaleString()}\n` +
        `• **Bridal Luxury Car (Mercedes S-Class with Chauffeur):** Rs. ${carEstimate.toLocaleString()}\n\n` +
        `📊 **Estimated Total:** **Rs. ${totalEstimate.toLocaleString()} PKR**\n\n` +
        `*Tip: Booking one of our 3-Day Wedding Combos can save you up to 15% (Rs. 180,000+ PKR)!*`,
      suggestions: [
        'View Curated Wedding Packages',
        'Browse Banquet Halls',
        'Book Bridal Car'
      ],
      actionLink: '/packages'
    };
  }

  // 2. Venues & Marriage Halls
  if (query.includes('venue') || query.includes('hall') || query.includes('marquee') || query.includes('lawn') || query.includes('banquet') || query.includes('shadi hall')) {
    let city = 'Pakistan';
    if (query.includes('lahore')) city = 'Lahore';
    else if (query.includes('karachi')) city = 'Karachi';
    else if (query.includes('islamabad')) city = 'Islamabad';
    else if (query.includes('rawalpindi')) city = 'Rawalpindi';

    return {
      reply: `We feature **9 verified premium wedding venues** in ${city}!\n\n` +
        `• **The Royal Crystal Ballroom** (Lahore) — Italian chandeliers, 650 capacity (Rs. 350,000/slot)\n` +
        `• **Grand Serena Marquee** (Islamabad) — Margalla views, 800 capacity (Rs. 450,000/slot)\n` +
        `• **Mughal Heritage Lawn & Banquet** (Karachi) — 500 capacity open-air (Rs. 280,000/slot)\n` +
        `• **Royal Palm Golf Marquee** (Lahore) — 1,000 capacity lakeside marquee (Rs. 520,000/slot)\n\n` +
        `All venues feature 100% generator power backup, valet parking, and private bridal dressing suites.`,
      suggestions: [
        'Check Venue Availability',
        'Filter Venues by City',
        'View All 9 Venues'
      ],
      actionLink: '/services/venues'
    };
  }

  // 3. Car Rental & Luxury Transport
  if (query.includes('car') || query.includes('gari') || query.includes('transport') || query.includes('mercedes') || query.includes('prado') || query.includes('rolls royce') || query.includes('coaster')) {
    return {
      reply: `Our wedding fleet includes verified chauffeur-driven bridal luxury vehicles across Pakistan:\n\n` +
        `• **Mercedes-Benz S-Class (White Bridal Special):** Rs. 35,000/day (10 hrs with uniform-attired driver & flower decor option)\n` +
        `• **Toyota Land Cruiser Prado TX (Black Edition):** Rs. 25,000/day for family escort & Baraat motorcade\n` +
        `• **Vintage 1965 Rolls Royce Silver Cloud:** Rs. 55,000 per 6-hr slot for timeless couple portraits\n` +
        `• **Toyota Coaster Saloon (29 Seater):** Rs. 18,000/day for comfortable Baraat guest transport\n\n` +
        `Would you like to check vehicle availability for your Baraat or Walima?`,
      suggestions: [
        'Book Bridal Mercedes S-Class',
        'View Guest Coaster Buses',
        'Browse All Rental Cars'
      ],
      actionLink: '/services/cars'
    };
  }

  // 4. Catering & Dastarkhwan
  if (query.includes('cater') || query.includes('food') || query.includes('khana') || query.includes('biryani') || query.includes('bbq') || query.includes('qorma') || query.includes('menu')) {
    return {
      reply: `Our caterers prepare authentic royal Pakistani wedding feasts compliant with 1-dish regulations and gourmet multi-dish buffets:\n\n` +
        `• **Shahi Dastarkhwan Menu:** Special Mutton Biryani (Aged Basmati), Chicken Achari Karahi, Mutton Seekh Kabab, Roghani Naan, Shahi Kheer & Hot Gulab Jamun (Rs. 1,850/person)\n` +
        `• **Mezban Executive Buffet:** Dum Pukht Mutton Qorma, Chicken Reshmi Boti, Live Tawa Fish, Fresh Salad Bar & Kashmiri Chai (Rs. 2,200/person)\n\n` +
        `All catering packages include professional serving staff and heavy chafing dishes.`,
      suggestions: [
        'View Catering Menus',
        'Calculate Food Cost',
        'Request Custom Menu'
      ],
      actionLink: '/services/catering'
    };
  }

  // 5. Wedding Packages & Combo Bundles
  if (query.includes('package') || query.includes('bundle') || query.includes('discount') || query.includes('combo') || query.includes('all in one')) {
    return {
      reply: `We offer **7 all-inclusive wedding combo packages** that bundle venue, stage décor, 4K photography, and bridal cars with up to **Rs. 220,000 PKR in savings**:\n\n` +
        `1. **The Royal 3-Day Wedding Combo** (Mehndi + Baraat + Walima) — Rs. 1,250,000 (Save Rs. 180,000)\n` +
        `2. **Baraat & Walima Signature Duo** — Rs. 850,000 (Save Rs. 95,000)\n` +
        `3. **Intimate Nikah & Family Dinner Package** — Rs. 420,000 (Save Rs. 60,000)\n` +
        `4. **Grand Shahi Dastarkhwan & Banquet Combo** — Rs. 980,000 (Save Rs. 120,000)\n` +
        `5. **Vibrant Colorful Mehndi & Sangeet Bash** — Rs. 380,000 (Save Rs. 45,000)\n\n` +
        `You can click **"Select Package"** directly on our Packages page to customize dates and lock in your rate with a 20% advance milestone!`,
      suggestions: [
        'View All 7 Packages',
        'Select 3-Day Wedding Combo',
        'Check Nikah Package'
      ],
      actionLink: '/packages'
    };
  }

  // 6. Photography & Cinema
  if (query.includes('photo') || query.includes('shoot') || query.includes('video') || query.includes('camera') || query.includes('drone') || query.includes('album')) {
    return {
      reply: `WedPlan photographers specialize in Pakistani bridal aesthetics and cinematic teaser films:\n\n` +
        `• **Noor Wedding Cinema (Lahore):** 2 Candid Photographers, 1 Videographer, 4K Drone footage, Luxury Leather Album & Instagram Teaser in 48 hours (Rs. 120,000/day)\n` +
        `• **Aura Lens (Karachi):** Full ceremony coverage, signature couple portraits, high-res edited soft copies (Rs. 95,000/day)\n\n` +
        `You can browse portfolios and check photographer dates right now.`,
      suggestions: [
        'View Photography Studios',
        'Watch Drone Cinema Samples',
        'Check Date Availability'
      ],
      actionLink: '/services/photography'
    };
  }

  // 7. Human Planner / Talk to Agent / Help
  if (query.includes('human') || query.includes('agent') || query.includes('call') || query.includes('contact') || query.includes('phone') || query.includes('whatsapp') || query.includes('planner') || query.includes('sajjad')) {
    return {
      reply: `Our Senior Pakistani Wedding Concierge team is on standby to assist you:\n\n` +
        `👤 **Direct Contact:** Sajjad Wazir (WedPlan Concierge Lead)\n` +
        `📱 **WhatsApp & Phone:** 0306-9122770 (+92 306 9122770)\n` +
        `✉️ **Email:** sajjadwazir4459@email.com\n` +
        `🏢 **Head Office:** Gulberg III, Lahore, Pakistan\n\n` +
        `You can message Sajjad Wazir directly on WhatsApp for custom 3-day quotes, booking guarantees, and venue visits.`,
      suggestions: [
        'Chat on WhatsApp',
        'Go to Contact Us',
        'Browse All Services'
      ],
      actionLink: '/contact'
    };
  }

  // 8. Default Greeting / Help Menu
  return {
    reply: `Assalam-o-Alaikum! 🌸 Welcome to **WedPlan — Pakistan Wedding Concierge**.\n\n` +
      `How can I assist you with your wedding preparations today? You can ask me about:\n\n` +
      `• 🏛️ **Venues & Marriage Halls** (Lahore, Karachi, Islamabad & more)\n` +
      `• 🚗 **Luxury Bridal Cars** (Mercedes S-Class, Prado, Vintage Rolls Royce)\n` +
      `• 🍽️ **Catering & Menus** (Mutton Biryani, Live BBQ, per-head rates)\n` +
      `• 🎁 **Curated Packages** (Complete 3-Day Mehndi, Baraat & Walima combos)\n` +
      `• 💰 **Wedding Budget Estimator** (Instant breakdown by guest count)`,
    suggestions: [
      'Estimate Budget for 400 Guests',
      'Best Venues in Lahore',
      'View All-Inclusive Packages',
      'Bridal Mercedes S-Class Rates'
    ],
    actionLink: '/services'
  };
};

/**
 * @route   POST /api/v1/chat/message
 * @desc    Process real-time chat message with WedPlan Concierge
 * @access  Public
 */
export const handleChatMessage = asyncHandler(async (req, res) => {
  const { message, context } = req.body;

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    throw ApiError.badRequest('Please provide a non-empty message');
  }

  const responseData = generateWeddingResponse(message, context);

  return ApiResponse.ok(
    res,
    {
      reply: responseData.reply,
      suggestions: responseData.suggestions || [],
      actionLink: responseData.actionLink || null,
      timestamp: new Date().toISOString()
    },
    'Concierge response generated'
  );
});

/**
 * @route   GET /api/v1/chat/quick-prompts
 * @desc    Get quick starter conversation chips
 * @access  Public
 */
export const getQuickPrompts = asyncHandler(async (req, res) => {
  return ApiResponse.ok(res, {
    prompts: [
      { label: '💰 Budget for 400 Guests', text: 'What is the estimated budget for 400 guests?' },
      { label: '🏛️ Best Venues in Lahore', text: 'Show me the top wedding venues in Lahore' },
      { label: '🎁 3-Day Wedding Combos', text: 'What multi-day wedding packages are available?' },
      { label: '🚗 Bridal Car with Driver', text: 'How much does a bridal Mercedes S-Class cost?' },
      { label: '🍽️ Royal Catering Menu', text: 'What is included in the Shahi Dastarkhwan catering menu?' }
    ]
  });
});
