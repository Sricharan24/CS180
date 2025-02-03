import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useNavigate } from 'react-router-dom';
import SignIn from './SignIn';
import SignUp from './SignUp';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '';

function MainApp() {
    const [transactions, setTransactions] = useState([]);
    const [budgets, setBudgets] = useState([]);
    const [form, setForm] = useState({ amount: '', category: '', description: '', date: '' });

    // State for report generation
    const [reportForm, setReportForm] = useState({ startDate: '', endDate: '' });
    const [reportData, setReportData] = useState(null);

    // State for sorting
    const [sortOrder, setSortOrder] = useState('date'); // Default sorting by date


    // State for budget form
    const [budgetForm, setBudgetForm] = useState({ amount: '', category: '' });


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
    const transaction = {
        ...form,
    };


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
            console.log('Transaction added/updated:', updatedTransaction);
            setForm({ amount: '', category: '', description: '', date: '' });
            fetchTransactions();
        } else {
            console.error('Error adding/updating transaction:', response.statusText);
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
            console.log('Transaction deleted successfully');
            setTransactions(transactions.filter((t) => t._id !== id));
        } else {
            console.error('Error deleting transaction:', response.statusText);
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
    };


    const fetchReport = async () => {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(
            `${API_BASE_URL}/reports?startDate=${reportForm.startDate}&endDate=${reportForm.endDate}`,
            { headers: { 'Authorization': `Bearer ${token}` } }
        );
        if (!response.ok) {
            throw new Error('Error fetching report');
        }
        const data = await response.json();
        setReportData(data);
    } catch (error) {
        console.error('Error fetching report:', error);
    }
    };


    const addBudget = async () => {
    const token = localStorage.getItem('token');
    const budget = {
        ...budgetForm,
    };


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
            console.log('Budget added:', newBudget);
            setBudgetForm({ amount: '', category: '' });
            fetchBudgets();
        } else {
            console.error('Error adding budget:', response.statusText);
        }
    } catch (error) {
        console.error('Error adding budget:', error);
    }
    };


    // Function to download the report as CSV
    const downloadReport = () => {
    if (!reportData) return;


    let csvContent = "data:text/csv;charset=utf-8,";


    // Add Total Spending
    csvContent += `Total Spending,${reportData.totalSpending.toFixed(2)}\n\n`;


    // Add Category Breakdown
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


    // Sorting function
    const sortTransactions = (transactions) => {
    if (sortOrder === 'amount') {
        return transactions.sort((a, b) => parseFloat(a.amount) - parseFloat(b.amount));
    } else {
        return transactions.sort((a, b) => new Date(a.date) - new Date(b.date));
    }
    };


    const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/signin');
    };


    return (
    <div>
        <header className="logo-header">
            <button onClick={handleLogout} className="logout-button">Logout</button>
        </header>
        <div className="logo-container">
            <img src="/logo.png" alt="FinWise Logo" className="logo" />
            <h1 className="dashboard-title">Personal Finance Dashboard</h1>
        </div>
        {/* Add Transaction Section */}
        <section>
            <h2>Add Transaction</h2>
            <input
                type="number"
                placeholder="Amount"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />
            <input
                type="text"
                placeholder="Category"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
            />
            <input
                type="text"
                placeholder="Description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <input
                type="date"
                placeholder="Date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
            <button onClick={addTransaction}>
                {form._id ? 'Update Transaction' : 'Add Transaction'}
            </button>
        </section>


        {/* Transactions Section */}
        <section>
            <h2>Transactions</h2>
                        {/* Sort Transactions */}
        <section>
            <label htmlFor="sortOrder">Sort by: </label>
            <select id="sortOrder" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
                <option value="date">Date</option>
                <option value="amount">Amount</option>
            </select>
        </section>


            <ul>
                {sortTransactions(transactions).map((t) => (
                    <li key={t._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <strong>{new Date(t.date).toLocaleDateString('en-US')}</strong> | ${t.amount} - {t.category} ({t.description})
                        </div>
                        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginTop: '10px', width: 'fit-content', padding: '0', backgroundColor: 'transparent', boxShadow: 'none' }}>
                        <button
                        style={{ backgroundColor: 'blue', color: 'white', border: 'none', cursor: 'pointer', padding: '5px 10.5px', fontSize: '12px', borderRadius: '4px' }}
                        onClick={() => handleEditTransaction(t)}
                        >
                        Edit
                        </button>
                        <button
                        style={{ backgroundColor: 'red', color: 'white', border: 'none', cursor: 'pointer', padding: '5px 4px', fontSize: '12px', borderRadius: '4px', marginTop: '5px' }}
                        onClick={() => deleteTransaction(t._id)}
                        >
                        Delete
                        </button>
                        </div>
                    </li>
                ))}
            </ul>
        </section>


        {/* Budgets Section */}
        <section>
            <h2>Budgets</h2>
            <input
                type="number"
                placeholder="Budget Amount"
                value={budgetForm.amount}
                onChange={(e) => setBudgetForm({ ...budgetForm, amount: e.target.value })}
            />
            <input
                type="text"
                placeholder="Budget Category"
                value={budgetForm.category}
                onChange={(e) => setBudgetForm({ ...budgetForm, category: e.target.value })}
            />
            <button onClick={addBudget}>Add Budget</button>
            <ul>
                {budgets.map((b) => (
                    <li key={b._id}>
                        {b.category}: ${b.amount} (Ends: {new Date(b.end_date).toLocaleDateString()})
                    </li>
                ))}
            </ul>
        </section>


        {/* Financial Report Section */}
        <section>
            <h2>Generate Report</h2>
            <input
                type="date"
                value={reportForm.startDate}
                onChange={(e) => setReportForm({ ...reportForm, startDate: e.target.value })}
            />
            <input
                type="date"
                value={reportForm.endDate}
                onChange={(e) => setReportForm({ ...reportForm, endDate: e.target.value })}
            />
            <button onClick={fetchReport}>Generate Report</button>


            {reportData && (
                <div className="report-container">
                    <h3>Report Summary</h3>
                    <p><strong>Total Spending:</strong> ${reportData.totalSpending.toFixed(2)}</p>


                    {/* Category Breakdown */}
                    <h4>Category Breakdown</h4>
                    <ul>
                        {Object.entries(reportData.categoryBreakdown).map(([category, amount]) => (
                            <li key={category}>
                                <strong>{category}:</strong> ${amount.toFixed(2)}
                            </li>
                        ))}
                    </ul>


                    <button onClick={downloadReport} style={{ marginTop: '10px', backgroundColor: '#007bff', color: 'white', padding: '10px', borderRadius: '5px', cursor: 'pointer' }}>
                        Download Report
                    </button>
                </div>
        
                )}
            </section>

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
