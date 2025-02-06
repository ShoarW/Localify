import React from "react";
import { Link, useLocation } from "react-router-dom";

interface NavItemProps {
  icon: React.ReactElement;
  label: string;
  to?: string;
  isActive?: boolean;
  onClick?: () => void;
}

export const NavItem = ({
  icon,
  label,
  to,
  isActive,
  onClick,
}: NavItemProps) => {
  const location = useLocation();
  const isCurrentPath =
    to &&
    (location.pathname === to ||
      (to === "/albums" && location.pathname.startsWith("/albums/")));
  const isActiveState = isActive || isCurrentPath;

  const className = `
    w-full flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer transition-all duration-300 border border-transparent
    ${
      isActiveState
        ? "text-white bg-gradient-to-r from-white/15 to-white/5 backdrop-blur-lg shadow-xl !border-white/10"
        : "text-white/70 hover:text-white hover:bg-white/5"
    }
  `;

  const content = (
    <>
      <div className="w-5 h-5">{icon}</div>
      <span className="font-medium tracking-wide">{label}</span>
    </>
  );

  if (to) {
    return (
      <Link to={to} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={className}>
      {content}
    </button>
  );
};
