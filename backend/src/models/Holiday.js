const mongoose = require('mongoose');

const holidaySchema = new mongoose.Schema({
  date: { type: Date, required: true },
  name: { type: String, required: true, trim: true },
  type: { type: String, enum: ['National', 'Festival', 'Optional'], default: 'National' },
  year: { type: Number, required: true },
}, { timestamps: true });

holidaySchema.index({ year: 1 });
holidaySchema.index({ date: 1 });

module.exports = mongoose.model('Holiday', holidaySchema);
