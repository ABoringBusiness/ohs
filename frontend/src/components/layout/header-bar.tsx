import React from "react";

function HeaderBar(): JSX.Element {
  return (
    <header className="flex items-center justify-between p-4  shadow-md w-full border-b-1 border-b-gray-400 bg-white dark:bg-black">
      <div className="font-bold text-xl">LOGO</div>
      <nav className="flex space-x-4">
        <a
          href="/"
          className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
        >
          Products
        </a>
        <a
          href="/"
          className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
        >
          Solutions
        </a>
        <a
          href="/"
          className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
        >
          Resources
        </a>
        <a
          href="/"
          className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
        >
          Pricing
        </a>
      </nav>
      <div className="flex items-center space-x-4">
        <button
          type="button"
          className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
        >
          Sign In
        </button>
        <button
          type="button"
          className="bg-gradient-to-r from-red-500 to-yellow-500 text-white px-4 py-2 rounded"
        >
          Get Started
        </button>
      </div>
    </header>
  );
}

export default HeaderBar;
