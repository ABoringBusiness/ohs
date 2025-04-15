import React, { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { BrandButton } from '../settings/brand-button';
import { LoadingSpinner } from '#/components/shared/loading-spinner';
import { cn } from '#/utils/utils';

// Get Stripe publishable key from environment variables
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';

// Initialize Stripe
const stripePromise = loadStripe(stripePublishableKey);

type CheckoutFormProps = {
  clientSecret: string;
  onSuccess: () => void;
  onCancel: () => void;
};

function CheckoutForm({ clientSecret, onSuccess, onCancel }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js hasn't loaded yet
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment/success`,
        },
        redirect: 'if_required',
      });

      if (error) {
        setErrorMessage(error.message || 'An error occurred during payment');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        onSuccess();
      }
    } catch (err) {
      setErrorMessage('An unexpected error occurred');
      console.error('Payment error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full max-w-md">
      <PaymentElement />
      
      {errorMessage && (
        <div className="bg-red-700 p-3 rounded text-white">
          {errorMessage}
        </div>
      )}
      
      <div className="flex gap-4">
        <BrandButton
          variant="primary"
          type="submit"
          isDisabled={!stripe || !elements || isLoading}
          className="flex-1"
        >
          {isLoading ? (
            <>
              <LoadingSpinner size="small" className="mr-2" />
              Processing...
            </>
          ) : (
            'Pay Now'
          )}
        </BrandButton>
        
        <BrandButton
          variant="secondary"
          onClick={onCancel}
          isDisabled={isLoading}
          className="flex-1"
        >
          Cancel
        </BrandButton>
      </div>
    </form>
  );
}

type StripeCheckoutProps = {
  clientSecret: string;
  onSuccess: () => void;
  onCancel: () => void;
};

export function StripeCheckout({ clientSecret, onSuccess, onCancel }: StripeCheckoutProps) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Mark as ready when client secret is available
    if (clientSecret) {
      setIsReady(true);
    }
  }, [clientSecret]);

  if (!isReady) {
    return (
      <div className="flex justify-center items-center p-8">
        <LoadingSpinner size="medium" />
      </div>
    );
  }

  const options = {
    clientSecret,
    appearance: {
      theme: 'night',
      variables: {
        colorPrimary: '#7F7445',
        colorBackground: '#1f2937',
        colorText: '#ffffff',
        colorDanger: '#ef4444',
        fontFamily: 'system-ui, sans-serif',
        borderRadius: '4px',
      },
    },
  };

  return (
    <div className={cn(
      "bg-gray-800 p-6 rounded-lg shadow-lg",
      "w-full max-w-md mx-auto"
    )}>
      <h2 className="text-xl font-bold mb-6 text-center">Complete Your Payment</h2>
      <Elements stripe={stripePromise} options={options}>
        <CheckoutForm 
          clientSecret={clientSecret} 
          onSuccess={onSuccess} 
          onCancel={onCancel} 
        />
      </Elements>
    </div>
  );
}