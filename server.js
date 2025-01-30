require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Import the Transaction model
const Transaction = require('./models/Transaction');
const Budget = require('./models/Budget'); 
const User = require('./models/User'); // Import the User model

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

// Middleware to authenticate user
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).send('Access denied');
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).send('Invalid token');
  }
};

// Routes

/** 
 * @route GET /transactions
 * @desc Fetch all transactions for the logged-in user
 */
app.get('/transactions', authenticate, async (req, res) => {
  try {
    const transactions = await Transaction.find({ user_id: req.user.userId });
    res.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).send('Error fetching transactions');
  }
});

/** 
 * @route POST /transactions
 * @desc Add a new transaction for the logged-in user
 */
app.post('/transactions', authenticate, async (req, res) => {
  try {
    const transaction = new Transaction({ ...req.body, user_id: req.user.userId });
    const savedTransaction = await transaction.save();
    res.status(201).json(savedTransaction);
  } catch (error) {
    console.error('Error saving transaction:', error);
    res.status(400).send('Error saving transaction');
  }
});

/** 
 * @route DELETE /transactions/:id
 * @desc Delete a transaction by ID for the logged-in user
 */
app.delete('/transactions/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const deletedTransaction = await Transaction.findOneAndDelete({ _id: id, user_id: req.user.userId });
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

/** 
 * @route PUT /transactions/:id
 * @desc Edit an existing transaction for the logged-in user
 */
app.put('/transactions/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const updatedTransaction = await Transaction.findOneAndUpdate(
      { _id: id, user_id: req.user.userId },
      req.body,
      { new: true }
    );
    if (updatedTransaction) {
      res.status(200).json(updatedTransaction);
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
 * @desc Fetch all budgets for the logged-in user
 */
app.get('/budgets', authenticate, async (req, res) => {
  try {
    const budgets = await Budget.find({ user_id: req.user.userId });
    res.json(budgets);
  } catch (error) {
    console.error('Error fetching budgets:', error);
    res.status(500).send('Error fetching budgets');
  }
});

/** 
 * @route POST /budgets
 * @desc Add a new budget for the logged-in user
 */
app.post('/budgets', authenticate, async (req, res) => {
  try {
    const budget = new Budget({ ...req.body, user_id: req.user.userId });
    const savedBudget = await budget.save();
    res.status(201).json(savedBudget);
  } catch (error) {
    console.error('Error saving budget:', error);
    res.status(400).send('Error saving budget');
  }
});

/** 
 * @route DELETE /budgets/:id
 * @desc Delete a budget by ID for the logged-in user
 */
app.delete('/budgets/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const deletedBudget = await Budget.findOneAndDelete({ _id: id, user_id: req.user.userId });
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
 * @desc Generate a financial report for a given date range for the logged-in user
 */
app.get('/reports', authenticate, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start date and end date are required' });
    }

    // Fetch transactions in the date range for the logged-in user
    const transactions = await Transaction.find({
      user_id: req.user.userId,
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
    const budgets = await Budget.find({ user_id: req.user.userId });

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

// POST /signup - Register a new user
app.post('/signup', async (req, res) => {
  try {
    const { email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword });
    const savedUser = await user.save();
    res.status(201).json(savedUser);
  } catch (error) {
    console.error('Error signing up:', error);
    res.status(400).send('Error signing up');
  }
});

// POST /signin - Authenticate a user
app.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).send('Invalid credentials');
    }
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    console.error('Error signing in:', error);
    res.status(400).send('Error signing in');
  }
});

// Start the server
const PORT = 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

