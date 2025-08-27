import express from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
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

const personalDataSchema = new mongoose.Schema({
  field: String,
  value: String,
  locked: { type: Boolean, default: false }
}, { _id: false });

const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  name: String, // convenience full name
  username: String,
  dateOfBirth: String,
  email: String,
  passwordHash: String,
  role: String,
  personalData: [personalDataSchema],
  passportPhoto: String,
  mustChangePassword: { type: Boolean, default: false },
}, { timestamps: true });

const fieldConfigSchema = new mongoose.Schema({
  field: String,
  tripId: Number,
  label: String,
  type: { type: String, enum: ['text', 'date', 'file'], default: 'text' },
  enabled: { type: Boolean, default: true },
  locked: { type: Boolean, default: false },
  order: { type: Number, default: 0 }
}, { timestamps: true });

const tripSchema = new mongoose.Schema({
  name: String,
  startDate: String,
  endDate: String,
  organizerIds: { type: [mongoose.Schema.Types.ObjectId], default: [] },
  travelerIds: { type: [mongoose.Schema.Types.ObjectId], default: [] },
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

async function ensureAdminUser() {
  const existing = await User.findOne({ username: 'admin' });
  if (existing) return;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    console.warn('ADMIN_PASSWORD not set; admin user not created');
    return;
  }
  const hash = crypto.createHash('sha256').update(adminPassword).digest('hex');
  await User.create({
    username: 'admin',
    role: 'admin',
    passwordHash: hash,
    firstName: 'Admin',
    lastName: 'User',
    name: 'Admin User',
    mustChangePassword: true,
    email: 'admin@example.com'
  });
  console.log('Seeded admin user');
}

async function ensureDefaultFieldConfigs() {
  const defaults = [
    { field: 'firstName', label: 'First Name', type: 'text', locked: true, order: 1 },
    { field: 'lastName', label: 'Last Name', type: 'text', locked: true, order: 2 },
    { field: 'dateOfBirth', label: 'Date of Birth', type: 'date', locked: true, order: 3 },
    { field: 'middleName', label: 'Middle Name', type: 'text', order: 4 },
    { field: 'passportNumber', label: 'Passport Number', type: 'text', order: 5 },
    { field: 'issueDate', label: 'Issue Date', type: 'date', order: 6 },
    { field: 'issuingCountry', label: 'Issuing Country', type: 'text', order: 7 },
    { field: 'expiryDate', label: 'Expiry Date', type: 'date', order: 8 },
    { field: 'nationality', label: 'Nationality', type: 'text', order: 9 },
    { field: 'sex', label: 'Sex', type: 'text', order: 10 },
  ];
  for (const def of defaults) {
    await FieldConfig.findOneAndUpdate(
      { field: def.field, tripId: 0 },
      { ...def, tripId: 0 },
      { upsert: true }
    );
  }
}

async function sendInvitationEmail(email, signupUrl) {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  if (!apiKey || !senderEmail) {
    console.error('Brevo email not sent: missing BREVO_API_KEY or BREVO_SENDER_EMAIL');
    return;
  }
  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey
      },
      body: JSON.stringify({
        sender: {
          email: senderEmail,
          name: process.env.BREVO_SENDER_NAME || 'myTrip'
        },
        to: [{ email }],
        subject: 'Invitation to myTrip',
        htmlContent: `<p>You have been invited to join a trip. Sign up here: <a href="${signupUrl}">${signupUrl}</a></p>`
      })
    });
    const text = await res.text();
    if (!res.ok) {
      console.error('Brevo error', res.status, text);
    } else {
      console.log('Brevo response', res.status, text);
    }
  } catch (err) {
    console.error('Email send failed', err);
  }
}

const upload = multer({ dest: 'uploads/' });
app.use('/uploads', express.static('uploads'));

const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

app.get('/health', (_req, res) => {
  res.type('text/plain').send('myTrip server: OK');
});

app.post('/api/invitations', async (req, res) => {
  const { email, role, tripId } = req.body;
  const existing = await Invitation.findOne({
    email,
    used: false,
    expiresAt: { $gt: new Date() }
  });
  if (existing) {
    return res.status(409).json({ message: 'Invitation already sent' });
  }
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const invite = await Invitation.create({ email, role, tripId, token, expiresAt });
  const signupUrl = `${process.env.APP_URL || 'http://localhost:5173'}/signup?token=${token}`;
  await sendInvitationEmail(email, signupUrl);
  res.status(201).json({ message: 'Invitation sent', id: invite._id });
});

app.get('/api/invitations', async (_req, res) => {
  const invitations = await Invitation.find({
    used: false,
    expiresAt: { $gt: new Date() }
  });
  res.json(invitations);
});

app.post('/api/invitations/:id/resend', async (req, res) => {
  const invite = await Invitation.findById(req.params.id);
  if (!invite || invite.used) return res.sendStatus(404);
  invite.token = crypto.randomBytes(32).toString('hex');
  invite.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await invite.save();
  const signupUrl = `${process.env.APP_URL || 'http://localhost:5173'}/signup?token=${invite.token}`;
  await sendInvitationEmail(invite.email, signupUrl);
  res.json({ message: 'Invitation resent' });
});

app.delete('/api/invitations/:id', async (req, res) => {
  await Invitation.findByIdAndDelete(req.params.id);
  res.sendStatus(204);
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

  const { firstName, lastName, username, dateOfBirth, password, verifyPassword } = req.body;
  const nameRegex = /^[A-Za-z]+$/;
  if (!nameRegex.test(firstName) || !nameRegex.test(lastName)) {
    return res.status(400).json({ message: 'Names must use English letters only' });
  }
  const usernameRegex = /^[A-Za-z0-9_]+$/;
  if (!username || !usernameRegex.test(username)) {
    return res.status(400).json({ message: 'Username must contain only English letters, numbers, or underscores' });
  }
  const dobRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateOfBirth || !dobRegex.test(dateOfBirth)) {
    return res.status(400).json({ message: 'Date of birth must be in YYYY-MM-DD format' });
  }
  if (!password || password !== verifyPassword || password.length < 8) {
    return res.status(400).json({ message: 'Passwords must match and be at least 8 characters' });
  }

  const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
  const user = new User({
    firstName,
    lastName,
    name: `${firstName} ${lastName}`,
    username,
    dateOfBirth,
    email: invitation.email,
    passwordHash,
    role: invitation.role,
    personalData: [
      { field: 'firstName', value: firstName, locked: true },
      { field: 'lastName', value: lastName, locked: true },
      { field: 'dateOfBirth', value: dateOfBirth, locked: true }
    ]
  });
  await user.save();

  if (invitation.tripId) {
    if (invitation.role === 'organizer') {
      await Trip.findByIdAndUpdate(invitation.tripId, { $addToSet: { organizerIds: user._id } });
    } else if (invitation.role === 'traveler') {
      await Trip.findByIdAndUpdate(invitation.tripId, { $push: { travelerIds: user._id } });
    }
  }
  invitation.used = true;
  await invitation.save();
  res.status(201).json({ id: user._id, email: user.email });
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });
  const hash = crypto.createHash('sha256').update(password).digest('hex');
  if (user.passwordHash !== hash) return res.status(401).json({ message: 'Invalid credentials' });
  res.json({ id: user._id, role: user.role, name: user.name || user.username, mustChangePassword: user.mustChangePassword });
});

app.post('/api/users/:id/password', async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) return res.sendStatus(404);
  const oldHash = crypto.createHash('sha256').update(oldPassword).digest('hex');
  if (user.passwordHash !== oldHash) return res.status(403).json({ message: 'Current password incorrect' });
  const newHash = crypto.createHash('sha256').update(newPassword).digest('hex');
  user.passwordHash = newHash;
  user.mustChangePassword = false;
  await user.save();
  res.json({ message: 'Password updated' });
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

app.delete('/api/users/:id', async (req, res) => {
  const id = req.params.id;
  await Trip.updateMany({ organizerIds: id }, { $pull: { organizerIds: id } });
  await Trip.updateMany({ travelerIds: id }, { $pull: { travelerIds: id } });
  await User.findByIdAndDelete(id);
  res.sendStatus(204);
});

app.get('/api/trips', async (_req, res) => {
  const trips = await Trip.find().lean();
  const allOrganizerIds = [...new Set(trips.flatMap(t => (t.organizerIds || []).map(id => id.toString())))];
  const organizers = await User.find({ _id: { $in: allOrganizerIds } }, 'name');
  const nameMap = Object.fromEntries(organizers.map(o => [o._id.toString(), o.name]));
  const result = trips.map(t => ({
    ...t,
    organizerNames: (t.organizerIds || []).map(id => nameMap[id.toString()] || '')
  }));
  res.json(result);
});

app.post('/api/trips', async (req, res) => {
  const { name, startDate, endDate, organizerIds = [], travelerIds = [] } = req.body;
  const trip = new Trip({ name, startDate, endDate, organizerIds, travelerIds });
  await trip.save();
  res.status(201).json(trip);
});

app.post('/api/trips/:id/organizers', async (req, res) => {
  const { userId } = req.body;
  await Trip.findByIdAndUpdate(req.params.id, { $addToSet: { organizerIds: userId } });
  res.sendStatus(204);
});

app.delete('/api/trips/:id/organizers/:userId', async (req, res) => {
  const trip = await Trip.findById(req.params.id);
  if (!trip) return res.sendStatus(404);
  if ((trip.organizerIds || []).length <= 1) {
    return res.status(400).json({ message: 'Trip must retain at least one organizer' });
  }
  await Trip.findByIdAndUpdate(req.params.id, { $pull: { organizerIds: req.params.userId } });
  res.sendStatus(204);
});

app.post('/api/trips/:id/travelers', async (req, res) => {
  const { userId } = req.body;
  await Trip.findByIdAndUpdate(req.params.id, { $addToSet: { travelerIds: userId } });
  res.sendStatus(204);
});

app.delete('/api/trips/:id/travelers/:userId', async (req, res) => {
  await Trip.findByIdAndUpdate(req.params.id, { $pull: { travelerIds: req.params.userId } });
  res.sendStatus(204);
});

app.get('/api/field-config', async (_req, res) => {
  const configs = await FieldConfig.find().sort({ order: 1 });
  res.json(configs);
});

app.put('/api/field-config/:field', async (req, res) => {
  const { label, type, enabled, locked, tripId, order } = req.body;
  const config = await FieldConfig.findOneAndUpdate(
    { field: req.params.field, tripId },
    { field: req.params.field, label, type, enabled, locked, tripId, order },
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

app.get('/api/users/:id/personal-data', async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.sendStatus(404);
  res.json(user.personalData);
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

app.post('/api/users/:id/personal-data/:field/file', upload.single('file'), async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user || !req.file) return res.sendStatus(400);
  const config = await FieldConfig.findOne({ field: req.params.field });
  if (!config || config.type !== 'file') return res.status(400).json({ message: 'Invalid field' });
  let entry = user.personalData.find(e => e.field === req.params.field);
  if (entry) {
    entry.value = req.file.path;
  } else {
    user.personalData.push({ field: req.params.field, value: req.file.path });
  }
  await user.save();
  res.json({ path: req.file.path });
});

app.delete('/api/users/:id/personal-data/:field/file', async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.sendStatus(404);
  const entry = user.personalData.find(e => e.field === req.params.field);
  if (!entry || !entry.value) return res.sendStatus(404);
  try {
    await fs.promises.unlink(entry.value);
  } catch (_) {}
  entry.value = '';
  await user.save();
  res.sendStatus(204);
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

async function start() {
  try {
    await mongoose.connect(process.env.MONGODB_URI ?? 'mongodb://localhost:27017/myTrip');
    await ensureAdminUser();
    await ensureDefaultFieldConfigs();
    const port = process.env.PORT || 3001;
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (err) {
    console.error('Failed to start server', err);
    process.exit(1);
  }
}

start();

