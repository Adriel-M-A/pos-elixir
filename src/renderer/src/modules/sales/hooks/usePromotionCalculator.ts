import { useMemo } from 'react'
import type { Promotion } from '@types'
import { useSales } from './useSales'

export interface EligiblePromotion {
    promotion: Promotion
    discountAmount: number
}

export function usePromotionCalculator(promotions: Promotion[]) {
    const { cart, subtotal } = useSales()

    const getPromotionBlocks = (promotion: Promotion, currentCart: typeof cart) => {
        if (!promotion.products || promotion.products.length === 0) return 0

        const blocks = promotion.products.map((req) => {
            const item = currentCart.find((c) => c.productId === req.productId)
            if (!item) return 0

            // If product is sold by WEIGHT, the cart quantity is in KG (e.g. 0.25).
            // The promotion requirement is in GRAMS (e.g. 250).
            // Convert cart quantity to grams for comparison.
            const cartQty = item.productType === 'WEIGHT'
                ? Math.round(item.quantity * 1000)
                : item.quantity

            if (cartQty < req.requiredQty) return 0
            return Math.floor(cartQty / req.requiredQty)
        })

        if (blocks.some((count) => count === 0)) return 0

        return Math.min(...blocks)
    }

    const meetsProductRequirements = (promotion: Promotion, currentCart: typeof cart) => {
        return getPromotionBlocks(promotion, currentCart) > 0
    }

    const calculateEligibleSubtotal = (promotion: Promotion, currentCart: typeof cart) => {
        if (!promotion.products?.length) return 0

        const blocks = getPromotionBlocks(promotion, currentCart)
        if (blocks === 0) return 0

        return promotion.products.reduce((sum, req) => {
            const item = currentCart.find((c) => c.productId === req.productId)
            if (!item) return sum

            // Convert Cart Qty (kg) to Grams if WEIGHT type, or keep UNIT
            // (Commented out: unused variable cartQty, logic handled by `blocks` and `requiredQty`)
            // const cartQty = item.productType === 'WEIGHT'
            //    ? Math.round(item.quantity * 1000)
            //    : item.quantity

            // "blocks" logic already handled how many times promo applies.
            // But we need the value of the items contributing to the promo.
            // If Discount is PERCENTAGE, we need (UnitPrice * RequiredQty * Blocks).

            // Wait: Unit Price is per KG. RequiredQty is in Grams (e.g. 250).
            // If I buy 250g (0.25kg) at $20,000/kg.
            // Subtotal = $5,000.
            // Promo says "Buy 250g(req), get 10% off".
            // Eligible Subtotal should be $5,000.

            // Formula: UnitPrice * (RequiredQty / 1000 if Weight) * Blocks?
            // Or simpler: The cost of 'RequiredQty' amount of product.

            let quantityForCost = req.requiredQty * blocks
            if (item.productType === 'WEIGHT') {
                quantityForCost = quantityForCost / 1000 // Convert back to KG for price calc
            }

            return sum + item.unitPrice * quantityForCost
        }, 0)
    }

    const calculateDiscount = (promotion: Promotion, currentCart: typeof cart) => {
        const blocks = getPromotionBlocks(promotion, currentCart)
        if (blocks === 0) return 0

        const eligibleSubtotal = calculateEligibleSubtotal(promotion, currentCart)
        if (eligibleSubtotal <= 0) return 0

        if (promotion.discountType === 'PERCENTAGE') {
            return Math.min((eligibleSubtotal * promotion.discountValue) / 100, eligibleSubtotal)
        }

        return Math.min(promotion.discountValue * blocks, eligibleSubtotal)
    }

    const eligiblePromotions = useMemo<EligiblePromotion[]>(() => {
        if (!cart.length || subtotal <= 0) return []

        return promotions
            .filter((promo) => promo.isActive && promo.products && promo.products.length > 0)
            .map((promo) => {
                if (!meetsProductRequirements(promo, cart)) return null
                const discountAmount = calculateDiscount(promo, cart)
                if (discountAmount <= 0) return null
                return { promotion: promo, discountAmount }
            })
            .filter((entry): entry is EligiblePromotion => Boolean(entry))
    }, [promotions, cart, subtotal])

    return {
        eligiblePromotions,
        calculateDiscount,
        meetsProductRequirements
    }
}
