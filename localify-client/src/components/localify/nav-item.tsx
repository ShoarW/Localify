import React from "react";

export const NavItem = ({ icon, label, isActive = false }) => (
  <div
    className={`
      flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer transition-all duration-300
      ${
        isActive
          ? "text-white bg-gradient-to-r from-white/15 to-white/5 backdrop-blur-lg shadow-xl border border-white/10"
          : "text-white/70 hover:text-white hover:bg-white/5"
      }
    `}
  >
    {React.cloneElement(icon, { size: 20 })}
    <span className="font-medium tracking-wide">{label}</span>
  </div>
);
