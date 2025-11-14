# Subscription System Overview

## Current Subscription Plans

The application has **4 subscription tiers**:

### 1. FREE Plan
- **Price**: $0/month
- **Credits**: 0 credits per month
- **Features**: 
  - Basic access to the platform
  - No image generation credits included
  - Must purchase credits separately

### 2. STARTER Plan
- **Price**: $29/month
- **Credits**: 10 credits per month
- **Features**:
  - 10 credits per month
  - Basic image generation
  - 1 A+ module per month
  - Email support
  - Standard styles

### 3. PROFESSIONAL Plan
- **Price**: $79/month
- **Credits**: 50 credits per month
- **Features**:
  - 50 credits per month
  - Unlimited image generation
  - 5 A+ modules per month
  - Priority support
  - All styles & templates
  - Up to 3 brand kits
- **Popular**: Yes (marked as recommended)

### 4. AGENCY Plan
- **Price**: $299/month
- **Credits**: Unlimited (999,999 credits)
- **Features**:
  - Unlimited credits
  - Unlimited everything
  - Unlimited A+ modules
  - Unlimited brand kits
  - Bulk generation
  - API access
  - Priority GPU queue
  - Team workspace (5 users)

## Credit System

- **Credits are used for**: Image generation, A+ content generation
- **Credits are allocated**: Monthly based on subscription plan
- **Credits can be purchased**: Pay-as-you-go option available
- **Credit types**:
  - `SUBSCRIPTION`: Monthly allocation from plan
  - `PURCHASE`: One-time credit purchase
  - `USAGE`: Deducted when generating images/content
  - `REFUND`: Credits refunded

## Test Users (From Seed Data)

When you run `npm run seed:test`, it creates:

### Test User 1
- **Email**: `test-user-1@example.com`
- **Name**: Test User 1
- **Subscription**: STARTER Plan (Active)
- **Credits**: 10 credits
- **Projects**: 2 projects (1 Draft, 1 Completed)
- **Brand Kits**: 2 brand kits

### Test User 2
- **Email**: `test-user-2@example.com`
- **Name**: Test User 2
- **Subscription**: FREE Plan (no subscription record)
- **Credits**: 5 credits (from purchase)
- **Projects**: 1 project (Draft)

### Test User 3
- **Email**: `test-user-3@example.com`
- **Name**: Test User 3 (Professional)
- **Subscription**: PROFESSIONAL Plan (Active)
- **Credits**: 48 credits (50 allocated, 2 used)
- **Projects**: 1 project (Completed with images and A+ content)
- **Exports**: 2 export records

## Current Issue: New User Signup

**Problem**: When users sign up via `/auth/signup`, they don't automatically get:
1. A FREE subscription record
2. Any initial credits
3. A welcome credit allocation

**Solution Needed**: Create a function that automatically:
1. Creates a FREE subscription for new users
2. Optionally gives welcome credits (e.g., 5 credits for trying the platform)
3. Runs after user registration is complete

## Subscription Management

- **Stripe Integration**: Fully integrated for payment processing
- **Webhook Handler**: `/api/webhooks/stripe` handles subscription events
- **Monthly Credits**: Automatically allocated via database function or webhook
- **Subscription Status**: ACTIVE, CANCELED, PAST_DUE, TRIALING

## How to Test

1. **Seed test data**: `npm run seed:test`
2. **View subscriptions**: Check `/billing` page (requires authentication)
3. **Create subscription**: Use `/pricing` page to subscribe via Stripe
4. **Check credits**: View credit balance on dashboard or billing page

