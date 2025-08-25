import express from 'express';
import mongoose from 'mongoose';

const app = express();
app.use(express.json());

// Basic CORS setup
app.use((_, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

mongoose.connect(process.env.MONGODB_URI ?? 'mongodb://localhost:27017/mytrip');

const userSchema = new mongoose.Schema({
  name: String,
  role: String,
}, { timestamps: true });

const tripSchema = new mongoose.Schema({
  name: String,
  startDate: String,
  endDate: String,
  organizerId: mongoose.Schema.Types.ObjectId,
  travelerIds: [mongoose.Schema.Types.ObjectId],
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
const Trip = mongoose.model('Trip', tripSchema);

app.get('/api/users', async (_req, res) => {
  const users = await User.find();
  res.json(users);
});

app.post('/api/users', async (req, res) => {
  const user = new User(req.body);
  await user.save();
  res.status(201).json(user);
});

app.get('/api/trips', async (_req, res) => {
  const trips = await Trip.find();
  res.json(trips);
});

app.post('/api/trips', async (req, res) => {
  const trip = new Trip(req.body);
  await trip.save();
  res.status(201).json(trip);
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

