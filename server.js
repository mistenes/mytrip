import express from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
// Using Brevo's REST API directly so no external SDK is required

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

const personalDataSchema = new mongoose.Schema({
  field: String,
  value: String,
  locked: { type: Boolean, default: false }
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: String,
  role: String,
  personalData: [personalDataSchema],
  passportPhoto: String,
}, { timestamps: true });

const fieldConfigSchema = new mongoose.Schema({
  field: String,
  tripId: Number,
  label: String,
  type: { type: String, enum: ['text', 'date', 'file'], default: 'text' },
  enabled: { type: Boolean, default: true },
  locked: { type: Boolean, default: false }
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
const FieldConfig = mongoose.model('FieldConfig', fieldConfigSchema);
const invitationSchema = new mongoose.Schema({
  email: String,
  role: String,
  tripId: mongoose.Schema.Types.ObjectId,
  token: String,
  expiresAt: Date,
  used: { type: Boolean, default: false }
}, { timestamps: true });
const Invitation = mongoose.model('Invitation', invitationSchema);

async function sendInvitationEmail(email, signupUrl) {
  if (!process.env.BREVO_API_KEY) return;
  try {
    await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY
      },
      body: JSON.stringify({
        to: [{ email }],
        subject: 'Invitation to MyTrip',
        htmlContent: `<p>You have been invited to join a trip. Sign up here: <a href="${signupUrl}">${signupUrl}</a></p>`
      })
    });
  } catch (err) {
    console.error('Email send failed', err);
  }
}

const upload = multer({ dest: 'uploads/' });
app.use('/uploads', express.static('uploads'));
app.use(express.static(__dirname, { index: false }));

app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/health', (_req, res) => {
  res.type('text/plain').send('mytrip server: OK');
});

app.post('/api/invitations', async (req, res) => {
  const { email, role, tripId } = req.body;
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await Invitation.create({ email, role, tripId, token, expiresAt });
  const signupUrl = `${process.env.APP_URL || 'http://localhost:5173'}/signup?token=${token}`;
  await sendInvitationEmail(email, signupUrl);
  res.status(201).json({ message: 'Invitation sent' });
});

app.get('/api/invitations/:token', async (req, res) => {
  const invitation = await Invitation.findOne({
    token: req.params.token,
    used: false,
    expiresAt: { $gt: new Date() }
  });
  if (!invitation) return res.sendStatus(404);
  res.json({ email: invitation.email, role: invitation.role, tripId: invitation.tripId });
});

app.post('/api/register/:token', async (req, res) => {
  const invitation = await Invitation.findOne({
    token: req.params.token,
    used: false,
    expiresAt: { $gt: new Date() }
  });
  if (!invitation) {
    return res.status(400).json({ message: 'Invalid or expired invitation' });
  }
  const user = new User({ name: req.body.name, role: invitation.role });
  await user.save();
  if (invitation.tripId) {
    if (invitation.role === 'organizer') {
      await Trip.findByIdAndUpdate(invitation.tripId, { organizerId: user._id });
    } else if (invitation.role === 'traveler') {
      await Trip.findByIdAndUpdate(invitation.tripId, { $push: { travelerIds: user._id } });
    }
  }
  invitation.used = true;
  await invitation.save();
  res.status(201).json(user);
});

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

app.get('/api/field-config', async (_req, res) => {
  const configs = await FieldConfig.find();
  res.json(configs);
});

app.put('/api/field-config/:field', async (req, res) => {
  const { label, type, enabled, locked, tripId } = req.body;
  const config = await FieldConfig.findOneAndUpdate(
    { field: req.params.field, tripId },
    { field: req.params.field, label, type, enabled, locked, tripId },
    { new: true, upsert: true }
  );
  res.json(config);
});

app.put('/api/users/:id/personal-data', async (req, res) => {
  const { field, value } = req.body;
  const config = await FieldConfig.findOne({ field });
  if (!config || !config.enabled || config.locked) {
    return res.status(403).json({ message: 'Field disabled or locked' });
  }
  const user = await User.findById(req.params.id);
  if (!user) return res.sendStatus(404);
  const entry = user.personalData.find(e => e.field === field);
  if (entry) {
    if (entry.locked) {
      return res.status(403).json({ message: 'Field locked' });
    }
    entry.value = value;
  } else {
    user.personalData.push({ field, value });
  }
  await user.save();
  res.json(user);
});

app.put('/api/users/:id/personal-data/:field/lock', async (req, res) => {
  const { locked } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) return res.sendStatus(404);
  const entry = user.personalData.find(e => e.field === req.params.field);
  if (!entry) return res.sendStatus(404);
  entry.locked = locked;
  await user.save();
  res.json(user);
});

app.post('/api/users/:id/passport-photo', upload.single('photo'), async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user || !req.file) return res.sendStatus(400);
  user.passportPhoto = req.file.path;
  await user.save();
  res.json({ path: req.file.path });
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

