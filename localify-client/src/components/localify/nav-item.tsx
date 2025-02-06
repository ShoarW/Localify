import React from "react";
import { Link, useLocation } from "react-router-dom";

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  to?: string;
  isActive?: boolean;
}

export const NavItem = ({ icon, label, to, isActive }: NavItemProps) => {
  const location = useLocation();
  const isCurrentPath = to && location.pathname === to;
  const isActiveState = isActive || isCurrentPath;

  const className = `
    flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer transition-all duration-300
    ${
      isActiveState
        ? "text-white bg-gradient-to-r from-white/15 to-white/5 backdrop-blur-lg shadow-xl border border-white/10"
        : "text-white/70 hover:text-white hover:bg-white/5"
    }
  `;

  const content = (
    <>
      {React.cloneElement(icon as React.ReactElement, { size: 20 })}
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

  return <div className={className}>{content}</div>;
};
