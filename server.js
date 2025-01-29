require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Import the Transaction model
const Transaction = require('./models/Transaction');
const Budget = require('./models/Budget'); 

// Initialize Express app
const app = express();

// Middleware
app.use(cors()); // Enable CORS for cross-origin requests
app.use(express.json()); // Parse JSON bodies

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('Connected to MongoDB'))
  .catch((error) => console.error('Error connecting to MongoDB:', error));

// Routes

/** 
 * @route GET /transactions
 * @desc Fetch all transactions
 */
// GET /transactions - Fetch all transactions
app.get('/transactions', async (req, res) => {
  try {
    const transactions = await Transaction.find(); // Fetch all transactions
    res.json(transactions); // Send transactions as JSON response
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).send('Error fetching transactions');
  }
});

/** 
 * @route POST /transactions
 * @desc Add a new transaction
 */
// POST /transactions - Add a new transaction
app.post('/transactions', async (req, res) => {
  try {
    const transaction = new Transaction(req.body); // Create a new transaction from request body
    const savedTransaction = await transaction.save(); // Save to the database
    res.status(201).json(savedTransaction); // Send back the saved transaction
  } catch (error) {
    console.error('Error saving transaction:', error);
    res.status(400).send('Error saving transaction');
  }
});

/** 
 * @route DELETE /transactions/:id
 * @desc Delete a transaction by ID
 */
app.delete('/transactions/:id', async (req, res) => {
  try {
    const { id } = req.params; // Extract transaction ID from URL
    const deletedTransaction = await Transaction.findByIdAndDelete(id); // Delete transaction from database
    if (deletedTransaction) {
      res.status(200).json({ message: 'Transaction deleted successfully', deletedTransaction });
    } else {
      res.status(404).json({ message: 'Transaction not found' });
    }
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).send('Error deleting transaction');
  }
});

// PUT /transactions/:id - Edit an existing transaction
app.put('/transactions/:id', async (req, res) => {
  try {
    const { id } = req.params; // Get the transaction ID from URL params
    const updatedTransaction = await Transaction.findByIdAndUpdate(id, req.body, { new: true }); // Update the transaction
    if (updatedTransaction) {
      res.status(200).json(updatedTransaction); // Return the updated transaction
    } else {
      res.status(404).json({ message: 'Transaction not found' });
    }
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(500).send('Error updating transaction');
  }
});


/** 
 * @route GET /budgets
 * @desc Fetch all budgets
 */
app.get('/budgets', async (req, res) => {
  try {
    const budgets = await Budget.find();
    res.json(budgets);
  } catch (error) {
    console.error('Error fetching budgets:', error);
    res.status(500).send('Error fetching budgets');
  }
});

/** 
 * @route POST /budgets
 * @desc Add a new budget
 */
app.post('/budgets', async (req, res) => {
  try {
    const budget = new Budget(req.body);
    const savedBudget = await budget.save();
    res.status(201).json(savedBudget);
  } catch (error) {
    console.error('Error saving budget:', error);
    res.status(400).send('Error saving budget');
  }
});

/** 
 * @route DELETE /budgets/:id
 * @desc Delete a budget by ID
 */
app.delete('/budgets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletedBudget = await Budget.findByIdAndDelete(id);
    if (deletedBudget) {
      res.status(200).json({ message: 'Budget deleted successfully', deletedBudget });
    } else {
      res.status(404).json({ message: 'Budget not found' });
    }
  } catch (error) {
    console.error('Error deleting budget:', error);
    res.status(500).send('Error deleting budget');
  }
});

/** 
 * @route GET /reports
 * @desc Generate a financial report for a given date range
 */
app.get('/reports', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start date and end date are required' });
    }

    // Fetch transactions in the date range
    const transactions = await Transaction.find({
      date: { $gte: new Date(startDate), $lte: new Date(endDate) }
    });

    if (transactions.length === 0) {
      return res.status(404).json({ message: 'No transactions found in the given date range' });
    }

    // Compute total spending
    const totalSpending = transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);

    // Compute spending per category
    const categoryBreakdown = transactions.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + parseFloat(t.amount);
      return acc;
    }, {});

    // Fetch budgets for comparison
    const budgets = await Budget.find();

    // Calculate budget performance
    const budgetPerformance = budgets.map(b => ({
      category: b.category,
      budgeted: b.amount,
      spent: categoryBreakdown[b.category] || 0,
      remaining: Math.max(0, b.amount - (categoryBreakdown[b.category] || 0))
    }));

    // Return the report
    res.json({ totalSpending, categoryBreakdown, budgetPerformance });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).send('Error generating report');
  }
});

// Start the server
const PORT = 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

