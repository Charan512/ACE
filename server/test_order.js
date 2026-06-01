import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import User from './src/models/User.js';

await mongoose.connect('mongodb://127.0.0.1:27017/ace_erp');
const user = await User.findOne({ email: 'member@ace.org' });
const token = jwt.sign({ id: user._id }, 'super_secret_development_key_do_not_use_in_prod', { expiresIn: '1d' });

const res = await fetch('http://127.0.0.1:5001/api/payments/order', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({ eventId: '665b12345678901234567890' }) // fake event id
});

const body = await res.text();
console.log("Status:", res.status);
console.log("Response:", body);
process.exit(0);
