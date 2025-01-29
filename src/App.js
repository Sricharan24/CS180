import React, { useEffect, useState } from 'react';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '';

function App() {
    const [transactions, setTransactions] = useState([]);
    const [budgets, setBudgets] = useState([]);
    const [form, setForm] = useState({ amount: '', category: '', description: '', date: '' });

    // State for report generation
    const [reportForm, setReportForm] = useState({ startDate: '', endDate: '' });
    const [reportData, setReportData] = useState(null);

    useEffect(() => {
        fetchTransactions();
        fetchBudgets();
    }, []);

    const fetchTransactions = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/transactions`);
            const data = await response.json();
            setTransactions(data);
        } catch (error) {
            console.error('Error fetching transactions:', error);
        }
    };

    const fetchBudgets = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/budgets`);
            const data = await response.json();
            setBudgets(data);
        } catch (error) {
            console.error('Error fetching budgets:', error);
        }
    };

    const addTransaction = async () => {
        const transaction = {
            user_id: '123',
            ...form,
        };
    
        try {
            const response = await fetch(`${API_BASE_URL}/transactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(transaction),
            });

            if (response.ok) {
                console.log('Transaction added:', await response.json());
            } else {
                console.error('Error adding transaction:', response.statusText);
            }

            setForm({ amount: '', category: '', description: '', date: '' });
            fetchTransactions();
        } catch (error) {
            console.error('Error adding transaction:', error);
        }
    };

    const deleteTransaction = async (id) => {
        try {
            const response = await fetch(`${API_BASE_URL}/transactions/${id}`, {
                method: 'DELETE',
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

    const fetchReport = async () => {
        try {
            const response = await fetch(
                `${API_BASE_URL}/reports?startDate=${reportForm.startDate}&endDate=${reportForm.endDate}`
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

    return (
        <div>
            <header className="logo-header">
                <img src="/logo.png" alt="FinWise Logo" className="logo" />
            </header>
            <h1>Personal Finance Dashboard</h1>

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
                <button onClick={addTransaction}>Add Transaction</button>
            </section>

            {/* Transactions Section */}
            <section>
                <h2>Transactions</h2>
                <ul>
                    {transactions.map((t) => (
                        <li key={t._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <strong>{new Date(t.date).toLocaleDateString('en-US')}</strong> | ${t.amount} - {t.category} ({t.description})
                            </div>
                            <button
                                style={{ marginLeft: '10px', backgroundColor: 'red', color: 'white', border: 'none', cursor: 'pointer' }}
                                onClick={() => deleteTransaction(t._id)}
                            >
                                Delete
                            </button>
                        </li>
                    ))}
                </ul>
            </section>

            {/* Budgets Section */}
            <section>
                <h2>Budgets</h2>
                <ul>
                    {budgets.map((b) => (
                        <li key={b._id}>
                            {b.category}: ${b.amount} (Ends: {new Date(b.end_date).toLocaleDateString()})
                        </li>
                    ))}
                </ul>
            </section>

            {/* Financial Report Section (With Download Button) */}
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

                        {/* Download Button */}
                        <button onClick={downloadReport} style={{ marginTop: '10px', backgroundColor: '#007bff', color: 'white', padding: '10px', borderRadius: '5px', cursor: 'pointer' }}>
                            Download Report
                        </button>
                    </div>
                )}
            </section>
        </div>
    );
}

export default App;
