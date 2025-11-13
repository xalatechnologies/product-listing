# Pricing Model & Subscription Plans

## Subscription Plans

### Starter — $29/month
- **20 images** per month
- **1 A+ module** per month
- Basic styles (premium, minimal, bold)
- Standard support
- Email support

**Best for:** Individual sellers, small businesses

---

### Professional — $79/month
- **Unlimited images**
- **5 A+ modules** per month
- All styles (premium, minimal, bold, lifestyle, techy, colorful)
- Brand kits (up to 3)
- Priority GPU queue
- Email + chat support

**Best for:** Growing businesses, multiple products

---

### Agency — $299/month
- **Unlimited everything**
- **Unlimited A+ modules**
- Unlimited brand kits
- Bulk generation
- Team workspace (up to 5 users)
- API access
- Priority support
- White-label options

**Best for:** Agencies, design studios, large sellers

---

### Enterprise — $999/month
- Everything in Agency
- **SLA guarantee** (99.9% uptime)
- **Dedicated GPU worker**
- Custom workflows
- On-premise deployment option
- Custom integrations
- Dedicated account manager
- Phone support

**Best for:** Large enterprises, high-volume operations

---

## Pay-As-You-Go (One-Time Purchases)

### Image Packs

| Package | Images | Price |
|---------|--------|-------|
| **Starter Pack** | 5 images | $19 |
| **Full Listing Pack** | 7 images (main + 6 variations) | $29 |
| **Premium Pack** | 10 images + 1 A+ module | $49 |

### A+ Content

| Package | Modules | Price |
|---------|---------|-------|
| **Basic A+** | 3 modules | $39 |
| **Standard A+** | 5 modules | $69 |
| **Premium A+** | 8 modules | $99 |

### Video (Phase 2)

| Package | Duration | Price |
|---------|----------|-------|
| **Short Video** | 6 seconds | $29 |
| **Standard Video** | 10 seconds | $39 |
| **Long Video** | 15 seconds | $59 |

---

## Credit System

### How Credits Work
- Each image generation costs **1 credit**
- Each A+ module costs **2 credits**
- Video generation costs **5 credits** (Phase 2)

### Credit Packages (One-Time Purchase)

| Credits | Price | Bonus | Total Value |
|---------|-------|-------|-------------|
| 10 credits | $19 | - | $19 |
| 25 credits | $39 | +5 | $47.50 |
| 50 credits | $69 | +15 | $103.50 |
| 100 credits | $119 | +40 | $190 |

---

## Comparison Table

| Feature | Starter | Professional | Agency | Enterprise |
|---------|---------|--------------|--------|------------|
| **Monthly Price** | $29 | $79 | $299 | $999 |
| **Images/month** | 20 | Unlimited | Unlimited | Unlimited |
| **A+ Modules/month** | 1 | 5 | Unlimited | Unlimited |
| **Brand Kits** | 1 | 3 | Unlimited | Unlimited |
| **Styles** | Basic | All | All | All |
| **Bulk Generation** | ❌ | ❌ | ✅ | ✅ |
| **API Access** | ❌ | ❌ | ✅ | ✅ |
| **Team Workspace** | ❌ | ❌ | ✅ (5 users) | ✅ (Unlimited) |
| **Priority Queue** | ❌ | ✅ | ✅ | ✅ |
| **Support** | Email | Email + Chat | Priority | Dedicated |
| **SLA** | ❌ | ❌ | ❌ | ✅ |
| **Dedicated GPU** | ❌ | ❌ | ❌ | ✅ |

---

## Free Trial

### Free Tier
- **3 images** (one-time)
- **1 A+ module** (one-time)
- Basic styles only
- Watermarked images
- Community support

**No credit card required**

---

## Upgrade Path

1. **Start Free** → Try 3 images
2. **Pay-As-You-Go** → Buy credits as needed
3. **Subscribe** → Choose plan based on volume
4. **Scale** → Upgrade as business grows

---

## Refund Policy

- **Subscriptions**: Cancel anytime, no refunds for current period
- **One-time purchases**: 7-day money-back guarantee
- **Credits**: Non-refundable, no expiration

---

## Enterprise Custom Pricing

For high-volume needs or custom requirements:
- Contact: enterprise@yourdomain.com
- Minimum commitment: $5,000/month
- Custom SLA and features available

---

## Implementation Notes

### Database Schema
- Subscription plans stored in `Subscription` model
- Credit transactions tracked in `CreditTransaction` model
- Usage limits enforced via middleware

### Stripe Integration
- Subscription plans created in Stripe Dashboard
- Price IDs stored in environment variables
- Webhooks handle subscription lifecycle

### Credit System
- Credits deducted on generation
- Balance checked before operations
- Transaction history available in dashboard

