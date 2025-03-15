import { useEffect, useState } from "react";
import { MdOutlineDarkMode, MdOutlineLightMode } from "react-icons/md";

interface ThemeToggleProps {
  label?: string;
  isExpanded?: boolean;
}

export default function ThemeToggle({ label, isExpanded }: ThemeToggleProps) {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Check localStorage for saved theme
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  useEffect(() => {
    // Update class and localStorage when darkMode changes
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  return (
    <button
      type="button"
      onClick={() => setDarkMode(!darkMode)}
      className={`flex items-center w-full ${!isExpanded ? "justify-center" : ""}`}
    >
      <div className="flex items-center">
        {darkMode ? (
          <MdOutlineLightMode size={24} />
        ) : (
          <MdOutlineDarkMode size={24} />
        )}
        {label && <span className="ml-2">{label}</span>}
      </div>
    </button>
  );
}
