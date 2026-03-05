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
    it('returns auctions for default provinces', () => {
      const opps = getAuctionOpportunities();
      expect(opps.length).toBeGreaterThan(0);
      expect(opps[0].category).toBe('subasta');
      expect(opps[0].source).toBe('Subastas BOE');
    });

    it('filters by province', () => {
      const opps = getAuctionOpportunities(['Madrid']);
      expect(opps.every(o => o.location === 'Madrid')).toBe(true);
    });

    it('returns empty for unknown province', () => {
      const opps = getAuctionOpportunities(['Atlantis']);
      expect(opps.length).toBe(0);
    });

    it('has valid discount and price', () => {
      const opps = getAuctionOpportunities();
      for (const o of opps) {
        expect(o.price).toBeGreaterThan(0);
        expect(o.discount).toBeGreaterThan(0);
        expect(o.discount).toBeLessThanOrEqual(100);
        expect(o.riskLevel).toBe('alto');
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
      const sources = new Set(opps.map(o => o.source));
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
    it('aggregates all sources', () => {
      const result = getAllMarketOpportunities();
      expect(result.totalCount).toBeGreaterThan(0);
      expect(result.all.length).toBe(result.totalCount);
      expect(result.sources.length).toBeGreaterThan(5);
    });

    it('sorts by discount descending', () => {
      const result = getAllMarketOpportunities();
      for (let i = 1; i < result.all.length; i++) {
        expect(result.all[i - 1].discount).toBeGreaterThanOrEqual(result.all[i].discount);
      }
    });
  });
});
