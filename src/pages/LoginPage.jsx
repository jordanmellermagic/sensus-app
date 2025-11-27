import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../authContext.jsx';

export default function LoginPage() {
  const navigate = useNavigate();
  const { setToken } = useAuth();

  function login() {
    // TODO: replace with real login later
    setToken('x');
    navigate('/dashboard');
  }

  return (
    <div className="h-screen bg-black flex items-center justify-center text-white">
      <div className="bg-neutral-900 p-6 rounded-lg shadow-lg w-80 text-center">
        <h1 className="text-xl mb-4">Login</h1>

        <input
          type="email"
          placeholder="Email"
          className="w-full mb-3 p-2 rounded bg-neutral-800 text-white"
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full mb-3 p-2 rounded bg-neutral-800 text-white"
        />

        <button
          onClick={login}
          className="w-full bg-blue-600 hover:bg-blue-700 p-2 rounded mt-2"
        >
          Login
        </button>
      </div>
    </div>
  );
}
