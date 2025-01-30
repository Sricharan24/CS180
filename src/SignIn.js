import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function SignIn() {
    const [form, setForm] = useState({ email: '', password: '' });
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/signin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('token', data.token);
                navigate('/main');
            } else {
                console.error('Error signing in:', response.statusText);
            }
        } catch (error) {
            console.error('Error signing in:', error);
        }
    };

    return (
        <div className="auth-container">
            <h2>Sign In</h2>
            <form onSubmit={handleSubmit}>
                <input
                    type="email"
                    placeholder="Email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
                <button type="submit">Sign In</button>
            </form>
        </div>
    );
}

export default SignIn;
