// update-feedback-fields.js
require('dotenv').config();
const mongoose = require('mongoose');
const Feedback = require('./models/Feedback');

async function updateFeedbackFields() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tripnest');
  const feedbacks = await Feedback.find({});
  let updated = 0;
  for (const fb of feedbacks) {
    let changed = false;
    if (typeof fb.wouldBookAgain === 'undefined') {
      fb.wouldBookAgain = '';
      changed = true;
    }
    if (typeof fb.safetyExperience === 'undefined') {
      fb.safetyExperience = '';
      changed = true;
    }
    if (typeof fb.suggestions === 'undefined') {
      fb.suggestions = '';
      changed = true;
    }
    if (changed) {
      await fb.save();
      updated++;
    }
  }
  console.log(`Updated ${updated} feedback records.`);
  await mongoose.disconnect();
}

updateFeedbackFields();
