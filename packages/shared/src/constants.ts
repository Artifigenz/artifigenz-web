import type { Agent, Founder } from './types';

export const AGENTS: Agent[] = [
  // ── Active ──
  {
    name: 'Finance',
    pitch: 'Finds money you didn\'t know you were losing.',
    skills: ['Budget tracking', 'Subscription audit', 'Savings goals', 'Expense categorization', 'Bill reminders'],
    active: true,
    insights: [
      'You spent 22% more on dining out this month compared to last.',
      '3 subscriptions haven\'t been used in 60+ days.',
      'Your savings rate improved to 18% this quarter.',
    ],
    lastActive: '2 min ago',
  },
  {
    name: 'Travel',
    pitch: 'Plans trips you\'d never have time to research.',
    skills: ['Flight deals', 'Itinerary builder', 'Hotel comparison', 'Visa requirements', 'Local recommendations'],
    active: true,
    insights: [
      'Flights to Tokyo dropped 34% for April 12–19.',
      'Your usual hotel in Bali just opened March availability.',
      'Passport expires in 4 months — some countries require 6.',
    ],
    lastActive: '18 min ago',
  },
  {
    name: 'Health',
    pitch: 'Notices patterns in your habits before you do.',
    skills: ['Sleep analysis', 'Fitness tracking', 'Habit streaks', 'Nutrition logging', 'Mood tracking'],
    active: true,
    insights: [
      'Sleep dropped below 6h three nights this week.',
      'Your step count is up 12% since last month.',
      'You\'ve hit your water intake goal 5 days in a row.',
    ],
    lastActive: '1 hr ago',
  },
  {
    name: 'Research',
    pitch: 'Goes deep so you get the short version.',
    skills: ['Topic deep-dives', 'Competitor analysis', 'Summarization', 'Source verification', 'Trend spotting'],
    active: true,
    insights: [
      'Competitive analysis on 5 players in your space is ready.',
      'Found 3 new papers on the topic you flagged last week.',
      'Market trend report for Q1 2026 has been summarized.',
    ],
    lastActive: '3 hr ago',
  },

  // ── Explore ──
  {
    name: 'Learning',
    pitch: 'Turns your curiosity into structured progress.',
    skills: ['Course discovery', 'Study plans', 'Skill mapping', 'Quiz generation', 'Progress tracking'],
    active: false,
  },
  {
    name: 'Shopping',
    pitch: 'Hunts the best deals so you never overpay.',
    skills: ['Price tracking', 'Deal alerts', 'Wishlist manager', 'Coupon finder', 'Price history'],
    active: false,
  },
  {
    name: 'Content',
    pitch: 'Writes and schedules while you focus on ideas.',
    skills: ['Drafting', 'Post scheduling', 'Platform management', 'Hashtag strategy', 'Content calendar'],
    active: false,
  },
  {
    name: 'Time',
    pitch: 'Guards your calendar like it\'s sacred.',
    skills: ['Focus blocks', 'Priority sorting', 'Meeting prep', 'Deadline tracking', 'Time audits'],
    active: false,
  },
  {
    name: 'Legal',
    pitch: 'Reads the fine print you always skip.',
    skills: ['Contract review', 'Terms analysis', 'Compliance checks', 'IP guidance', 'Policy summaries'],
    active: false,
  },
  {
    name: 'Career',
    pitch: 'Keeps your professional trajectory on course.',
    skills: ['Resume tuning', 'Interview prep', 'Salary research', 'Skill gap analysis', 'LinkedIn optimization'],
    active: false,
  },
  {
    name: 'Real Estate',
    pitch: 'Scans the market while you sleep.',
    skills: ['Property matching', 'Market analysis', 'Mortgage comparison', 'Neighborhood reports', 'Investment scoring'],
    active: false,
  },
  {
    name: 'Parenting',
    pitch: 'A second brain for the hardest job.',
    skills: ['Activity ideas', 'Milestone tracking', 'School research', 'Meal planning', 'Schedule coordination'],
    active: false,
  },
  {
    name: 'Fitness',
    pitch: 'Builds the plan. Tracks the reps. No excuses.',
    skills: ['Workout generation', 'Progressive overload', 'Recovery tracking', 'Form guidance', 'Goal setting'],
    active: false,
  },
  {
    name: 'Nutrition',
    pitch: 'Knows what your body needs before you do.',
    skills: ['Meal planning', 'Calorie tracking', 'Grocery lists', 'Dietary restrictions', 'Recipe suggestions'],
    active: false,
  },
  {
    name: 'Events',
    pitch: 'Plans the party. You just show up.',
    skills: ['Venue search', 'Guest management', 'Budget tracking', 'Vendor coordination', 'Timeline planning'],
    active: false,
  },
  {
    name: 'Tax',
    pitch: 'Finds deductions you didn\'t know existed.',
    skills: ['Deduction finder', 'Receipt tracking', 'Filing reminders', 'Quarterly estimates', 'Audit prep'],
    active: false,
  },
  {
    name: 'News',
    pitch: 'Filters the noise. Delivers what matters.',
    skills: ['Topic curation', 'Bias detection', 'Daily briefings', 'Source ranking', 'Trend alerts'],
    active: false,
  },
  {
    name: 'Relationships',
    pitch: 'Remembers birthdays so you never forget.',
    skills: ['Date reminders', 'Gift suggestions', 'Check-in prompts', 'Contact notes', 'Occasion planning'],
    active: false,
  },
  {
    name: 'Home',
    pitch: 'Keeps your space running without the mental load.',
    skills: ['Maintenance schedules', 'Contractor search', 'Energy optimization', 'Inventory tracking', 'Warranty management'],
    active: false,
  },
  {
    name: 'Investments',
    pitch: 'Watches the markets so you don\'t have to.',
    skills: ['Portfolio tracking', 'Risk analysis', 'Dividend tracking', 'Market alerts', 'Rebalancing signals'],
    active: false,
  },
];

export const FOUNDERS: readonly Founder[] = [
  { name: 'Cooper', url: 'https://x.com/CooperAIWorks' },
  { name: 'Rajan RK', url: 'https://x.com/rajanbuilds' },
];

export const SOCIAL = {
  x: {
    url: 'https://x.com/FigenzAI',
    handle: '@FigenzAI',
  },
} as const;
