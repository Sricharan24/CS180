import React, { useEffect, useState } from 'react';

function App() {
    const [transactions, setTransactions] = useState([]);
    const [budgets, setBudgets] = useState([]);
    const [form, setForm] = useState({ amount: '', category: '', description: '' });

    useEffect(() => {
        fetchTransactions();
        fetchBudgets();
    }, []);

    const fetchTransactions = async () => {
        const response = await fetch('http://localhost:5001/transactions');
        const data = await response.json();
        setTransactions(data);
    };

    const fetchBudgets = async () => {
        const response = await fetch('http://localhost:5001/budgets');
        const data = await response.json();
        setBudgets(data);
    };

    const addTransaction = async () => {
        const transaction = {
            user_id: '123', // Mock user ID for now
            ...form,
        };
    
        try {
            const response = await fetch('http://localhost:5001/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(transaction),
            });
    
            if (response.ok) {
                console.log('Transaction added:', await response.json());
            } else {
                console.error('Error adding transaction:', response.statusText);
            }
    
            setForm({ amount: '', category: '', description: '' });
            fetchTransactions();
        } catch (error) {
            console.error('Error adding transaction:', error);
        }
    };
    

    return (
        <div>
            <h1>Personal Finance Dashboard</h1>
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
                <button onClick={addTransaction}>Add Transaction</button>
            </section>
            <section>
                <h2>Transactions</h2>
                <ul>
                    {transactions.map((t) => (
                        <li key={t._id}>
                            ${t.amount} - {t.category} ({t.description})
                        </li>
                    ))}
                </ul>
            </section>
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
        </div>
    );
}

export default App;
