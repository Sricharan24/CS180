const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, required: true },
  category: { type: String, required: true },
  amount: { type: Number, required: true },
  month: { type: String, required: true },
  start_date: Date,
  end_date: Date,
  spent: { type: Number, default: 0 },
  remaining: { type: Number, default: 0 }
});

const Budget = mongoose.model('Budget', budgetSchema);
module.exports = Budget;
