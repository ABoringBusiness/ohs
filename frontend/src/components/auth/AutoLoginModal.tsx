import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/auth-context";
import { AuthModal } from "./AuthModal";

interface AutoLoginModalProps {
  // Time in milliseconds to wait before showing the modal
  delay?: number;
}

export function AutoLoginModal({ delay = 1000 }: AutoLoginModalProps) {
  const { isAuthenticated } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [hasShownModal, setHasShownModal] = useState(false);

  useEffect(() => {
    // If the user is already authenticated, don't show the modal
    if (isAuthenticated) {
      return;
    }

    // If we've already shown the modal once, don't show it again
    if (hasShownModal) {
      return;
    }

    // Show the modal after the specified delay
    const timer = setTimeout(() => {
      setShowModal(true);
      setHasShownModal(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [isAuthenticated, delay, hasShownModal]);

  const handleCloseModal = () => {
    setShowModal(false);
  };

  return (
    <AuthModal isOpen={showModal} onClose={handleCloseModal} />
  );
}