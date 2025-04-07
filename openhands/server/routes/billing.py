import os
from typing import Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel

import stripe
from openhands.server.auth_supabase import User, get_current_user
from openhands.storage.supabase_client import get_supabase_client

app = APIRouter(prefix="/api/billing")

# Initialize Stripe with the API key from environment variables
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")


class CreateCheckoutSessionRequest(BaseModel):
    """Request model for creating a Stripe checkout session."""
    amount: float


class CreateCheckoutSessionResponse(BaseModel):
    """Response model for creating a Stripe checkout session."""
    redirect_url: str


class SubscriptionPlan(BaseModel):
    """Model for subscription plan."""
    id: str
    name: str
    description: str
    price_id: str
    price: float
    features: List[str]


class SubscriptionPlansResponse(BaseModel):
    """Response model for getting subscription plans."""
    plans: List[SubscriptionPlan]


class CreditsResponse(BaseModel):
    """Response model for getting user credits."""
    credits: str


@app.post("/create-checkout-session", response_model=CreateCheckoutSessionResponse)
async def create_checkout_session(
    request: CreateCheckoutSessionRequest,
    user: User = Depends(get_current_user)
):
    """
    Create a Stripe checkout session for adding credits.
    
    Args:
        request: The checkout session request with amount.
        user: The authenticated user.
        
    Returns:
        The checkout session response with redirect URL.
        
    Raises:
        HTTPException: If creating the checkout session fails.
    """
    try:
        # Create a checkout session
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[
                {
                    "price_data": {
                        "currency": "usd",
                        "product_data": {
                            "name": "OpenHands Credits",
                            "description": "Credits for using OpenHands AI assistant",
                        },
                        "unit_amount": int(request.amount * 100),  # Convert to cents
                    },
                    "quantity": 1,
                },
            ],
            mode="payment",
            success_url=f"{FRONTEND_URL}/billing?success=true",
            cancel_url=f"{FRONTEND_URL}/billing?canceled=true",
            client_reference_id=user.id,  # Store the user ID for reference
            metadata={
                "user_id": user.id,
                "user_email": user.email,
                "amount": str(request.amount),
                "type": "credits",
            },
        )
        
        # Return the checkout session URL
        return CreateCheckoutSessionResponse(redirect_url=checkout_session.url)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create checkout session: {str(e)}",
        )


@app.post("/create-subscription", response_model=CreateCheckoutSessionResponse)
async def create_subscription(
    plan_id: str,
    user: User = Depends(get_current_user)
):
    """
    Create a Stripe checkout session for subscribing to a plan.
    
    Args:
        plan_id: The ID of the plan to subscribe to.
        user: The authenticated user.
        
    Returns:
        The checkout session response with redirect URL.
        
    Raises:
        HTTPException: If creating the subscription fails.
    """
    try:
        # Get the plan details
        plans = get_subscription_plans()
        plan = next((p for p in plans if p.id == plan_id), None)
        
        if not plan:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Plan with ID {plan_id} not found",
            )
        
        # Create a checkout session for subscription
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[
                {
                    "price": plan.price_id,
                    "quantity": 1,
                },
            ],
            mode="subscription",
            success_url=f"{FRONTEND_URL}/billing?success=true",
            cancel_url=f"{FRONTEND_URL}/billing?canceled=true",
            client_reference_id=user.id,  # Store the user ID for reference
            metadata={
                "user_id": user.id,
                "user_email": user.email,
                "plan_id": plan_id,
                "type": "subscription",
            },
        )
        
        # Return the checkout session URL
        return CreateCheckoutSessionResponse(redirect_url=checkout_session.url)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create subscription: {str(e)}",
        )


@app.get("/plans", response_model=SubscriptionPlansResponse)
async def get_plans(user: User = Depends(get_current_user)):
    """
    Get the available subscription plans.
    
    Args:
        user: The authenticated user.
        
    Returns:
        The subscription plans.
    """
    plans = get_subscription_plans()
    return SubscriptionPlansResponse(plans=plans)


@app.get("/credits", response_model=CreditsResponse)
async def get_credits(user: User = Depends(get_current_user)):
    """
    Get the user's current credit balance.
    
    Args:
        user: The authenticated user.
        
    Returns:
        The user's credit balance.
        
    Raises:
        HTTPException: If getting the credits fails.
    """
    try:
        # Get the user's credits from Supabase
        supabase = get_supabase_client()
        response = supabase.table("user_credits").select("credits").eq("user_id", user.id).execute()
        
        # If the user doesn't have a credits record, create one with 0 credits
        if not response.data:
            supabase.table("user_credits").insert({
                "user_id": user.id,
                "credits": "0.00",
            }).execute()
            return CreditsResponse(credits="0.00")
        
        # Return the user's credits
        return CreditsResponse(credits=response.data[0]["credits"])
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get credits: {str(e)}",
        )


@app.post("/webhook")
async def webhook(request: Request):
    """
    Handle Stripe webhook events.
    
    Args:
        request: The FastAPI request object.
        
    Returns:
        A success message.
        
    Raises:
        HTTPException: If handling the webhook fails.
    """
    try:
        # Get the webhook signature and payload
        signature = request.headers.get("stripe-signature")
        payload = await request.body()
        
        # Verify the webhook signature
        try:
            event = stripe.Webhook.construct_event(
                payload, signature, STRIPE_WEBHOOK_SECRET
            )
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid payload: {str(e)}",
            )
        except stripe.error.SignatureVerificationError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid signature: {str(e)}",
            )
        
        # Handle the event
        if event["type"] == "checkout.session.completed":
            session = event["data"]["object"]
            
            # Get the user ID and metadata
            user_id = session.get("client_reference_id")
            metadata = session.get("metadata", {})
            event_type = metadata.get("type")
            
            if not user_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Missing client_reference_id",
                )
            
            # Handle credits purchase
            if event_type == "credits":
                amount = float(metadata.get("amount", "0"))
                await add_credits_to_user(user_id, amount)
            
            # Handle subscription
            elif event_type == "subscription":
                plan_id = metadata.get("plan_id")
                await update_user_subscription(user_id, plan_id)
        
        # Return a success message
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to handle webhook: {str(e)}",
        )


async def add_credits_to_user(user_id: str, amount: float):
    """
    Add credits to a user's account.
    
    Args:
        user_id: The ID of the user.
        amount: The amount of credits to add.
        
    Raises:
        Exception: If adding credits fails.
    """
    try:
        # Get the user's current credits
        supabase = get_supabase_client()
        response = supabase.table("user_credits").select("credits").eq("user_id", user_id).execute()
        
        # Calculate the new credits
        current_credits = float(response.data[0]["credits"]) if response.data else 0
        new_credits = current_credits + amount
        
        # Update or insert the user's credits
        if response.data:
            supabase.table("user_credits").update({
                "credits": str(new_credits),
            }).eq("user_id", user_id).execute()
        else:
            supabase.table("user_credits").insert({
                "user_id": user_id,
                "credits": str(new_credits),
            }).execute()
    except Exception as e:
        raise Exception(f"Failed to add credits: {str(e)}")


async def update_user_subscription(user_id: str, plan_id: str):
    """
    Update a user's subscription.
    
    Args:
        user_id: The ID of the user.
        plan_id: The ID of the plan.
        
    Raises:
        Exception: If updating the subscription fails.
    """
    try:
        # Get the user's current subscription
        supabase = get_supabase_client()
        
        # Update or insert the user's subscription
        response = supabase.table("user_subscriptions").select("*").eq("user_id", user_id).execute()
        
        if response.data:
            supabase.table("user_subscriptions").update({
                "plan_id": plan_id,
                "status": "active",
            }).eq("user_id", user_id).execute()
        else:
            supabase.table("user_subscriptions").insert({
                "user_id": user_id,
                "plan_id": plan_id,
                "status": "active",
            }).execute()
    except Exception as e:
        raise Exception(f"Failed to update subscription: {str(e)}")


def get_subscription_plans() -> List[SubscriptionPlan]:
    """
    Get the available subscription plans.
    
    Returns:
        The subscription plans.
    """
    # Define the subscription plans
    # In a production environment, these would be fetched from Stripe or a database
    return [
        SubscriptionPlan(
            id="basic",
            name="Basic Plan",
            description="Perfect for individuals and small projects",
            price_id=os.getenv("STRIPE_BASIC_PLAN_PRICE_ID", "price_basic"),
            price=9.99,
            features=[
                "Up to 100 requests per day",
                "Basic support",
                "Access to core features",
            ],
        ),
        SubscriptionPlan(
            id="pro",
            name="Pro Plan",
            description="Ideal for professionals and teams",
            price_id=os.getenv("STRIPE_PRO_PLAN_PRICE_ID", "price_pro"),
            price=29.99,
            features=[
                "Unlimited requests",
                "Priority support",
                "Access to all features",
                "Team collaboration",
            ],
        ),
        SubscriptionPlan(
            id="enterprise",
            name="Enterprise Plan",
            description="For organizations with advanced needs",
            price_id=os.getenv("STRIPE_ENTERPRISE_PLAN_PRICE_ID", "price_enterprise"),
            price=99.99,
            features=[
                "Unlimited requests",
                "24/7 dedicated support",
                "Access to all features",
                "Advanced team collaboration",
                "Custom integrations",
                "Dedicated account manager",
            ],
        ),
    ]