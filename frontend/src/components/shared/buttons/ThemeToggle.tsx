import { useEffect, useState } from "react";
import { MdOutlineDarkMode, MdOutlineLightMode } from "react-icons/md";
import { TooltipButton } from "./tooltip-button";

interface ThemeToggleProps {
  label?: string;
}

export default function ThemeToggle({ label }: ThemeToggleProps) {
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
    <div className="flex items-center">
      <TooltipButton
        testId="Toggle Theme"
        tooltip="Toggle Theme"
        ariaLabel="Toggle Theme"
        onClick={() => setDarkMode(!darkMode)}
      >
        <div className="flex items-center">
          {darkMode ? (
            <MdOutlineLightMode size={24} />
          ) : (
            <MdOutlineDarkMode size={24} fill="#9099ac" />
          )}
          {label && <span className="ml-2">{label}</span>}
        </div>
      </TooltipButton>
    </div>
  );
}
