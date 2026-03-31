import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const ALLOWED_ORIGINS = ['https://agentvoz.vercel.app', 'https://agentvoz.com', 'http://localhost:5173'];
const DEFAULT_ORIGIN = 'https://agentvoz.com';

// Rate limiting
const rateMap = new Map();
const RATE_LIMIT = 10;
const RATE_WINDOW = 60_000;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limit
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 'unknown';
  const now = Date.now();
  const entry = rateMap.get(ip) || { count: 0, reset: now + RATE_WINDOW };
  if (now > entry.reset) { entry.count = 0; entry.reset = now + RATE_WINDOW; }
  entry.count++;
  rateMap.set(ip, entry);
  if (entry.count > RATE_LIMIT) return res.status(429).json({ error: 'Too many requests' });

  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email required' });
  }

  // Origin validation
  const rawOrigin = req.headers.origin || '';
  const origin = ALLOWED_ORIGINS.includes(rawOrigin) ? rawOrigin : DEFAULT_ORIGIN;
  const baseUrl = origin.replace(/\/$/, '');

  try {
    // Find customer by email
    const customers = await stripe.customers.list({ email, limit: 1 });
    if (customers.data.length === 0) {
      return res.status(404).json({ error: 'No subscription found for this email' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customers.data[0].id,
      return_url: `${baseUrl}/`,
    });

    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Portal error:', error);
    return res.status(500).json({ error: 'Failed to create portal session' });
  }
}
