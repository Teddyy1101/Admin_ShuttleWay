export type DiscountType = 'PERCENTAGE' | 'FIXED';

export interface Promotion {
  id: string;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  usageLimit: number;
  usedCount: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  createdAt: string;
}

export interface GetPromotionsParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  discountType?: DiscountType;
}

export interface PromotionPayload {
  code: string;
  discountType: DiscountType;
  discountValue: number;
  usageLimit: number;
  validFrom: string;
  validUntil: string;
  isActive?: boolean;
}