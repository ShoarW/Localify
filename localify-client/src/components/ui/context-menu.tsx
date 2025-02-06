import { useEffect, useRef, useState } from "react";
import { ChevronRight } from "lucide-react";

interface MenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  items?: MenuItem[];
}

interface ContextMenuProps {
  children: React.ReactNode;
  items: MenuItem[];
  align?: "left" | "right";
}

export const ContextMenu = ({
  children,
  items,
  align = "right",
}: ContextMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSubMenu, setActiveSubMenu] = useState<number | null>(null);
  const [subMenuPosition, setSubMenuPosition] = useState<"left" | "right">(
    "right"
  );
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        !menuRef.current?.contains(event.target as Node) &&
        !triggerRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setActiveSubMenu(null);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(!isOpen);
    setActiveSubMenu(null);
  };

  const handleItemClick = (
    e: React.MouseEvent,
    item: MenuItem,
    index: number
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (item.items) {
      // Check available space when opening submenu
      if (menuRef.current) {
        const menuRect = menuRef.current.getBoundingClientRect();
        const spaceOnRight = window.innerWidth - menuRect.right;
        setSubMenuPosition(spaceOnRight > 250 ? "right" : "left");
      }
      setActiveSubMenu(activeSubMenu === index ? null : index);
    } else {
      item.onClick?.(e);
      setIsOpen(false);
      setActiveSubMenu(null);
    }
  };

  return (
    <div className="relative">
      <div ref={triggerRef} onClick={handleTriggerClick}>
        {children}
      </div>
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-[49] pointer-events-auto"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsOpen(false);
              setActiveSubMenu(null);
            }}
          />
          <div
            ref={menuRef}
            className={`absolute z-50 ${
              align === "right" ? "right-0" : "left-0"
            } mt-2 w-56 bg-gradient-to-b from-black/90 to-black/80 backdrop-blur-xl rounded-xl shadow-2xl border border-white/10 py-1 pointer-events-auto`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            {items.map((item, index) => (
              <div key={index} className="relative">
                <button
                  onClick={(e) => handleItemClick(e, item, index)}
                  className="w-full px-4 py-2 text-sm text-white hover:bg-white/5 flex items-center justify-between group transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {item.icon && (
                      <div className="text-white/60">{item.icon}</div>
                    )}
                    <span>{item.label}</span>
                  </div>
                  {item.items && (
                    <ChevronRight
                      className={`w-4 h-4 text-white/40 group-hover:text-white transition-transform ${
                        subMenuPosition === "left" ? "rotate-180" : ""
                      }`}
                    />
                  )}
                </button>
                {item.items && activeSubMenu === index && (
                  <div
                    className={`absolute top-0 ${
                      subMenuPosition === "right"
                        ? "left-full ml-2"
                        : "right-full mr-2"
                    } w-56 bg-gradient-to-b from-black/90 to-black/80 backdrop-blur-xl rounded-xl shadow-2xl border border-white/10 py-1 pointer-events-auto`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                  >
                    {item.items.map((subItem, subIndex) => (
                      <button
                        key={subIndex}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          subItem.onClick?.(e);
                          setIsOpen(false);
                          setActiveSubMenu(null);
                        }}
                        className="w-full px-4 py-2 text-sm text-white hover:bg-white/5 flex items-center gap-2 transition-colors"
                      >
                        {subItem.icon && (
                          <div className="text-white/60">{subItem.icon}</div>
                        )}
                        <span className="truncate">{subItem.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
