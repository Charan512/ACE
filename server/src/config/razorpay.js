import Razorpay from 'razorpay';

/**
 * Singleton Razorpay SDK instance.
 * Reads credentials exclusively from environment variables — never hardcoded.
 *
 * key_id  → public identifier, used on the frontend checkout widget too (via VITE_RAZORPAY_KEY_ID)
 * key_secret → server-side only, used for order creation and webhook HMAC verification
 */
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export default razorpay;
