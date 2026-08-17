const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, unique: true, required: true },
  plan: { type: String, enum: ['free', 'pro', 'enterprise'], default: 'free' }
}, { timestamps: true });

module.exports = mongoose.model('Organization', organizationSchema);