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

export const getUser = (): {
  id: number;
  username: string;
  isAdmin: boolean;
} | null => {
  const token = localStorage.getItem("token");
  if (!token) return null;

  const decoded = decodeToken(token);
  if (!decoded) return null;

  // Check if token is expired
  const currentTime = Math.floor(Date.now() / 1000);
  if (decoded.exp && decoded.exp < currentTime) {
    localStorage.removeItem("token");
    return null;
  }

  return {
    id: decoded.sub,
    username: decoded.username,
    isAdmin: decoded.role === "admin",
  };
};
