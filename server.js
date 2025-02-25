require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Import the models
const Transaction = require('./Models/Transaction');
const Budget = require('./Models/Budget');
const User = require('./Models/User');

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

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

// Utility function to update budgets
const updateBudgetsForTransaction = async (userId, category, date) => {
  try {
    const budgets = await Budget.find({
      user_id: userId,
      category: category,
      start_date: { $lte: date },
      end_date: { $gte: date }
    });

    for (const budget of budgets) {
      const transactions = await Transaction.find({
        user_id: userId,
        category: category,
        date: {
          $gte: new Date(budget.start_date),
          $lte: new Date(budget.end_date)
        }
      });

      const totalSpent = transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
      // Add validation
      if (isNaN(totalSpent)) {
        throw new Error('Invalid transaction amounts found');
      }

      budget.spent = totalSpent;
      budget.remaining = budget.amount - totalSpent;
      await budget.save();
    }
  } catch (error) {
    console.error('Error updating budgets:', error);
    throw error; // Re-throw to be caught by parent try/catch
  }
};

// Transaction Routes

app.get('/transactions', authenticate, async (req, res) => {
  try {
    const transactions = await Transaction.find({ user_id: req.user.userId });
    res.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).send('Error fetching transactions');
  }
});

app.post('/transactions', authenticate, async (req, res) => {
  try {
      const transaction = new Transaction({ ...req.body, user_id: req.user.userId });
      const savedTransaction = await transaction.save();
      
      // Return all transactions for the user
      const transactions = await Transaction.find({ user_id: req.user.userId });
      res.status(201).json(transactions);
  } catch (error) {
      console.error('Error saving transaction:', error);
      res.status(400).json({ error: 'Error saving transaction' });
  }
});

app.put('/transactions/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const updatedTransaction = await Transaction.findOneAndUpdate(
      { _id: id, user_id: req.user.userId },
      req.body,
      { new: true }
    );
    
    if (updatedTransaction) {
      // Update budgets after modification
      await updateBudgetsForTransaction(
        req.user.userId,
        updatedTransaction.category,
        updatedTransaction.date
      );
      res.status(200).json(updatedTransaction);
    } else {
      res.status(404).json({ message: 'Transaction not found' });
    }
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(500).send('Error updating transaction');
  }
});

app.delete('/transactions/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const deletedTransaction = await Transaction.findOneAndDelete({ 
      _id: id, 
      user_id: req.user.userId 
    });
    
    if (deletedTransaction) {
      // Update budgets after deletion
      await updateBudgetsForTransaction(
        req.user.userId,
        deletedTransaction.category,
        deletedTransaction.date
      );
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
app.get('/budgets', authenticate, async (req, res) => {
  try {
    const budgets = await Budget.find({ user_id: req.user.userId });
    res.json(budgets);
  } catch (error) {
    console.error('Error fetching budgets:', error);
    res.status(500).send('Error fetching budgets');
  }
});

app.post('/budgets', authenticate, async (req, res) => {
  try {
    const { category, amount, month, start_date, end_date } = req.body;
    const user_id = req.user.userId;

    if (!month) {
      return res.status(400).json({ message: "Month is required for budget" });
    }

    let existingBudget = await Budget.findOne({ category, month, user_id });

    if (existingBudget) {
      existingBudget.amount += parseFloat(amount);
    } else {
      existingBudget = new Budget({ 
        category, 
        amount: parseFloat(amount), 
        month, 
        start_date, 
        end_date, 
        user_id 
      });
    }

    const transactions = await Transaction.find({
      user_id,
      category,
      date: { 
        $gte: new Date(start_date),
        $lte: new Date(end_date)
      }
    });

    const totalSpent = transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    existingBudget.spent = totalSpent;
    existingBudget.remaining = existingBudget.amount - totalSpent;

    const savedBudget = await existingBudget.save();
    res.status(200).json({ message: `Budget for ${category} in ${month} updated`, updatedBudget: savedBudget });
  } catch (error) {
    console.error('Error saving budget:', error);
    res.status(400).send({ message: 'Error saving budget', error });
  }
});



// Replace the deleteBudget function with this proper route
// Add proper budget deletion route (replace any existing deleteBudget function)
app.delete('/budgets/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const deletedBudget = await Budget.findOneAndDelete({
      _id: id,
      user_id: req.user.userId
    });

    if (deletedBudget) {
      res.status(200).json({ message: 'Budget deleted successfully' });
    } else {
      res.status(404).json({ message: 'Budget not found' });
    }
  } catch (error) {
    console.error('Error deleting budget:', error);
    res.status(500).json({ message: 'Error deleting budget' });
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

    const transactions = await Transaction.find({
      user_id: req.user.userId,
      date: { $gte: new Date(startDate), $lte: new Date(endDate) },
    });

    if (transactions.length === 0) {
      return res.status(404).json({ message: 'No transactions found in the given date range' });
    }

    const totalSpending = transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const categoryBreakdown = transactions.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + parseFloat(t.amount);
      return acc;
    }, {});

    const budgets = await Budget.find({ user_id: req.user.userId });

    const budgetPerformance = budgets.map((b) => ({
      category: b.category,
      budgeted: b.amount,
      spent: categoryBreakdown[b.category] || 0,
      remaining: Math.max(0, b.amount - (categoryBreakdown[b.category] || 0)),
    }));

    res.json({ totalSpending, categoryBreakdown, budgetPerformance });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).send('Error generating report');
  }
});

/** 
 * @route POST /signup
 * @desc Register a new user
 */
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

/** 
 * @route POST /signin
 * @desc Authenticate a user
 */
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
