import React, { createContext, useContext, useState, useEffect } from "react";

interface ThemeContextType {
  primaryColor: string;
  setPrimaryColor: (color: string) => void;
  primaryColorClass: string;
  secondaryColor: string;
  gradientFrom: string;
  gradientTo: string;
}

const DEFAULT_PRIMARY_COLOR = "red";
const STORAGE_KEY = "localify_theme";

export const colorMap: Record<
  string,
  {
    primary: string;
    secondary: string;
    gradientFrom: string;
    gradientTo: string;
    color: string;
    secondaryColor: string;
  }
> = {
  red: {
    primary: "red",
    secondary: "rose",
    gradientFrom: "from-red-500",
    gradientTo: "to-rose-600",
    color: "#ef4444",
    secondaryColor: "#e11d48",
  },
  blue: {
    primary: "blue",
    secondary: "indigo",
    gradientFrom: "from-blue-500",
    gradientTo: "to-indigo-600",
    color: "#3b82f6",
    secondaryColor: "#4f46e5",
  },
  green: {
    primary: "green",
    secondary: "emerald",
    gradientFrom: "from-green-500",
    gradientTo: "to-emerald-600",
    color: "#22c55e",
    secondaryColor: "#059669",
  },
  purple: {
    primary: "purple",
    secondary: "fuchsia",
    gradientFrom: "from-purple-500",
    gradientTo: "to-fuchsia-600",
    color: "#a855f7",
    secondaryColor: "#c026d3",
  },
  orange: {
    primary: "orange",
    secondary: "amber",
    gradientFrom: "from-orange-500",
    gradientTo: "to-amber-600",
    color: "#f97316",
    secondaryColor: "#d97706",
  },
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [primaryColor, setPrimaryColor] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved && colorMap[saved] ? saved : DEFAULT_PRIMARY_COLOR;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, primaryColor);
  }, [primaryColor]);

  const colorConfig = colorMap[primaryColor];

  const value: ThemeContextType = {
    primaryColor,
    setPrimaryColor,
    primaryColorClass: `${colorConfig.primary}-500`,
    secondaryColor: `${colorConfig.secondary}-600`,
    gradientFrom: colorConfig.gradientFrom,
    gradientTo: colorConfig.gradientTo,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

// Helper function to get dynamic color classes
export const getColorClasses = (
  type: "bg" | "text" | "border" | "fill",
  hover = false
) => {
  const { primaryColor } = useTheme();
  const colorConfig = colorMap[primaryColor];

  switch (type) {
    case "bg":
      return hover
        ? `hover:bg-${colorConfig.primary}-500`
        : `bg-${colorConfig.primary}-500`;
    case "text":
      return hover
        ? `hover:text-${colorConfig.primary}-500`
        : `text-${colorConfig.primary}-500`;
    case "border":
      return hover
        ? `hover:border-${colorConfig.primary}-500`
        : `border-${colorConfig.primary}-500`;
    case "fill":
      return hover
        ? `hover:fill-${colorConfig.primary}-500`
        : `fill-${colorConfig.primary}-500`;
    default:
      return "";
  }
};

// Helper function to get gradient classes
export const getGradientClasses = () => {
  const { gradientFrom, gradientTo } = useTheme();
  return `${gradientFrom} ${gradientTo}`;
};
