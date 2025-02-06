import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import { Music } from "lucide-react";

export const LoginPage = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await api.login({ username, password });
      localStorage.setItem("token", response.token);
      navigate("/");
    } catch (error) {
      setError("Invalid username or password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="p-2 rounded-xl bg-gradient-to-br from-red-500 to-rose-600">
            <Music className="w-6 h-6 text-white" />
          </div>
          <span className="text-white text-2xl font-bold tracking-wider">
            Localify
          </span>
        </div>

        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-6">Sign In</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-white/60 mb-2">
                Username
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-white/10 border border-white/10 text-white focus:outline-none focus:border-red-500 transition-colors"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-white/60 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-white/10 border border-white/10 text-white focus:outline-none focus:border-red-500 transition-colors"
                required
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm bg-red-500/10 p-3 rounded-xl">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto" />
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-white/60">
            Don't have an account?{" "}
            <Link
              to="/auth/register"
              className="text-red-500 hover:text-red-400 transition-colors"
            >
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
