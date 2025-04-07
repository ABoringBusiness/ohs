#!/usr/bin/env python3
"""
Script to set up Stripe products and prices for OpenHands subscription plans.
"""

import os
import stripe
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Set your Stripe API key
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

if not stripe.api_key:
    print("Error: STRIPE_SECRET_KEY environment variable not set.")
    print("Please set it in your .env file or environment.")
    exit(1)

# Define the subscription plans
PLANS = [
    {
        "id": "basic",
        "name": "Basic Plan",
        "description": "Perfect for individuals and small projects",
        "price": 9.99,
        "features": [
            "Up to 100 requests per day",
            "Basic support",
            "Access to core features",
        ],
    },
    {
        "id": "pro",
        "name": "Pro Plan",
        "description": "Ideal for professionals and teams",
        "price": 29.99,
        "features": [
            "Unlimited requests",
            "Priority support",
            "Access to all features",
            "Team collaboration",
        ],
    },
    {
        "id": "enterprise",
        "name": "Enterprise Plan",
        "description": "For organizations with advanced needs",
        "price": 99.99,
        "features": [
            "Unlimited requests",
            "24/7 dedicated support",
            "Access to all features",
            "Advanced team collaboration",
            "Custom integrations",
            "Dedicated account manager",
        ],
    },
]


def create_product_and_price(plan):
    """Create a Stripe product and price for a plan."""
    try:
        # Create the product
        product = stripe.Product.create(
            name=plan["name"],
            description=plan["description"],
            metadata={
                "plan_id": plan["id"],
                "features": ", ".join(plan["features"]),
            },
        )
        
        print(f"Created product: {product.name} (ID: {product.id})")
        
        # Create the price
        price = stripe.Price.create(
            product=product.id,
            unit_amount=int(plan["price"] * 100),  # Convert to cents
            currency="usd",
            recurring={"interval": "month"},
            metadata={"plan_id": plan["id"]},
        )
        
        print(f"Created price: ${plan['price']}/month (ID: {price.id})")
        
        # Return the price ID
        return price.id
    except Exception as e:
        print(f"Error creating product and price for {plan['name']}: {str(e)}")
        return None


def main():
    """Main function to set up Stripe products and prices."""
    print("Setting up Stripe products and prices for OpenHands subscription plans...")
    
    # Create products and prices
    price_ids = {}
    for plan in PLANS:
        price_id = create_product_and_price(plan)
        if price_id:
            price_ids[plan["id"]] = price_id
    
    # Print the environment variables to set
    print("\n=== Add these to your .env file ===")
    for plan_id, price_id in price_ids.items():
        env_var = f"STRIPE_{'_'.join(plan_id.upper().split('-'))}_PLAN_PRICE_ID"
        print(f"{env_var}={price_id}")


if __name__ == "__main__":
    main()