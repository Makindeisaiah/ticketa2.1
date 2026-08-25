export interface SeedEventData {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: 'Concert' | 'Tech & Startups' | 'Comedy' | 'Festivals';
  category_slug: string;
  category_icon: string;
  banner_image_url: string;
  start_time: string;
  end_time: string;
  is_featured: boolean;
  is_trending: boolean;
  is_online: boolean;
  online_meeting_url?: string;
  venue_name: string;
  venue_address: string;
  venue_city: string;
  venue_country: string;
  organizer_name: string;
  organizer_logo: string;
  organizer_description: string;
  organizer_verified: boolean;
  is_sold_out?: boolean;
  total_capacity?: number;
  total_sold?: number;
  total_available?: number;
  ticket_types: {
    id?: string;
    name: string;
    description: string;
    price: number;
    currency: string;
    quantity_available: number;
    quantity_sold: number;
    is_sold_out?: boolean;
  }[];
}

export const INITIAL_SEED_EVENTS: SeedEventData[] = [
  {
    id: 'evt-davido-5ive-alive',
    title: 'Davido 5ive Alive Tour',
    slug: 'davido-5ive-alive-tour',
    description: 'Davido is one of Africa\'s most influential and globally celebrated music artists, known for his energetic performances and chart-topping Afrobeats sound. With multiple international hits and sold-out shows across Africa, Europe, and North America, Davido has built a reputation for delivering unforgettable live experiences. His music blends rich African rhythms with contemporary pop and global sounds, connecting audiences across cultures.\n\n• Door open at 7:00 PM\n• All ages welcome\n• Dress code: Stylish\n• Venue Type: Indoor Arena\n• Accessibility: Wheelchair accessible\n• Re-entry Policy: No re-entry once admitted',
    category: 'Concert',
    category_slug: 'concert',
    category_icon: 'Music',
    banner_image_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
    start_time: '2026-04-03T20:00:00Z',
    end_time: '2026-04-03T23:30:00Z',
    is_featured: true,
    is_trending: true,
    is_online: false,
    venue_name: 'Palau Olímpic de Badalona',
    venue_address: 'Carrer de Ponent, 143-161, 08912 Badalona, Spain',
    venue_city: 'Lagos, Nigeria',
    venue_country: 'Spain / Nigeria',
    organizer_name: 'Flytimefest',
    organizer_logo: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&w=120&h=120&q=80',
    organizer_description: 'Flytimefest is a leading African event and entertainment company with over a decade of experience producing world-class live concerts and festivals. Established in 2013, Flytimefest has worked with some of Africa\'s biggest pursuit artists.',
    organizer_verified: true,
    ticket_types: [
      { name: 'Regular', description: 'General Admission Floor Entry', price: 30000, currency: 'NGN', quantity_available: 5000, quantity_sold: 1420 },
      { name: 'VIP', description: 'Priority Access + Front Tier Standing', price: 100000, currency: 'NGN', quantity_available: 1000, quantity_sold: 340 },
      { name: 'VVIP', description: 'VVIP Table Access + Complimentary Drinks', price: 500000, currency: 'NGN', quantity_available: 200, quantity_sold: 85 },
      { name: 'Premium', description: 'Backstage Lounge + Exclusive Meet & Greet', price: 3500000, currency: 'NGN', quantity_available: 20, quantity_sold: 8 }
    ]
  },
  {
    id: 'evt-1300saint-the-saviour',
    title: '1300Saint The Saviour Tour',
    slug: '1300saint-the-saviour-tour',
    description: 'Experience an electrifying night of live alternative rock and alt-hip-hop fusion as 1300Saint takes the main stage for The Saviour Tour. Featuring intense lighting visuals and unreleased tracks.',
    category: 'Concert',
    category_slug: 'concert',
    category_icon: 'Music',
    banner_image_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80',
    start_time: '2026-04-04T20:00:00Z',
    end_time: '2026-04-04T23:00:00Z',
    is_featured: true,
    is_trending: true,
    is_online: false,
    venue_name: 'Union Stage',
    venue_address: '740 Water St SW, Washington, DC 20024',
    venue_city: 'Washington, DC',
    venue_country: 'USA',
    organizer_name: 'LiveNation Global',
    organizer_logo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80',
    organizer_description: 'Global live music organizer specializing in concert tours and arena festivals.',
    organizer_verified: true,
    ticket_types: [
      { name: 'Regular', description: 'General Standing Admission', price: 30000, currency: 'NGN', quantity_available: 1200, quantity_sold: 400 },
      { name: 'VIP Pass', description: 'VIP Mezzanine Access', price: 75000, currency: 'NGN', quantity_available: 300, quantity_sold: 110 }
    ]
  },
  {
    id: 'evt-hardy-country-tour',
    title: 'Hardy The Country Tour',
    slug: 'hardy-the-country-tour',
    description: 'Country rock powerhouse Hardy hits the road for the nationwide Country Tour! High energy performance, acoustic breakdowns, and guest songwriter appearances.',
    category: 'Festivals',
    category_slug: 'festivals',
    category_icon: 'Flame',
    banner_image_url: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80',
    start_time: '2026-02-13T20:00:00Z',
    end_time: '2026-02-13T23:00:00Z',
    is_featured: true,
    is_trending: true,
    is_online: false,
    venue_name: 'Golden Arena',
    venue_address: '102 Arena Way, Edmonton, AB',
    venue_city: 'Edmonton, AB',
    venue_country: 'Canada',
    organizer_name: 'CountryFest Live',
    organizer_logo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80',
    organizer_description: 'Premier country music events production house across North America.',
    organizer_verified: true,
    ticket_types: [
      { name: 'Standard Pass', description: 'General seating', price: 30000, currency: 'NGN', quantity_available: 2000, quantity_sold: 850 },
      { name: 'Golden Ring VIP', description: 'Front rows seating', price: 120000, currency: 'NGN', quantity_available: 250, quantity_sold: 190 }
    ]
  },
  {
    id: 'evt-maine-nightly-grayscale',
    title: 'The Maine Nightly & Grayscale',
    slug: 'the-maine-nightly-grayscale',
    description: 'Three legendary pop-punk and indie rock bands take over Chicago for one single unforgettable spring evening. Don\'t miss out!',
    category: 'Concert',
    category_slug: 'concert',
    category_icon: 'Music',
    banner_image_url: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=1200&q=80',
    start_time: '2026-04-10T18:30:00Z',
    end_time: '2026-04-10T22:30:00Z',
    is_featured: true,
    is_trending: true,
    is_online: false,
    venue_name: 'The Salt Shed Indoors',
    venue_address: '1357 N Elston Ave, Chicago, IL',
    venue_city: 'Chicago, IL',
    venue_country: 'USA',
    organizer_name: 'IndieNation Events',
    organizer_logo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&h=120&q=80',
    organizer_description: 'Indie and pop rock tour promotions.',
    organizer_verified: true,
    ticket_types: [
      { name: 'GA Ticket', description: 'General floor admission', price: 30000, currency: 'NGN', quantity_available: 1500, quantity_sold: 900 }
    ]
  },
  {
    id: 'evt-c5-carnival',
    title: 'C5 Carnival 2026',
    slug: 'c5-carnival-2026',
    description: 'The biggest annual university & youth cultural carnival featuring campus battles, food trucks, DJ showcases, and celebrity guest acts.',
    category: 'Festivals',
    category_slug: 'festivals',
    category_icon: 'Flame',
    banner_image_url: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=1200&q=80',
    start_time: '2026-02-20T19:00:00Z',
    end_time: '2026-02-21T02:00:00Z',
    is_featured: false,
    is_trending: true,
    is_online: false,
    venue_name: 'Fletcher Hall',
    venue_address: '100 University Ave, Durham, NC',
    venue_city: 'Durham, NC',
    venue_country: 'USA',
    organizer_name: 'C5 Fest Crew',
    organizer_logo: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=120&h=120&q=80',
    organizer_description: 'Youth festival & lifestyle brand organizing campus carnivals.',
    organizer_verified: true,
    ticket_types: [
      { name: 'Carnival Pass', description: 'Full day access pass', price: 30000, currency: 'NGN', quantity_available: 3000, quantity_sold: 1100 }
    ]
  },
  {
    id: 'evt-asake-mr-money-la',
    title: 'Mr Money Live in Los Angeles',
    slug: 'mr-money-live-in-los-angeles',
    description: 'Afrobeats superstar Asake brings the energetic Mr Money Live show to Los Angeles! High octane beats, traditional choir harmonies, and nonstop dancing.',
    category: 'Concert',
    category_slug: 'concert',
    category_icon: 'Music',
    banner_image_url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=80',
    start_time: '2026-04-18T19:00:00Z',
    end_time: '2026-04-18T23:00:00Z',
    is_featured: true,
    is_trending: true,
    is_online: false,
    venue_name: 'Zenith Arena',
    venue_address: 'Paris Arena Boulevard, Paris, France / Los Angeles',
    venue_city: 'Los Angeles / Paris',
    venue_country: 'USA',
    organizer_name: 'YBNL & Empire',
    organizer_logo: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=120&h=120&q=80',
    organizer_description: 'Global Afrobeats distribution and concert management.',
    organizer_verified: true,
    ticket_types: [
      { name: 'Regular', description: 'General Floor Access', price: 30000, currency: 'NGN', quantity_available: 4000, quantity_sold: 2200 },
      { name: 'VIP Fast Pass', description: 'Front row arena standing', price: 85000, currency: 'NGN', quantity_available: 500, quantity_sold: 410 }
    ]
  },
  {
    id: 'evt-burna-boy-nsow',
    title: 'Burna Boy NSOW Tour',
    slug: 'burna-boy-nsow-tour',
    description: 'Grammy award winner Burna Boy live in concert! Experience the African Giant performing hits from No Signs Of Weakness tour with a full live band.',
    category: 'Concert',
    category_slug: 'concert',
    category_icon: 'Music',
    banner_image_url: 'https://images.unsplash.com/photo-1429962714451-bb934ecdc436?auto=format&fit=crop&w=1200&q=80',
    start_time: '2026-01-23T19:00:00Z',
    end_time: '2026-01-23T23:30:00Z',
    is_featured: true,
    is_trending: true,
    is_online: false,
    venue_name: 'ING Arena',
    venue_address: 'Place de Belgique 1, 1020 Brussels, Belgium',
    venue_city: 'Brussels',
    venue_country: 'Belgium',
    organizer_name: 'Spaceship Entertainment',
    organizer_logo: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&h=120&q=80',
    organizer_description: 'Official management for Burna Boy world tours.',
    organizer_verified: true,
    ticket_types: [
      { name: 'Standard Pass', description: 'General stadium seat', price: 30000, currency: 'NGN', quantity_available: 10000, quantity_sold: 7200 },
      { name: 'VIP Circle', description: 'Golden Circle directly in front of stage', price: 150000, currency: 'NGN', quantity_available: 1200, quantity_sold: 1100 }
    ]
  },
  {
    id: 'evt-travis-scott-circus',
    title: 'Travis Scott Circus Maximus',
    slug: 'travis-scott-circus-maximus',
    description: 'The monumental Circus Maximus stadium tour lands in Johannesburg! Unmatched stage production, immersive audio visual pyramids, and chaotic rage energy.',
    category: 'Concert',
    category_slug: 'concert',
    category_icon: 'Music',
    banner_image_url: 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?auto=format&fit=crop&w=1200&q=80',
    start_time: '2026-10-11T19:00:00Z',
    end_time: '2026-10-11T23:00:00Z',
    is_featured: true,
    is_trending: true,
    is_online: false,
    venue_name: 'FNB Stadium',
    venue_address: 'Soccer City Ave, Nasrec, Johannesburg, SA',
    venue_city: 'Johannesburg, SA',
    venue_country: 'South Africa',
    organizer_name: 'Cactus Jack Live',
    organizer_logo: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=120&h=120&q=80',
    organizer_description: 'Cactus Jack global touring arm.',
    organizer_verified: true,
    ticket_types: [
      { name: 'General Admission', description: 'Pitch floor standing', price: 30000, currency: 'NGN', quantity_available: 20000, quantity_sold: 18500 }
    ]
  },
  {
    id: 'evt-ay-comedian-laugh-jam',
    title: 'AY Comedian Laugh Jam',
    slug: 'ay-comedian-laugh-jam',
    description: 'Nigeria\'s comedy king AY presents a night of gut-busting stand-up comedy, surprise celebrity skits, and musical interludes.',
    category: 'Comedy',
    category_slug: 'comedy',
    category_icon: 'Smile',
    banner_image_url: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?auto=format&fit=crop&w=1200&q=80',
    start_time: '2026-12-12T19:00:00Z',
    end_time: '2026-12-12T22:30:00Z',
    is_featured: false,
    is_trending: true,
    is_online: false,
    venue_name: 'Wosam Arena',
    venue_address: 'Ago Iwoye Road, Ogun State, Nigeria',
    venue_city: 'Ago Iwoye, Ogun',
    venue_country: 'Nigeria',
    organizer_name: 'Corporate World Entertainment',
    organizer_logo: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=120&h=120&q=80',
    organizer_description: 'AY Comedian\'s corporate entertainment & show agency.',
    organizer_verified: true,
    ticket_types: [
      { name: 'Regular', description: 'Standard seating', price: 30000, currency: 'NGN', quantity_available: 1500, quantity_sold: 620 },
      { name: 'VIP Table', description: 'Front tier table seating', price: 100000, currency: 'NGN', quantity_available: 100, quantity_sold: 42 }
    ]
  },
  {
    id: 'evt-ay-live-uk-tour',
    title: 'AY LIVE UK Tour',
    slug: 'ay-live-uk-tour',
    description: 'AY Live returns to the United Kingdom for a mega comedy show starring top African comedians and UK guest artists.',
    category: 'Comedy',
    category_slug: 'comedy',
    category_icon: 'Smile',
    banner_image_url: 'https://images.unsplash.com/photo-1517263904808-5dc91e3e7044?auto=format&fit=crop&w=1200&q=80',
    start_time: '2026-11-07T19:00:00Z',
    end_time: '2026-11-07T22:30:00Z',
    is_featured: false,
    is_trending: true,
    is_online: false,
    venue_name: 'The Black Diamond',
    venue_address: 'Northampton UK Center',
    venue_city: 'Northampton, UK',
    venue_country: 'United Kingdom',
    organizer_name: 'Mollystock UK',
    organizer_logo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80',
    organizer_description: 'UK promoter for African comedy & music events.',
    organizer_verified: true,
    ticket_types: [
      { name: 'Standard Pass', description: 'Auditorium seating', price: 30000, currency: 'NGN', quantity_available: 2000, quantity_sold: 950 }
    ]
  },
  {
    id: 'evt-kenny-blaq-reckless',
    title: 'Kenny Blaq Reckless MCF',
    slug: 'kenny-blaq-reckless-mcf',
    description: 'Music-comedy maestro Kenny Blaq delivers a high-strung show blending hilarious musical parodies, opera comedy, and hilarious stories.',
    category: 'Comedy',
    category_slug: 'comedy',
    category_icon: 'Smile',
    banner_image_url: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=1200&q=80',
    start_time: '2026-12-13T14:00:00Z',
    end_time: '2026-12-13T18:00:00Z',
    is_featured: false,
    is_trending: true,
    is_online: false,
    venue_name: 'Onikan Stadium',
    venue_address: 'Lagos Island, Lagos State, Nigeria',
    venue_city: 'Lagos Island, Lagos',
    venue_country: 'Nigeria',
    organizer_name: 'Unusual Music Ltd',
    organizer_logo: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&h=120&q=80',
    organizer_description: 'Kenny Blaq official production crew.',
    organizer_verified: true,
    ticket_types: [
      { name: 'Regular', description: 'Standard seat', price: 30000, currency: 'NGN', quantity_available: 3000, quantity_sold: 1400 }
    ]
  },
  {
    id: 'evt-bovi-african-comedy',
    title: 'Bovi African Comedy Night',
    slug: 'bovi-african-comedy-night',
    description: 'An intimate night of storytelling, satirical humor, and sharp African social commentary from the maestro Bovi Ugboma.',
    category: 'Comedy',
    category_slug: 'comedy',
    category_icon: 'Smile',
    banner_image_url: 'https://images.unsplash.com/photo-1527269534026-c86f4009eace?auto=format&fit=crop&w=1200&q=80',
    start_time: '2026-11-29T18:00:00Z',
    end_time: '2026-11-29T21:30:00Z',
    is_featured: false,
    is_trending: true,
    is_online: false,
    venue_name: 'Alliance Française, Mike Adenuga Centre',
    venue_address: '9 Osborne Rd, Ikoyi, Lagos, Nigeria',
    venue_city: 'Ikoyi, Lagos',
    venue_country: 'Nigeria',
    organizer_name: 'Kountry Kulture Entertainment',
    organizer_logo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80',
    organizer_description: 'Bovi\'s official media & live tour house.',
    organizer_verified: true,
    ticket_types: [
      { name: 'Regular', description: 'Main hall ticket', price: 30000, currency: 'NGN', quantity_available: 500, quantity_sold: 380 },
      { name: 'VIP Pass', description: 'Front rows + cocktail bar access', price: 80000, currency: 'NGN', quantity_available: 100, quantity_sold: 95 }
    ]
  },
  {
    id: 'evt-igbesa-design-meetup',
    title: 'Igbesa Design Meetup',
    slug: 'igbesa-design-meetup',
    description: 'A community gathering of UI/UX designers, product thinkers, and visual storytellers discussing modern UI trends and design system architectures.',
    category: 'Tech & Startups',
    category_slug: 'tech-startups',
    category_icon: 'Cpu',
    banner_image_url: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=1200&q=80',
    start_time: '2026-12-06T15:00:00Z',
    end_time: '2026-12-06T18:00:00Z',
    is_featured: false,
    is_trending: false,
    is_online: false,
    venue_name: 'Crawford University Auditorium',
    venue_address: 'Igbesa, Ogun State, Nigeria',
    venue_city: 'Igbesa, Ogun',
    venue_country: 'Nigeria',
    organizer_name: 'Designers Guild Ogun',
    organizer_logo: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=120&h=120&q=80',
    organizer_description: 'Community of Ogun tech designers & creatives.',
    organizer_verified: true,
    ticket_types: [
      { name: 'Free Ticket', description: 'Community RSVP pass', price: 0, currency: 'NGN', quantity_available: 200, quantity_sold: 140 }
    ]
  },
  {
    id: 'evt-ikorodu-devops-meetup',
    title: 'Ikorodu DevOps Meetup',
    slug: 'ikorodu-devops-meetup',
    description: 'Hands-on workshop on Kubernetes, CI/CD pipelines, Docker container orchestration, and cloud security monitoring.',
    category: 'Tech & Startups',
    category_slug: 'tech-startups',
    category_icon: 'Cpu',
    banner_image_url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80',
    start_time: '2026-12-04T12:00:00Z',
    end_time: '2026-12-04T16:00:00Z',
    is_featured: false,
    is_trending: false,
    is_online: false,
    venue_name: 'Yaba Tech Hub / Yinkus Restaurant',
    venue_address: 'Ikorodu, Lagos State, Nigeria',
    venue_city: 'Ikorodu, Lagos',
    venue_country: 'Nigeria',
    organizer_name: 'DevOps Africa Circle',
    organizer_logo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&h=120&q=80',
    organizer_description: 'Pan-African cloud engineer & DevOps group.',
    organizer_verified: true,
    ticket_types: [
      { name: 'Free RSVP', description: 'General developer ticket', price: 0, currency: 'NGN', quantity_available: 150, quantity_sold: 110 }
    ]
  },
  {
    id: 'evt-tech-revolution-africa',
    title: 'Tech Revolution Africa',
    slug: 'tech-revolution-africa',
    description: 'How technology is transforming education, health, and business across the African continent. Keynote speakers, panel discussions, and virtual networking.',
    category: 'Tech & Startups',
    category_slug: 'tech-startups',
    category_icon: 'Cpu',
    banner_image_url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
    start_time: '2026-11-27T10:00:00Z',
    end_time: '2026-11-27T15:00:00Z',
    is_featured: true,
    is_trending: false,
    is_online: true,
    online_meeting_url: 'https://zoom.us/j/techrevolutionafrica2026',
    venue_name: 'Via Zoom Call (Online)',
    venue_address: 'Virtual Event',
    venue_city: 'Lagos / Online',
    venue_country: 'Online',
    organizer_name: 'TechAfrica Media',
    organizer_logo: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&w=120&h=120&q=80',
    organizer_description: 'Tech publishing & conference platform.',
    organizer_verified: true,
    ticket_types: [
      { name: 'Free Virtual Pass', description: 'Access to Zoom webinar link', price: 0, currency: 'NGN', quantity_available: 5000, quantity_sold: 2100 }
    ]
  },
  {
    id: 'evt-early-bird-land-mark',
    title: 'Tech Summit Landmark Early Bird',
    slug: 'tech-summit-landmark-early-bird',
    description: 'Get early bird tickets for the flagship Tech Summit Lagos at Landmark Event Center. Keynotes, exhibition booths, pitch competitions.',
    category: 'Tech & Startups',
    category_slug: 'tech-startups',
    category_icon: 'Cpu',
    banner_image_url: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=1200&q=80',
    start_time: '2026-01-30T19:00:00Z',
    end_time: '2026-01-30T22:00:00Z',
    is_featured: false,
    is_trending: false,
    is_online: false,
    venue_name: 'Landmark Event Center',
    venue_address: 'Water Corporation Dr, Victoria Island, Lagos',
    venue_city: 'Victoria Island, Lagos',
    venue_country: 'Nigeria',
    organizer_name: 'MTN & Tech Lagos',
    organizer_logo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80',
    organizer_description: 'Landmark tech event conveners.',
    organizer_verified: true,
    ticket_types: [
      { name: 'Early Bird', description: 'Special discounted pass', price: 10000, currency: 'NGN', quantity_available: 500, quantity_sold: 480 },
      { name: 'Standard Pass', description: 'Regular summit access', price: 40000, currency: 'NGN', quantity_available: 2000, quantity_sold: 300 },
      { name: 'VIP Pass', description: 'VIP lounge & pitch floor', price: 120000, currency: 'NGN', quantity_available: 100, quantity_sold: 45 }
    ]
  }
];
