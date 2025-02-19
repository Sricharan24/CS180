import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useNavigate } from 'react-router-dom';
import SignIn from './SignIn';
import SignUp from './SignUp';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '';

function MainApp() {
    const [transactions, setTransactions] = useState([]);
    const [budgets, setBudgets] = useState([]);
    const [form, setForm] = useState({ amount: '', category: '', description: '', date: '' });
    const [reportForm, setReportForm] = useState({ startDate: '', endDate: '' });
    const [reportData, setReportData] = useState(null);
    const [sortOrder, setSortOrder] = useState('date');
    const [budgetForm, setBudgetForm] = useState({ amount: '', category: '' });
    const [activeTab, setActiveTab] = useState('transactions');

    const navigate = useNavigate();

    useEffect(() => {
        fetchTransactions();
        fetchBudgets();
    }, []);

    const fetchTransactions = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/transactions`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setTransactions(data);
        } catch (error) {
            console.error('Error fetching transactions:', error);
        }
    };

    const fetchBudgets = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/budgets`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setBudgets(data);
        } catch (error) {
            console.error('Error fetching budgets:', error);
        }
    };

    const addTransaction = async () => {
        const token = localStorage.getItem('token');
        const transaction = { ...form };

        try {
            let response;
            if (form._id) {
                response = await fetch(`${API_BASE_URL}/transactions/${form._id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(transaction),
                });
            } else {
                response = await fetch(`${API_BASE_URL}/transactions`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(transaction),
                });
            }

            if (response.ok) {
                const updatedTransaction = await response.json();
                setForm({ amount: '', category: '', description: '', date: '' });
                fetchTransactions();
                setActiveTab('transactions'); // Return to transactions tab after update
            }
        } catch (error) {
            console.error('Error adding/updating transaction:', error);
        }
    };

    const deleteTransaction = async (id) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/transactions/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                setTransactions(transactions.filter((t) => t._id !== id));
            }
        } catch (error) {
            console.error('Error deleting transaction:', error);
        }
    };

    const handleEditTransaction = (transaction) => {
        setForm({
            _id: transaction._id,
            amount: transaction.amount,
            category: transaction.category,
            description: transaction.description,
            date: new Date(transaction.date).toISOString().split('T')[0],
        });
        setActiveTab('addTransaction'); // Switch to add transaction tab
    };

    const fetchReport = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(
                `${API_BASE_URL}/reports?startDate=${reportForm.startDate}&endDate=${reportForm.endDate}`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            const data = await response.json();
            setReportData(data);
        } catch (error) {
            console.error('Error fetching report:', error);
        }
    };

    const addBudget = async () => {
        const token = localStorage.getItem('token');
        const budget = { ...budgetForm };

        try {
            const response = await fetch(`${API_BASE_URL}/budgets`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(budget),
            });

            if (response.ok) {
                const newBudget = await response.json();
                setBudgetForm({ amount: '', category: '' });
                fetchBudgets();
            }
        } catch (error) {
            console.error('Error adding budget:', error);
        }
    };

    const downloadReport = () => {
        if (!reportData) return;

        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += `Total Spending,${reportData.totalSpending.toFixed(2)}\n\n`;
        csvContent += "Category,Amount\n";
        Object.entries(reportData.categoryBreakdown).forEach(([category, amount]) => {
            csvContent += `${category},${amount.toFixed(2)}\n`;
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "Financial Report.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const sortTransactions = (transactions) => {
        return sortOrder === 'amount' 
            ? [...transactions].sort((a, b) => a.amount - b.amount)
            : [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/signin');
    };

    return (
        <div>
            <header>
                <img src="/FINWISE.png" alt="FinWise Logo" className="logo" />
                <button onClick={handleLogout} className="logout-button">Logout</button>
            </header>

            <h1 className="dashboard-title">Personal Finance Dashboard</h1>
            <div className="nav-tabs">
                <button onClick={() => setActiveTab('addTransaction')}>Add Transaction</button>
                <button onClick={() => setActiveTab('transactions')}>Transactions</button>
                <button onClick={() => setActiveTab('budgets')}>Budgets</button>
                <button onClick={() => setActiveTab('report')}>Financial Report</button>
            </div>

            <div className="dashboard-container">
                {activeTab === 'addTransaction' && (
                    <section className="section-box">
                        <h2>{form._id ? 'Edit Transaction' : 'Add Transaction'}</h2>
                        <div className="input-group">
                            <input
                                type="number"
                                placeholder="Amount"
                                value={form.amount}
                                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                            />
                        </div>
                        <div className="input-group">
                            <input
                                type="text"
                                placeholder="Category"
                                value={form.category}
                                onChange={(e) => setForm({ ...form, category: e.target.value })}
                            />
                        </div>
                        <div className="input-group">
                            <input
                                type="text"
                                placeholder="Description"
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                            />
                        </div>
                        <div className="input-group">
                            <input
                                type="date"
                                value={form.date}
                                onChange={(e) => setForm({ ...form, date: e.target.value })}
                            />
                        </div>
                        <button onClick={addTransaction} className="primary-btn">
                            {form._id ? 'Update Transaction' : 'Add Transaction'}
                        </button>
                    </section>
                )}

                {activeTab === 'transactions' && (
                    <section className="section-box">
                        <h2>Transactions</h2>
                        <div className="sort-container">
                            <label>Sort by:</label>
                            <select 
                                value={sortOrder} 
                                onChange={(e) => setSortOrder(e.target.value)}
                            >
                                <option value="date">Date</option>
                                <option value="amount">Amount</option>
                            </select>
                        </div>
                        <table className="dashboard-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Description</th>
                                    <th>Category</th>
                                    <th>Amount</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortTransactions(transactions).map((t) => (
                                    <tr key={t._id}>
                                        <td className="date-cell">
                                            {new Date(t.date).toLocaleDateString('en-US')}
                                        </td>
                                        <td>{t.description}</td>
                                        <td>
                                            <span className="category-tag">{t.category}</span>
                                        </td>
                                        <td className="amount-cell">${t.amount}</td>
                                        <td>
                                            <div className="action-buttons">
                                                <button 
                                                    className="edit-btn"
                                                    onClick={() => handleEditTransaction(t)}
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    className="delete-btn"
                                                    onClick={() => deleteTransaction(t._id)}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </section>
                )}

                {activeTab === 'budgets' && (
                    <section className="section-box budget-section">
                        <h2>Budgets</h2>
                        <div className="input-group">
                            <input
                                type="number"
                                placeholder="Budget Amount"
                                value={budgetForm.amount}
                                onChange={(e) => setBudgetForm({ ...budgetForm, amount: e.target.value })}
                            />
                        </div>
                        <div className="input-group">
                            <input
                                type="text"
                                placeholder="Budget Category"
                                value={budgetForm.category}
                                onChange={(e) => setBudgetForm({ ...budgetForm, category: e.target.value })}
                            />
                        </div>
                        <button onClick={addBudget}>Add Budget</button>
                        <ul>
                            {budgets.map((b) => (
                                <li key={b._id}>
                                    {b.category}: ${b.amount} (Ends: {new Date(b.end_date).toLocaleDateString()})
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                {activeTab === 'report' && (
                    <section className="section-box report-section">
                        <h2>Generate Report</h2>
                        <div className="input-group">
                            <input
                                type="date"
                                value={reportForm.startDate}
                                onChange={(e) => setReportForm({ ...reportForm, startDate: e.target.value })}
                            />
                        </div>
                        <div className="input-group">
                            <input
                                type="date"
                                value={reportForm.endDate}
                                onChange={(e) => setReportForm({ ...reportForm, endDate: e.target.value })}
                            />
                        </div>
                        <button onClick={fetchReport}>Generate Report</button>
                        {reportData && (
                            <div className="report-container">
                                <h3>Report Summary</h3>
                                <p><strong>Total Spending:</strong> ${reportData.totalSpending.toFixed(2)}</p>
                                <h4>Category Breakdown</h4>
                                <ul>
                                    {Object.entries(reportData.categoryBreakdown).map(([category, amount]) => (
                                        <li key={category}>
                                            <strong>{category}:</strong> ${amount.toFixed(2)}
                                        </li>
                                    ))}
                                </ul>
                                <button onClick={downloadReport}>Download Report</button>
                            </div>
                        )}
                    </section>
                )}
            </div>
        </div>
    );
}

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/signin" element={<SignIn />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/main" element={<MainApp />} />
                <Route path="/" element={<Navigate to="/signin" />} />
            </Routes>
        </Router>
    );
}

export default App;