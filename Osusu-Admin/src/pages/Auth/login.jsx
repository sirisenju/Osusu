import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    // Supabase sign in
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (signInError) {
      // Provide user-friendly error messages
      if (signInError.message.toLowerCase().includes("invalid login credentials")) {
        setError("Incorrect email or password.");
      } else {
        setError(signInError.message);
      }
      setLoading(false);
      return;
    }
    // Check if user exists in admin table
    const { data: admin, error: adminError } = await supabase
      .from("admins")
      .select("role")
      .eq("id", data.user.id)
      .single();
    if (adminError || !admin) {
      setError("Not authorized as admin.");
      setLoading(false);
      return;
    }
    // Pass role to dashboard
    navigate("/dashboard", { state: { role: admin.role } });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form className="bg-white p-8 rounded shadow-md w-full max-w-sm" onSubmit={handleSubmit}>
        <h2 className="text-2xl font-bold mb-6 text-center">Admin Login</h2>
        {error && <div className="mb-4 text-red-500 text-center">{error}</div>}
        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="email">Email</label>
          <Input id="email" type="email" placeholder="Enter your email" required value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 mb-2" htmlFor="password">Password</label>
          <Input id="password" type="password" placeholder="Enter your password" required value={password} onChange={e => setPassword(e.target.value)} />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>{loading ? "Logging in..." : "Login"}</Button>
      </form>
    </div>
  );
}

export default Login;
