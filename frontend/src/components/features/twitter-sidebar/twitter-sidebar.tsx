import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { 
  FaHome, 
  FaSearch, 
  FaBell, 
  FaEnvelope, 
  FaBookmark, 
  FaListUl, 
  FaUser, 
  FaTwitter 
} from "react-icons/fa";
import { cn } from "#/utils/utils";

interface NavButtonProps {
  icon: React.ReactElement;
  label: string;
  active?: boolean;
  onClick?: () => void;
  testId?: string;
}

/**
 * Twitter-style navigation button with hover animations
 */
const NavButton: React.FC<NavButtonProps> = ({ 
  icon, 
  label, 
  active = false,
  onClick,
  testId
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!buttonRef.current) return;
    
    const button = buttonRef.current;
    const iconElement = iconRef.current;
    
    const handlePointerEnter = () => {
      gsap.to(button, {
        backgroundColor: 'rgba(29, 161, 242, 0.1)',
        duration: 0.2
      });
      
      gsap.to(iconElement, {
        color: '#1DA1F2',
        duration: 0.2
      });
    };
    
    const handlePointerLeave = () => {
      if (!active) {
        gsap.to(button, {
          backgroundColor: 'transparent',
          duration: 0.2
        });
        
        gsap.to(iconElement, {
          color: 'white',
          duration: 0.2
        });
      }
    };
    
    button.addEventListener('pointerenter', handlePointerEnter);
    button.addEventListener('pointerleave', handlePointerLeave);
    
    return () => {
      button.removeEventListener('pointerenter', handlePointerEnter);
      button.removeEventListener('pointerleave', handlePointerLeave);
    };
  }, [active]);
  
  return (
    <button 
      ref={buttonRef}
      className={cn(
        "flex items-center gap-4 w-full px-4 py-3 rounded-full text-white transition-colors",
        active ? "bg-blue-50/10" : "hover:bg-blue-50/10"
      )}
      onClick={onClick}
      data-testid={testId}
    >
      <div 
        ref={iconRef} 
        className={cn(
          "text-xl",
          active ? "text-blue-400" : "text-white"
        )}
      >
        {icon}
      </div>
      <span className="text-lg font-medium">{label}</span>
    </button>
  );
};

/**
 * Twitter sidebar component based on the CodePen example
 * https://codepen.io/aaroniker/pen/rNMWYXb
 * 
 * Adapted for OHS using React Icons
 */
export const TwitterSidebar: React.FC<{
  className?: string;
  onNavItemClick?: (item: string) => void;
}> = ({ 
  className,
  onNavItemClick 
}) => {
  const handleNavClick = (item: string) => {
    if (onNavItemClick) {
      onNavItemClick(item);
    }
  };

  return (
    <aside className={cn(
      "w-72 h-screen bg-black rounded-2xl p-4 flex flex-col",
      className
    )}>
      <div className="p-2 mb-4">
        <div className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-blue-50/10 cursor-pointer">
          <FaTwitter className="text-white" size={28} />
        </div>
      </div>
      
      <nav className="flex flex-col gap-1">
        <NavButton 
          icon={<FaHome size={24} />} 
          label="Home" 
          active 
          onClick={() => handleNavClick('home')}
          testId="twitter-nav-home"
        />
        <NavButton 
          icon={<FaSearch size={24} />} 
          label="Explore" 
          onClick={() => handleNavClick('explore')}
          testId="twitter-nav-explore"
        />
        <NavButton 
          icon={<FaBell size={24} />} 
          label="Notifications" 
          onClick={() => handleNavClick('notifications')}
          testId="twitter-nav-notifications"
        />
        <NavButton 
          icon={<FaEnvelope size={24} />} 
          label="Messages" 
          onClick={() => handleNavClick('messages')}
          testId="twitter-nav-messages"
        />
        <NavButton 
          icon={<FaBookmark size={24} />} 
          label="Bookmarks" 
          onClick={() => handleNavClick('bookmarks')}
          testId="twitter-nav-bookmarks"
        />
        <NavButton 
          icon={<FaListUl size={24} />} 
          label="Lists" 
          onClick={() => handleNavClick('lists')}
          testId="twitter-nav-lists"
        />
        <NavButton 
          icon={<FaUser size={24} />} 
          label="Profile" 
          onClick={() => handleNavClick('profile')}
          testId="twitter-nav-profile"
        />
      </nav>
      
      <div className="mt-auto">
        <button 
          className="w-full bg-blue-400 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-full transition-colors"
          data-testid="twitter-tweet-button"
        >
          Tweet
        </button>
      </div>
    </aside>
  );
};

export default TwitterSidebar;
