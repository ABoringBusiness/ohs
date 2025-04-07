# Stripe Integration for OpenHands

This document provides instructions for setting up Stripe integration with OpenHands for processing payments and subscriptions.

## Prerequisites

1. A Stripe account (you can sign up at [stripe.com](https://stripe.com))
2. Supabase project (as set up in the main PR)

## Setup Steps

### 1. Create a Stripe Account and Get API Keys

1. Sign up for a Stripe account at [stripe.com](https://stripe.com)
2. Go to the Developers > API keys section in your Stripe Dashboard
3. Note down your Publishable Key and Secret Key

### 2. Create Products and Prices in Stripe

1. Go to Products in your Stripe Dashboard
2. Create the following products and prices:
   - Basic Plan: Monthly subscription at $9.99
   - Pro Plan: Monthly subscription at $29.99
   - Enterprise Plan: Monthly subscription at $99.99
3. Note down the Price IDs for each plan

### 3. Set Up Webhook Endpoint

1. Go to Developers > Webhooks in your Stripe Dashboard
2. Add a new endpoint with the URL: `https://your-app-url.com/api/billing/webhook`
3. Select the following events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Note down the Webhook Signing Secret

### 4. Create Database Tables

Run the SQL script in `scripts/create_billing_tables.sql` in your Supabase SQL Editor to create the necessary tables:

```sql
-- See the content of scripts/create_billing_tables.sql
```

### 5. Configure Environment Variables

Add the following environment variables to your application:

```
# Stripe configuration
STRIPE_SECRET_KEY=sk_test_your_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Stripe Price IDs
STRIPE_BASIC_PLAN_PRICE_ID=price_your_basic_plan_id
STRIPE_PRO_PLAN_PRICE_ID=price_your_pro_plan_id
STRIPE_ENTERPRISE_PLAN_PRICE_ID=price_your_enterprise_plan_id

# Frontend URL for redirects
FRONTEND_URL=http://localhost:3000
```

## Testing the Integration

### Testing Payments

1. Use the test credit card number `4242 4242 4242 4242` with any future expiration date and any CVC
2. For testing declined payments, use `4000 0000 0000 0002`

### Testing Webhooks Locally

1. Install the Stripe CLI from [stripe.com/docs/stripe-cli](https://stripe.com/docs/stripe-cli)
2. Run `stripe login` to authenticate
3. Run `stripe listen --forward-to http://localhost:8000/api/billing/webhook` to forward webhook events to your local server

## Implementation Details

### Backend

The backend implementation includes:

1. API routes for creating checkout sessions for one-time payments and subscriptions
2. Webhook handler for processing Stripe events
3. Database operations for tracking user credits and subscriptions

### Frontend

The frontend implementation includes:

1. Payment form for adding credits
2. Subscription plans display and selection
3. Hooks for interacting with the payment API

## Troubleshooting

### Common Issues

1. **Webhook Verification Fails**: Ensure the webhook secret is correctly set in your environment variables
2. **Payment Succeeds but Credits Not Added**: Check the webhook logs to ensure events are being received and processed
3. **Redirect Not Working**: Verify the FRONTEND_URL environment variable is set correctly

### Debugging

1. Use the Stripe Dashboard Events log to see all events and their status
2. Check your application logs for any errors in the webhook handler
3. Use the Stripe CLI to test webhook events locally