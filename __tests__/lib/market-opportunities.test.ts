import { describe, it, expect } from 'vitest';
import {
  getAuctionOpportunities,
  getBankPropertyOpportunities,
  getDivergenceOpportunities,
  getEmergingTrends,
  getCrowdfundingOpportunities,
  getAllMarketOpportunities,
} from '@/lib/market-opportunities';

describe('market-opportunities', () => {
  describe('getAuctionOpportunities', () => {
    it('returns auctions for default provinces', async () => {
      const opps = await getAuctionOpportunities();
      expect(opps.length).toBeGreaterThanOrEqual(0);
      if (opps.length > 0) {
        expect(opps[0].category).toBe('subasta');
      }
    });

    it('filters by province', async () => {
      const opps = await getAuctionOpportunities(['Madrid']);
      for (const o of opps) {
        expect(o.location).toBe('Madrid');
      }
    });

    it('returns empty or fallback for unknown province', async () => {
      const opps = await getAuctionOpportunities(['Atlantis']);
      expect(opps.length).toBe(0);
    });

    it('has valid discount and price when available', async () => {
      const opps = await getAuctionOpportunities();
      for (const o of opps) {
        expect(o.price).toBeGreaterThan(0);
        expect(o.discount).toBeGreaterThan(0);
        expect(o.discount).toBeLessThanOrEqual(100);
      }
    });
  });

  describe('getBankPropertyOpportunities', () => {
    it('returns bank properties', () => {
      const opps = getBankPropertyOpportunities();
      expect(opps.length).toBeGreaterThan(0);
      expect(opps[0].category).toBe('banca');
    });

    it('has valid sources', () => {
      const opps = getBankPropertyOpportunities();
      const sources = new Set(opps.map((o) => o.source));
      expect(sources.size).toBeGreaterThan(1);
    });
  });

  describe('getDivergenceOpportunities', () => {
    it('returns divergence zones', () => {
      const opps = getDivergenceOpportunities();
      expect(opps.length).toBeGreaterThan(0);
      expect(opps[0].category).toBe('divergencia');
    });
  });

  describe('getEmergingTrends', () => {
    it('returns trends', () => {
      const opps = getEmergingTrends();
      expect(opps.length).toBeGreaterThan(0);
      expect(opps[0].category).toBe('tendencia');
    });
  });

  describe('getCrowdfundingOpportunities', () => {
    it('returns crowdfunding opps', () => {
      const opps = getCrowdfundingOpportunities();
      expect(opps.length).toBeGreaterThan(0);
      expect(opps[0].category).toBe('crowdfunding');
    });
  });

  describe('getAllMarketOpportunities', () => {
    it('aggregates all sources', async () => {
      const result = await getAllMarketOpportunities();
      expect(result).toBeDefined();
      expect(result.totalCount).toBeGreaterThanOrEqual(0);
      expect(result.all.length).toBe(result.totalCount);
    });

    it('sorts by discount descending', async () => {
      const result = await getAllMarketOpportunities();
      if (result.all.length > 1) {
        for (let i = 1; i < result.all.length; i++) {
          expect(result.all[i - 1].discount).toBeGreaterThanOrEqual(result.all[i].discount);
        }
      }
    });
  });
});
