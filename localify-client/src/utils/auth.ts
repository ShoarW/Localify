interface DecodedToken {
  sub: number;
  username: string;
  role: string;
  exp: number;
}

export const decodeToken = (token: string): DecodedToken | null => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );

    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
};

export const isTokenExpired = (token: string): boolean => {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return true;

  const currentTime = Math.floor(Date.now() / 1000);
  return decoded.exp < currentTime;
};

export const clearAuth = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  // Redirect to login page
  window.location.href = "/login";
};

export const validateToken = async (): Promise<boolean> => {
  const accessToken = localStorage.getItem("token");
  const refreshToken = localStorage.getItem("refreshToken");

  // If no tokens exist, clear auth and redirect
  if (!accessToken || !refreshToken) {
    clearAuth();
    return false;
  }

  // If access token is still valid, return true
  if (!isTokenExpired(accessToken)) {
    return true;
  }

  // If refresh token is expired, clear auth and redirect
  if (isTokenExpired(refreshToken)) {
    clearAuth();
    return false;
  }

  // Try to refresh the access token
  try {
    const response = await fetch(
      import.meta.env.VITE_API_URL + "/auth/refresh",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${refreshToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to refresh token");
    }

    const data = await response.json();
    localStorage.setItem("token", data.accessToken);
    return true;
  } catch (error) {
    console.error("Error refreshing token:", error);
    clearAuth();
    return false;
  }
};

export const getUser = async (): Promise<{
  id: number;
  username: string;
  isAdmin: boolean;
} | null> => {
  // Validate token before proceeding
  const isValid = await validateToken();
  if (!isValid) return null;

  const token = localStorage.getItem("token");
  if (!token) return null;

  const decoded = decodeToken(token);
  if (!decoded) return null;

  return {
    id: decoded.sub,
    username: decoded.username,
    isAdmin: decoded.role === "admin",
  };
};
