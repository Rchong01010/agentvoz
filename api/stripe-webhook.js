import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export const config = {
  api: { bodyParser: false },
};

async function buffer(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    if (endpointSecret && sig) {
      event = stripe.webhooks.constructEvent(buf, sig, endpointSecret);
    } else {
      // Fallback: parse without signature verification (dev only)
      event = JSON.parse(buf.toString());
    }
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: 'Webhook signature verification failed' });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      console.log('New subscriber:', session.customer_email || session.customer);
      // Future: store subscription in Supabase
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object;
      console.log('Subscription updated:', subscription.id, 'Status:', subscription.status);
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      console.log('Subscription canceled:', subscription.id);
      // Future: revoke access in Supabase
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      console.log('Payment failed:', invoice.customer);
      break;
    }

    default:
      console.log('Unhandled event type:', event.type);
  }

  return res.status(200).json({ received: true });
}
