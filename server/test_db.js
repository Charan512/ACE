import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const User = mongoose.model('User', new mongoose.Schema({ aceId: String, name: String, email: String, phone: String, gender: String, branch: String, year: Number, registrationNumber: String }, { strict: false }));
const Transaction = mongoose.model('Transaction', new mongoose.Schema({ user: mongoose.Schema.Types.ObjectId, guestEmail: String, customResponses: mongoose.Schema.Types.Mixed }, { strict: false }));

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected");
  
  const user = await User.findOne({ aceId: '26ACE0006' }).lean();
  console.log("User 26ACE0006:", user);

  if (user) {
    const txn = await Transaction.findOne({ user: user._id }).lean();
    console.log("Transaction for user:", txn);
  }

  mongoose.disconnect();
}
run();
