require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Import the Transaction model
const Transaction = require('./models/Transaction');

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

// Start the server
const PORT = 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

