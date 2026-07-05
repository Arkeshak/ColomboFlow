import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_KEY || 'sk_test_mock';
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16' as any,
});

export const createPaymentIntent = async (amountLKR: number, bookingId: string) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountLKR * 100, // Stripe expects amounts in smallest currency unit (cents/cents equivalent)
      currency: 'lkr',
      metadata: {
        bookingId
      }
    });
    return paymentIntent;
  } catch (error) {
    console.error('Stripe PaymentIntent creation failed:', error);
    throw new Error('Failed to initialize payment');
  }
};

export default stripe;
