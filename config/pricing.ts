// Fitness Training Services Pricing Configuration

export interface ServicePackage {
  id: string;
  name: string;
  type: 'personal' | 'buddy' | 'group' | 'online';
  sessions: number | 'unlimited';
  duration: number; // minutes per session
  price: number; // total price
  validity: number; // validity in months
  isPopular?: boolean;
  description: string;
  features: string[];
}

export const FITNESS_TRAINING_SERVICES: ServicePackage[] = [
  // 1-to-1 Personal Training
  {
    id: 'personal-adhoc',
    name: 'Ad-hoc Session',
    type: 'personal',
    sessions: 1,
    duration: 60,
    price: 180,
    validity: 1,
    description: '1-to-1 Personal Training (1 hour per session)',
    features: ['Personalized workout plan', 'One-on-one attention', 'Flexible scheduling']
  },
  {
    id: 'personal-10',
    name: '10 Sessions Package',
    type: 'personal',
    sessions: 10,
    duration: 60,
    price: 1500,
    validity: 3,
    description: '1-to-1 Personal Training (1 hour per session)',
    features: ['Personalized workout plan', 'One-on-one attention', '3 months validity', 'Progress tracking']
  },
  {
    id: 'personal-24',
    name: '24 Sessions Package',
    type: 'personal',
    sessions: 24,
    duration: 60,
    price: 3350,
    validity: 6,
    description: '1-to-1 Personal Training (1 hour per session)',
    features: ['Personalized workout plan', 'One-on-one attention', '6 months validity', 'Progress tracking', 'Nutrition guidance']
  },
  {
    id: 'personal-36',
    name: '36 Sessions Package',
    type: 'personal',
    sessions: 36,
    duration: 60,
    price: 4500,
    validity: 8,
    description: '1-to-1 Personal Training (1 hour per session)',
    features: ['Personalized workout plan', 'One-on-one attention', '8 months validity', 'Progress tracking', 'Nutrition guidance', 'Monthly assessments']
  },
  
  // Buddy Personal Training
  {
    id: 'buddy-10',
    name: '10 Sessions Package',
    type: 'buddy',
    sessions: 10,
    duration: 60,
    price: 1500,
    validity: 3,
    isPopular: true,
    description: 'Buddy Personal Training (Train in pairs, 1 hour per session)',
    features: ['Train with a friend', 'Shared motivation', '3 months validity', 'Cost-effective']
  },
  {
    id: 'buddy-24',
    name: '24 Sessions Package',
    type: 'buddy',
    sessions: 24,
    duration: 60,
    price: 3500,
    validity: 6,
    description: 'Buddy Personal Training (Train in pairs, 1 hour per session)',
    features: ['Train with a friend', 'Shared motivation', '6 months validity', 'Progress tracking']
  },
  
  // Group Strength Training
  {
    id: 'gst-8week',
    name: '8-Week Programme',
    type: 'group',
    sessions: 24,
    duration: 40,
    price: 999,
    validity: 2,
    description: 'Group Strength Training (Gain strength in small group environment, 40mins per session)',
    features: ['24 sessions across 8 weeks', 'Small group environment', 'Strength focused', 'Community support']
  },
  {
    id: 'gst-8sessions',
    name: '8 Sessions Package',
    type: 'group',
    sessions: 8,
    duration: 40,
    price: 299,
    validity: 1,
    description: 'Group Strength Training (Gain strength in small group environment, 40mins per session)',
    features: ['Flexible scheduling', 'Small group environment', 'Strength focused', '1 month validity']
  },
  
  // Online Personal Training
  {
    id: 'online-elite',
    name: 'Elite Plan',
    type: 'online',
    sessions: 'unlimited',
    duration: 60,
    price: 199,
    validity: 1,
    description: 'Online Personal Training',
    features: ['Unlimited sessions', 'Virtual training', 'Custom workout plans', 'Nutrition guidance', '24/7 support']
  }
];

export const SERVICE_TYPES = {
  personal: '1-to-1 Personal Training',
  buddy: 'Buddy Personal Training', 
  group: 'Group Strength Training (GST)',
  online: 'Online Personal Training'
};

export const getServicesByType = (type: 'personal' | 'buddy' | 'group' | 'online') => {
  return FITNESS_TRAINING_SERVICES.filter(service => service.type === type);
};

export const getServiceById = (id: string) => {
  return FITNESS_TRAINING_SERVICES.find(service => service.id === id);
};

export const calculatePricePerSession = (service: ServicePackage) => {
  if (typeof service.sessions === 'number') {
    return service.price / service.sessions;
  }
  return service.price; // For unlimited plans, return monthly price
};
