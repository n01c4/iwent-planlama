import { prisma } from '../../../shared/database/index.js';
import { NotFoundError, ForbiddenError, ConflictError } from '../../../shared/utils/errors.js';
import type {
  CreateDiscountCodeInput,
  UpdateDiscountCodeInput,
  CreatePricingRuleInput,
  UpdatePricingRuleInput,
} from './pricing.schema.js';

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export interface DiscountCodeResponse {
  id: string;
  code: string;
  type: string;
  value: number;
  maxUses: number | null;
  usedCount: number;
  minPurchaseAmount: number | null;
  maxDiscountAmount: number | null;
  expiresAt: Date | null;
  isActive: boolean;
  createdAt: Date;
}

export interface PricingRuleResponse {
  id: string;
  name: string;
  description: string | null;
  ruleType: string;
  conditions: any;
  adjustmentType: string;
  adjustmentValue: number;
  validFrom: Date | null;
  validUntil: Date | null;
  priority: number;
  isActive: boolean;
  createdAt: Date;
}

// ============================================================================
// SERVICE
// ============================================================================

class PricingService {
  // --------------------------------------------------------------------------
  // DISCOUNT CODES
  // --------------------------------------------------------------------------

  /**
   * Get discount codes for an event
   */
  async getDiscountCodes(organizerId: string, eventId: string): Promise<DiscountCodeResponse[]> {
    // Verify event belongs to organizer
    const event = await prisma.event.findFirst({
      where: { id: eventId, organizerId, deletedAt: null },
      select: { id: true },
    });

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    const codes = await prisma.discountCode.findMany({
      where: { eventId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        code: true,
        type: true,
        value: true,
        maxUses: true,
        usedCount: true,
        minPurchaseAmount: true,
        maxDiscountAmount: true,
        expiresAt: true,
        isActive: true,
        createdAt: true,
      },
    });

    return codes.map(code => ({
      ...code,
      value: Number(code.value),
      minPurchaseAmount: code.minPurchaseAmount ? Number(code.minPurchaseAmount) : null,
      maxDiscountAmount: code.maxDiscountAmount ? Number(code.maxDiscountAmount) : null,
    }));
  }

  /**
   * Create a discount code
   */
  async createDiscountCode(
    organizerId: string,
    eventId: string,
    data: CreateDiscountCodeInput
  ): Promise<DiscountCodeResponse> {
    // Verify event belongs to organizer
    const event = await prisma.event.findFirst({
      where: { id: eventId, organizerId, deletedAt: null },
      select: { id: true },
    });

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    // Check for duplicate code
    const existing = await prisma.discountCode.findUnique({
      where: { eventId_code: { eventId, code: data.code } },
    });

    if (existing) {
      throw new ConflictError('Discount code already exists for this event');
    }

    // Validate percentage value
    if (data.type === 'percentage' && data.value > 100) {
      throw new ForbiddenError('Percentage discount cannot exceed 100%');
    }

    const discountCode = await prisma.discountCode.create({
      data: {
        eventId,
        code: data.code,
        type: data.type,
        value: data.value,
        maxUses: data.maxUses,
        minPurchaseAmount: data.minPurchaseAmount,
        maxDiscountAmount: data.maxDiscountAmount,
        expiresAt: data.expiresAt,
        isActive: data.isActive,
      },
      select: {
        id: true,
        code: true,
        type: true,
        value: true,
        maxUses: true,
        usedCount: true,
        minPurchaseAmount: true,
        maxDiscountAmount: true,
        expiresAt: true,
        isActive: true,
        createdAt: true,
      },
    });

    return {
      ...discountCode,
      value: Number(discountCode.value),
      minPurchaseAmount: discountCode.minPurchaseAmount ? Number(discountCode.minPurchaseAmount) : null,
      maxDiscountAmount: discountCode.maxDiscountAmount ? Number(discountCode.maxDiscountAmount) : null,
    };
  }

  /**
   * Update a discount code
   */
  async updateDiscountCode(
    organizerId: string,
    eventId: string,
    codeId: string,
    data: UpdateDiscountCodeInput
  ): Promise<DiscountCodeResponse> {
    // Verify discount code belongs to organizer's event
    const discountCode = await prisma.discountCode.findUnique({
      where: { id: codeId },
      include: { event: { select: { organizerId: true } } },
    });

    if (!discountCode) {
      throw new NotFoundError('Discount code not found');
    }

    if (discountCode.event.organizerId !== organizerId || discountCode.eventId !== eventId) {
      throw new ForbiddenError('You do not have permission to update this discount code');
    }

    const updated = await prisma.discountCode.update({
      where: { id: codeId },
      data: {
        maxUses: data.maxUses,
        minPurchaseAmount: data.minPurchaseAmount,
        maxDiscountAmount: data.maxDiscountAmount,
        expiresAt: data.expiresAt,
        isActive: data.isActive,
      },
      select: {
        id: true,
        code: true,
        type: true,
        value: true,
        maxUses: true,
        usedCount: true,
        minPurchaseAmount: true,
        maxDiscountAmount: true,
        expiresAt: true,
        isActive: true,
        createdAt: true,
      },
    });

    return {
      ...updated,
      value: Number(updated.value),
      minPurchaseAmount: updated.minPurchaseAmount ? Number(updated.minPurchaseAmount) : null,
      maxDiscountAmount: updated.maxDiscountAmount ? Number(updated.maxDiscountAmount) : null,
    };
  }

  /**
   * Delete a discount code
   */
  async deleteDiscountCode(organizerId: string, eventId: string, codeId: string): Promise<void> {
    const discountCode = await prisma.discountCode.findUnique({
      where: { id: codeId },
      include: { event: { select: { organizerId: true } } },
    });

    if (!discountCode) {
      throw new NotFoundError('Discount code not found');
    }

    if (discountCode.event.organizerId !== organizerId || discountCode.eventId !== eventId) {
      throw new ForbiddenError('You do not have permission to delete this discount code');
    }

    if (discountCode.usedCount > 0) {
      throw new ForbiddenError('Cannot delete discount code that has been used');
    }

    await prisma.discountCode.delete({ where: { id: codeId } });
  }

  // --------------------------------------------------------------------------
  // PRICING RULES
  // --------------------------------------------------------------------------

  /**
   * Get pricing rules for an event
   */
  async getPricingRules(organizerId: string, eventId: string): Promise<PricingRuleResponse[]> {
    // Verify event belongs to organizer
    const event = await prisma.event.findFirst({
      where: { id: eventId, organizerId, deletedAt: null },
      select: { id: true },
    });

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    const rules = await prisma.pricingRule.findMany({
      where: { eventId },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        name: true,
        description: true,
        ruleType: true,
        conditions: true,
        adjustmentType: true,
        adjustmentValue: true,
        validFrom: true,
        validUntil: true,
        priority: true,
        isActive: true,
        createdAt: true,
      },
    });

    return rules.map(rule => ({
      ...rule,
      adjustmentValue: Number(rule.adjustmentValue),
    }));
  }

  /**
   * Create a pricing rule
   */
  async createPricingRule(
    organizerId: string,
    eventId: string,
    data: CreatePricingRuleInput
  ): Promise<PricingRuleResponse> {
    // Verify event belongs to organizer
    const event = await prisma.event.findFirst({
      where: { id: eventId, organizerId, deletedAt: null },
      select: { id: true },
    });

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    // Validate percentage value
    if (data.adjustmentType === 'percentage' && data.adjustmentValue > 100) {
      throw new ForbiddenError('Percentage adjustment cannot exceed 100%');
    }

    const rule = await prisma.pricingRule.create({
      data: {
        eventId,
        name: data.name,
        description: data.description,
        ruleType: data.ruleType,
        conditions: data.conditions,
        adjustmentType: data.adjustmentType,
        adjustmentValue: data.adjustmentValue,
        validFrom: data.validFrom,
        validUntil: data.validUntil,
        priority: data.priority,
        isActive: data.isActive,
      },
      select: {
        id: true,
        name: true,
        description: true,
        ruleType: true,
        conditions: true,
        adjustmentType: true,
        adjustmentValue: true,
        validFrom: true,
        validUntil: true,
        priority: true,
        isActive: true,
        createdAt: true,
      },
    });

    return {
      ...rule,
      adjustmentValue: Number(rule.adjustmentValue),
    };
  }

  /**
   * Update a pricing rule
   */
  async updatePricingRule(
    organizerId: string,
    eventId: string,
    ruleId: string,
    data: UpdatePricingRuleInput
  ): Promise<PricingRuleResponse> {
    const rule = await prisma.pricingRule.findUnique({
      where: { id: ruleId },
      include: { event: { select: { organizerId: true } } },
    });

    if (!rule) {
      throw new NotFoundError('Pricing rule not found');
    }

    if (rule.event.organizerId !== organizerId || rule.eventId !== eventId) {
      throw new ForbiddenError('You do not have permission to update this pricing rule');
    }

    // Validate percentage value
    if (data.adjustmentType === 'percentage' && data.adjustmentValue && data.adjustmentValue > 100) {
      throw new ForbiddenError('Percentage adjustment cannot exceed 100%');
    }

    const updated = await prisma.pricingRule.update({
      where: { id: ruleId },
      data: {
        name: data.name,
        description: data.description,
        conditions: data.conditions,
        adjustmentType: data.adjustmentType,
        adjustmentValue: data.adjustmentValue,
        validFrom: data.validFrom,
        validUntil: data.validUntil,
        priority: data.priority,
        isActive: data.isActive,
      },
      select: {
        id: true,
        name: true,
        description: true,
        ruleType: true,
        conditions: true,
        adjustmentType: true,
        adjustmentValue: true,
        validFrom: true,
        validUntil: true,
        priority: true,
        isActive: true,
        createdAt: true,
      },
    });

    return {
      ...updated,
      adjustmentValue: Number(updated.adjustmentValue),
    };
  }

  /**
   * Delete a pricing rule
   */
  async deletePricingRule(organizerId: string, eventId: string, ruleId: string): Promise<void> {
    const rule = await prisma.pricingRule.findUnique({
      where: { id: ruleId },
      include: { event: { select: { organizerId: true } } },
    });

    if (!rule) {
      throw new NotFoundError('Pricing rule not found');
    }

    if (rule.event.organizerId !== organizerId || rule.eventId !== eventId) {
      throw new ForbiddenError('You do not have permission to delete this pricing rule');
    }

    await prisma.pricingRule.delete({ where: { id: ruleId } });
  }
}

export const pricingService = new PricingService();
