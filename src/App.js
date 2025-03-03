import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useNavigate } from 'react-router-dom';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import SignIn from './SignIn';
import SignUp from './SignUp';
import html2canvas from 'html2canvas';
import JSZip from 'jszip';


ChartJS.register(ArcElement, Tooltip, Legend);

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001';
const CATEGORIES = ['Food', 'Transportation', 'Housing', 'Entertainment', 'Utilities', 'Healthcare', 'Education', 'Shopping','Other'];

function MainApp() {
    const [transactions, setTransactions] = useState([]);
    const [budgets, setBudgets] = useState([]);
    const [form, setForm] = useState({ amount: '', category: '', description: '', date: '' });
    const [reportForm, setReportForm] = useState({ startDate: '', endDate: '' });
    const [reportData, setReportData] = useState(null);
    const [sortOrder, setSortOrder] = useState('date');
    const [budgetForm, setBudgetForm] = useState({ amount: '', category: '', month: '' });
    const [activeTab, setActiveTab] = useState('transactions');
    const [selectedCategory, setSelectedCategory] = useState('');

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
            date: form.date
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
                const newTransaction = await response.json();
    
                const transactionMonth = newTransaction.date.slice(0, 7);
    
                const hasCategoryBudget = budgets.some(b => b.category === newTransaction.category);
    
                const budgetExistsInMonth = budgets.some(b => b.category === newTransaction.category && b.month === transactionMonth);
    
                if (hasCategoryBudget && !budgetExistsInMonth) {
                    await fetch(`${API_BASE_URL}/budgets`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            category: newTransaction.category,
                            amount: 0,
                            month: transactionMonth,
                            start_date: `${transactionMonth}-01`,
                            end_date: `${transactionMonth}-31`
                        }),
                    });
                }
    
                setBudgets(prevBudgets => 
                    prevBudgets.map(budget => 
                        budget.category === newTransaction.category && budget.month === transactionMonth
                            ? { ...budget, spent: budget.spent + parseFloat(newTransaction.amount) }
                            : budget
                    )
                );
    
                await fetchTransactions();
                await fetchBudgets();
    
                setForm({ amount: '', category: '', description: '', date: '' });
                setActiveTab('transactions');
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
        fetchBudgets();
    };

    const handleEditTransaction = (transaction) => {
        setForm({
            _id: transaction._id,
            amount: transaction.amount,
            category: transaction.category,
            description: transaction.description,
            date: new Date(transaction.date).toLocaleDateString('en-CA'),  // ✅ Converts to Local Time
        });
        setActiveTab('addTransaction');
    };

    const addBudget = async () => {
        const token = localStorage.getItem('token');
        
        if (!budgetForm.month || !selectedCategory || !budgetForm.amount) {
          alert('Please fill all budget fields');
          return;
        }
      
        try {
          const response = await fetch(`${API_BASE_URL}/budgets`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              category: selectedCategory,
              amount: parseFloat(budgetForm.amount),
              month: budgetForm.month,
              start_date: `${budgetForm.month}-01`,
              end_date: `${budgetForm.month}-${new Date(
                budgetForm.month.split('-')[0],
                budgetForm.month.split('-')[1],
                0
              ).getDate()}`
            }),
          });
      
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to save budget');
          }
      
          const data = await response.json();
          setBudgetForm({ amount: '', category: '', month: '' });
          fetchBudgets();
      
        } catch (error) {
          console.error('Error adding budget:', error);
          alert(error.message || 'An error occurred while adding the budget');
        }
      };
    

    const deleteBudget = async (id) => {
        const token = localStorage.getItem('token');
    
        try {
            const response = await fetch(`${API_BASE_URL}/budgets/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
    
            if (response.ok) {
                fetchBudgets();
            } else {
                const data = await response.json();
                alert(`Error: ${data.message || "Could not delete budget"}`);
            }
        } catch (error) {
            console.error('Error deleting budget:', error);
            alert('An error occurred while deleting the budget.');
        }
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


    const downloadReport = async () => {
        if (!reportData) return;
    
        const zip = new JSZip();
    
        let csvContent = "Total Spending," + reportData.totalSpending.toFixed(2) + "\n\n";
        csvContent += "Category,Amount\n";
        Object.entries(reportData.categoryBreakdown).forEach(([category, amount]) => {
            csvContent += `${category},${amount.toFixed(2)}\n`;
        });
    
        zip.file("Financial_Report.csv", csvContent);
    
        const chartElement = document.querySelector(".pie-chart-container canvas");
        if (chartElement) {
            html2canvas(chartElement).then(canvas => {
                canvas.toBlob(blob => {
                    zip.file("Pie_Chart.png", blob);
    
                    zip.generateAsync({ type: "blob" }).then(zipBlob => {
                        const link = document.createElement("a");
                        link.href = URL.createObjectURL(zipBlob);
                        link.download = "Financial_Report.zip";
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                    });
                }, "image/png");
            });
        } else {
            console.error("Pie chart not found!");
        }
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

    const CATEGORY_COLORS = {
        Food: 'rgba(255, 107, 129, 0.8)',
        Transportation: 'rgba(77, 171, 247, 0.8)',
        Housing: 'rgba(255, 182, 193, 0.8)',
        Entertainment: 'rgba(98, 189, 178, 0.8)', 
        Utilities: 'rgba(181, 153, 240, 0.8)',
        Healthcare: 'rgba(255, 147, 79, 0.8)',
        Education: 'rgba(165, 214, 167, 0.8)',
        Other: 'rgba(120, 120, 120, 0.8)',
    };
    
    
    const getPieChartData = () => {
        if (!reportData || !reportData.categoryBreakdown) {
            return {
                labels: [],
                datasets: [
                    {
                        label: 'Spending Breakdown',
                        data: [],
                        backgroundColor: [],
                        borderColor: [],
                        borderWidth: 1,
                    },
                ],
            };
        }
    
        const categories = Object.keys(reportData.categoryBreakdown);
        const amounts = Object.values(reportData.categoryBreakdown);
    
        return {
            labels: categories,
            datasets: [
                {
                    label: '$',
                    data: amounts,
                    backgroundColor: categories.map(category => CATEGORY_COLORS[category] || 'rgba(150, 150, 150, 0.6)'),
                    borderColor: categories.map(category => CATEGORY_COLORS[category] || 'rgba(100, 100, 100, 1)'),
                    borderWidth: 1,
                },
            ],
        };
    };
    

    return (
        <div>
            <header>
                <div className="header-content">
                    <h1 className="dashboard-title">Personal Finance Dashboard</h1>
                </div>
                <button onClick={handleLogout} className="logout-button">Logout</button>
            </header>

            <div className="nav-tabs">
                <button onClick={() => setActiveTab('addTransaction')}>Add a Transaction</button>
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
                            <select
                                value={form.category}
                                onChange={(e) => setForm({ ...form, category: e.target.value })}
                            >
                                <option value="">Select Category</option>
                                {CATEGORIES.map(category => (
                                    <option key={category} value={category}>{category}</option>
                                ))}
                            </select>
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
                                            {(() => {
                                                const [year, month, day] = t.date.split('-'); 
                                                return `${parseInt(month)}/${parseInt(day)}/${year}`;
                                            })()}
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
        <h2>Monthly Budgets</h2>
        <div className="category-tabs">
  {CATEGORIES.map(category => (
    <button
      key={category}
      className={`tab-button ${selectedCategory === category ? 'active' : ''}`}
      onClick={() => {
        setSelectedCategory(category);
      }}
    >
      {category}
    </button>
  ))}
</div>
        
        <div className="input-group">
            <input
                type="number"
                placeholder="Budget Amount"
                value={budgetForm.amount}
                onChange={(e) => setBudgetForm({ ...budgetForm, amount: e.target.value })}
            />
            <input
                type="month"
                value={budgetForm.month}
                onChange={(e) => setBudgetForm({ ...budgetForm, month: e.target.value })}
            />
            <button onClick={addBudget}>Add Budget</button>
        </div>

        {/* ✅ Display Total Budget for Selected Category */}
{selectedCategory && (
    <div className="total-category-budget" style={{ marginBottom: '15px', fontWeight: 'bold', fontSize: '18px' }}>
        <h3>
            Total {selectedCategory} Budget: $
            {budgets
                .filter(budget => budget.category === selectedCategory)
                .reduce((sum, budget) => sum + budget.amount, 0)
                .toFixed(2)}
        </h3>
    </div>
)}

        <div className="budget-list">
        {budgets
    .filter(b => b.category === selectedCategory)
    .sort((a, b) => new Date(b.month) - new Date(a.month))
    .map((budget) => {
        const [year, month] = budget.month.split('-').map(Number);
        const formattedMonth = new Date(year, month - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' });
        const percentageSpent = Math.min((budget.spent / budget.amount) * 100, 100);

        return (
            <div key={budget._id} className="budget-item">
                <h3>{formattedMonth}</h3>
                <div className="budget-details">
                    <p>Budget: ${budget.amount.toFixed(2)}</p>
                    <p>Spent: ${budget.spent.toFixed(2)}</p>
                    <p>Remaining: ${budget.remaining.toFixed(2)}</p>
                    <div className="progress-bar-container">
                        <div className="progress-bar">
                            <div className="progress-fill" style={{ width: `${percentageSpent}%` }}></div>
                        </div>
                        <span className="progress-label">{percentageSpent.toFixed(0)}%</span>
                    </div>
                    <button 
                        className="delete-btn"
                        onClick={() => deleteBudget(budget._id)}
                    >
                        Delete
                    </button>
                </div>
            </div>
        );
    })}

                    </div>




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
                                <div className="pie-chart-container">
                                    <h4>Pie Chart of Spendings</h4>
                                    <div style={{ width: '350px', height: '350px', margin: '0 auto' }}>
                                        <Pie data={getPieChartData()} />
                                    </div>
                                </div>

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
