const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
    user_id: { type: String, required: true },
    category: { type: String, required: true },
    amount: { type: Number, required: true },
    start_date: { type: Date, default: Date.now },
    end_date: { type: Date, required: true },
});

module.exports = mongoose.model('Budget', budgetSchema);
