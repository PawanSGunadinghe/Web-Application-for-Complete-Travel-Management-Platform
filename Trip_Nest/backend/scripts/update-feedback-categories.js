// Update existing feedback records with proper categories
const mongoose = require('mongoose');
const Feedback = require('../models/Feedback');

const updateFeedbackCategories = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tripnest');
        console.log('Connected to MongoDB');

        // Find all feedback records
        const feedbacks = await Feedback.find({});
        console.log(`Found ${feedbacks.length} feedback records`);

        // Update each feedback record with a proper category
        for (const feedback of feedbacks) {
            let category = 'general';
            
            // Try to determine category based on content
            const content = `${feedback.title || ''} ${feedback.body || ''}`.toLowerCase();
            
            if (content.includes('vehicle') || content.includes('car') || content.includes('bus')) {
                category = 'vehicle';
            } else if (content.includes('guide') || content.includes('tour guide')) {
                category = 'tour_guide';
            } else if (content.includes('package') || content.includes('tour package')) {
                category = 'package';
            } else if (content.includes('driver')) {
                category = 'driver';
            }
            
            // Update the feedback with the determined category
            await Feedback.findByIdAndUpdate(feedback._id, { category });
            console.log(`Updated feedback ${feedback._id} with category: ${category}`);
        }

        console.log('All feedback records updated successfully');
        
        // Verify the updates
        const updatedFeedbacks = await Feedback.find({});
        console.log('\nUpdated feedback records:');
        updatedFeedbacks.forEach(f => {
            console.log(`- ${f.userName}: "${f.title || f.body?.substring(0, 20)}..." - Category: ${f.category}`);
        });

    } catch (error) {
        console.error('Update failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
};

// Run the update
updateFeedbackCategories();
