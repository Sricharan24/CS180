import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function SignUp() {
    const [form, setForm] = useState({ email: '', password: '', confirmPassword: '' });
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (form.password !== form.confirmPassword) {
            console.error('Passwords do not match');
            return;
        }
        try {
            const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: form.email, password: form.password }),
            });
            if (response.ok) {
                navigate('/signin');
            } else {
                console.error('Error signing up:', response.statusText);
            }
        } catch (error) {
            console.error('Error signing up:', error);
        }
    };

    return (
        <div className="auth-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className="logo-container">
                <img src="/FINWISE.png" alt="FinWise Logo" className="logo" />
            </div>
            <h2>Sign Up</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
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
                <input
                    type="password"
                    placeholder="Confirm Password"
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                />
                <button type="submit">Sign Up</button>
            </form>
            <p>Already have an account? <Link to="/signin">Sign In</Link></p>
        </div>
    );
}

export default SignUp;
