import React, { useState } from "react";
import TwitterSidebar from "./twitter-sidebar";

/**
 * Example implementation of the Twitter sidebar component
 */
export const TwitterSidebarExample: React.FC = () => {
  const [activeItem, setActiveItem] = useState<string>('home');

  const handleNavItemClick = (item: string) => {
    setActiveItem(item);
    console.log(`Navigated to: ${item}`);
  };

  return (
    <div className="flex min-h-screen bg-base">
      <TwitterSidebar onNavItemClick={handleNavItemClick} />
      
      <main className="flex-1 p-8">
        <h1 className="text-3xl font-bold text-content mb-4">Twitter Sidebar Example</h1>
        <p className="text-tertiary-light mb-6">
          This is an example implementation of the Twitter sidebar component.
        </p>
        
        <div className="bg-base-secondary rounded-lg p-6">
          <h2 className="text-xl font-semibold text-content mb-3">Active Navigation Item</h2>
          <p className="text-tertiary-light mb-2">
            Currently active: <span className="text-primary font-semibold">{activeItem}</span>
          </p>
          
          <h3 className="text-lg font-semibold text-content mt-6 mb-2">Implementation Details</h3>
          <ul className="list-disc list-inside text-tertiary-light space-y-1 mb-4">
            <li>Tailwind CSS for styling</li>
            <li>GSAP for animations</li>
            <li>React Icons for icons</li>
            <li>Hover animations with color transitions</li>
          </ul>
          
          <p className="text-tertiary-light">
            The sidebar features hover animations and styling that closely matches the original design.
          </p>
        </div>
      </main>
    </div>
  );
};

export default TwitterSidebarExample;
