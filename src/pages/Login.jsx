import React, { useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const emailRef = useRef();
  const passwordRef = useRef();
  const { login, signup, googleSignIn } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true); // Skifter mellem Login og Opret
  const navigate = useNavigate();

  // Håndter Email/Password submit
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLoginMode) {
        await login(emailRef.current.value, passwordRef.current.value);
      } else {
        await signup(emailRef.current.value, passwordRef.current.value);
      }
      navigate("/"); // Send til Home efter succes
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') setError("Emailen er allerede i brug.");
      else if (err.code === 'auth/weak-password') setError("Kodeordet er for svagt (min. 6 tegn).");
      else if (err.code === 'auth/invalid-credential') setError("Forkert email eller kodeord.");
      else setError("Der skete en fejl. Prøv igen.");
    }
    setLoading(false);
  }

  // Håndter Google Login
  async function handleGoogleLogin() {
    try {
      setError("");
      setLoading(true);
      await googleSignIn();
      navigate("/");
    } catch (err) {
      console.error(err);
      setError("Kunne ikke logge ind med Google.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] text-slate-200 p-6 font-sans">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 p-8 rounded-xl shadow-2xl relative overflow-hidden">
        
        {/* Dekorativ baggrund */}
        <div className="absolute top-0 right-0 p-20 -mr-10 -mt-10 bg-blue-900/10 rounded-full blur-3xl pointer-events-none"></div>

        <h2 className="text-3xl font-serif font-bold text-center mb-2 text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-amber-500 to-blue-500">
          Akton's DnD Tools
        </h2>
        <p className="text-center text-slate-500 text-sm uppercase tracking-widest font-bold mb-8">
          {isLoginMode ? "Welcome Back" : "Join the Party"}
        </p>
        
        {error && <div className="bg-red-900/30 border border-red-500/50 text-red-200 p-3 rounded mb-6 text-sm text-center animate-pulse">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1 ml-1">Email</label>
            <input 
              type="email" 
              ref={emailRef} 
              required 
              className="w-full p-3 bg-slate-950 border border-slate-700 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder-slate-600"
              placeholder="name@example.com"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1 ml-1">Password</label>
            <input 
              type="password" 
              ref={passwordRef} 
              required 
              className="w-full p-3 bg-slate-950 border border-slate-700 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder-slate-600"
              placeholder="••••••••"
            />
          </div>

          <button 
            disabled={loading} 
            type="submit" 
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3 rounded-lg transition-all shadow-lg hover:shadow-blue-900/20 active:scale-95"
          >
            {isLoginMode ? "Log In" : "Create Account"}
          </button>
        </form>

        <div className="flex items-center gap-4 my-6">
          <div className="h-px bg-slate-800 flex-1"></div>
          <span className="text-slate-600 text-xs uppercase font-bold">Or continue with</span>
          <div className="h-px bg-slate-800 flex-1"></div>
        </div>

        <button 
          onClick={handleGoogleLogin} 
          disabled={loading}
          className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold py-3 rounded-lg transition-all shadow flex items-center justify-center gap-3 group"
        >
          <svg className="w-5 h-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          Google
        </button>

        <div className="text-center mt-8 text-sm text-slate-400">
          {isLoginMode ? "New around here? " : "Already have an account? "}
          <button 
            onClick={() => setIsLoginMode(!isLoginMode)} 
            className="text-blue-400 hover:text-blue-300 font-bold hover:underline bg-transparent border-none p-0 cursor-pointer"
          >
            {isLoginMode ? "Create an account" : "Log in"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;