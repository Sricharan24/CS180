import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function SignIn() {
    const [form, setForm] = useState({ email: '', password: '' });
    const [errorMessage, setErrorMessage] = useState('');
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
                const errorData = await response.json();
                setErrorMessage(errorData.message || 'Incorrect Password');
            }
        } catch (error) {
            setErrorMessage('Incorrect Password');
            console.error('Incorrect Password:', error);
        }
    };

    return (
        <div className="auth-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className="logo-container">
                <img src="/FINWISE.png" alt="FinWise Logo" className="logo" />
            </div>
            <h2>Sign In</h2>
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
                <button type="submit">Sign In</button>
            </form>
            {errorMessage && <p className="error-message">{errorMessage}</p>}
            <p>Don't have an account? <Link to="/signup">Sign Up</Link></p>
        </div>
    );
}

export default SignIn;
