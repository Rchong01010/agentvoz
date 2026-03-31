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

  // Origin validation
  const rawOrigin = req.headers.origin || '';
  const origin = ALLOWED_ORIGINS.includes(rawOrigin) ? rawOrigin : DEFAULT_ORIGIN;
  const baseUrl = origin.replace(/\/$/, '');

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/learn?level=beginner&theme=free&dialect=mexico&speed=1&subscribed=true`,
      cancel_url: `${baseUrl}/?canceled=true`,
      allow_promotion_codes: true,
    });

    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return res.status(500).json({ error: 'Failed to create checkout session' });
  }
}
