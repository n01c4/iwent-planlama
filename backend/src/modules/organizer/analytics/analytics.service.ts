import { prisma } from '../../../shared/database/index.js';
import { NotFoundError } from '../../../shared/utils/errors.js';
import type { OverviewQuery, TimeseriesQuery, TopSourcesQuery } from './analytics.schema.js';

// =============================================================================
// ANALYTICS SERVICE - Faz 6
// =============================================================================

/**
 * Analytics Overview Response
 */
export interface AnalyticsOverviewResponse {
  totalRevenue: number;
  ticketsSold: number;
  activeEvents: number;
  avgTicketPrice: number;
  revenueChange: number; // Percentage change from previous period
  ticketsChange: number;
}

/**
 * Time Series Point
 */
interface TimeSeriesPoint {
  date: string;
  value: number;
}

/**
 * Time Series Response
 */
export interface TimeSeriesResponse {
  metric: string;
  range: string;
  data: TimeSeriesPoint[];
  total: number;
}

/**
 * Conversion Funnel Response
 */
export interface ConversionFunnelResponse {
  pageViews: number;
  ticketViews: number;
  cartAdds: number;
  checkoutStarts: number;
  purchases: number;
  rates: {
    viewToTicket: number;
    ticketToCart: number;
    cartToCheckout: number;
    checkoutToPurchase: number;
    overall: number;
  };
}

/**
 * Audience Stats Response
 */
export interface AudienceStatsResponse {
  ageGroups: Record<string, number>;
  genderDistribution: Record<string, number>;
  cityDistribution: Record<string, number>;
  deviceDistribution: Record<string, number>;
  platformDistribution: Record<string, number>;
}

/**
 * Traffic Source
 */
interface TrafficSource {
  source: string;
  medium: string | null;
  visits: number;
  conversions: number;
  revenue: number;
  conversionRate: number;
}

/**
 * Top Sources Response
 */
export interface TopSourcesResponse {
  sources: TrafficSource[];
  totalVisits: number;
  totalConversions: number;
}

/**
 * Get date range from range string
 */
function getDateRange(range: string): { startDate: Date; endDate: Date; prevStartDate: Date; prevEndDate: Date } {
  const now = new Date();
  const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let days: number;

  switch (range) {
    case '7d':
      days = 7;
      break;
    case '30d':
      days = 30;
      break;
    case '90d':
      days = 90;
      break;
    case '1y':
      days = 365;
      break;
    default:
      days = 30;
  }

  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - days);

  const prevEndDate = new Date(startDate);
  prevEndDate.setDate(prevEndDate.getDate() - 1);

  const prevStartDate = new Date(prevEndDate);
  prevStartDate.setDate(prevStartDate.getDate() - days);

  return { startDate, endDate, prevStartDate, prevEndDate };
}

class AnalyticsService {
  /**
   * Get organizer analytics overview
   */
  async getOverview(organizerId: string, query: OverviewQuery): Promise<AnalyticsOverviewResponse> {
    const { startDate, endDate, prevStartDate, prevEndDate } = getDateRange(query.range);

    // Get organizer's events
    const events = await prisma.event.findMany({
      where: { organizerId, deletedAt: null },
      select: { id: true },
    });

    const eventIds = events.map(e => e.id);

    if (eventIds.length === 0) {
      return {
        totalRevenue: 0,
        ticketsSold: 0,
        activeEvents: 0,
        avgTicketPrice: 0,
        revenueChange: 0,
        ticketsChange: 0,
      };
    }

    // Get current period stats from daily stats
    const currentStats = await prisma.eventDailyStats.aggregate({
      where: {
        eventId: { in: eventIds },
        date: { gte: startDate, lte: endDate },
      },
      _sum: {
        revenue: true,
        ticketsSold: true,
      },
    });

    // Get previous period stats
    const prevStats = await prisma.eventDailyStats.aggregate({
      where: {
        eventId: { in: eventIds },
        date: { gte: prevStartDate, lte: prevEndDate },
      },
      _sum: {
        revenue: true,
        ticketsSold: true,
      },
    });

    // Get active events count
    const activeEvents = await prisma.event.count({
      where: {
        organizerId,
        deletedAt: null,
        status: 'published',
        startDate: { gte: new Date() },
      },
    });

    // Calculate totals
    const totalRevenue = Number(currentStats._sum.revenue || 0);
    const ticketsSold = currentStats._sum.ticketsSold || 0;
    const prevRevenue = Number(prevStats._sum.revenue || 0);
    const prevTickets = prevStats._sum.ticketsSold || 0;

    // Calculate changes (percentage)
    const revenueChange = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;
    const ticketsChange = prevTickets > 0 ? ((ticketsSold - prevTickets) / prevTickets) * 100 : 0;

    // Calculate average ticket price
    const avgTicketPrice = ticketsSold > 0 ? totalRevenue / ticketsSold : 0;

    return {
      totalRevenue,
      ticketsSold,
      activeEvents,
      avgTicketPrice: Math.round(avgTicketPrice * 100) / 100,
      revenueChange: Math.round(revenueChange * 100) / 100,
      ticketsChange: Math.round(ticketsChange * 100) / 100,
    };
  }

  /**
   * Get time series data for an event
   */
  async getTimeSeries(
    organizerId: string,
    eventId: string,
    query: TimeseriesQuery
  ): Promise<TimeSeriesResponse> {
    // Verify event ownership
    const event = await prisma.event.findFirst({
      where: { id: eventId, organizerId, deletedAt: null },
      select: { id: true },
    });

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    const { startDate, endDate } = getDateRange(query.range);

    const dailyStats = await prisma.eventDailyStats.findMany({
      where: {
        eventId,
        date: { gte: startDate, lte: endDate },
      },
      orderBy: { date: 'asc' },
    });

    // Map metric to field
    const metricField = {
      revenue: 'revenue',
      tickets: 'ticketsSold',
      views: 'views',
    }[query.metric] as 'revenue' | 'ticketsSold' | 'views';

    // Build time series with all dates (fill gaps with 0)
    const data: TimeSeriesPoint[] = [];
    const statsMap = new Map(
      dailyStats.map(s => [s.date.toISOString().split('T')[0], s])
    );

    let total = 0;
    const current = new Date(startDate);

    while (current <= endDate) {
      const dateStr = current.toISOString().split('T')[0];
      const stat = statsMap.get(dateStr);
      const value = stat ? Number(stat[metricField]) : 0;
      total += value;

      data.push({
        date: dateStr,
        value,
      });

      current.setDate(current.getDate() + 1);
    }

    return {
      metric: query.metric,
      range: query.range,
      data,
      total,
    };
  }

  /**
   * Get conversion funnel for an event
   */
  async getConversionFunnel(organizerId: string, eventId: string): Promise<ConversionFunnelResponse> {
    // Verify event ownership
    const event = await prisma.event.findFirst({
      where: { id: eventId, organizerId, deletedAt: null },
      select: { id: true },
    });

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    // Aggregate all conversion stats for this event
    const stats = await prisma.eventConversionStats.aggregate({
      where: { eventId },
      _sum: {
        pageViews: true,
        ticketViews: true,
        cartAdds: true,
        checkoutStarts: true,
        purchases: true,
      },
    });

    const pageViews = stats._sum.pageViews || 0;
    const ticketViews = stats._sum.ticketViews || 0;
    const cartAdds = stats._sum.cartAdds || 0;
    const checkoutStarts = stats._sum.checkoutStarts || 0;
    const purchases = stats._sum.purchases || 0;

    // Calculate conversion rates (percentage)
    const rates = {
      viewToTicket: pageViews > 0 ? (ticketViews / pageViews) * 100 : 0,
      ticketToCart: ticketViews > 0 ? (cartAdds / ticketViews) * 100 : 0,
      cartToCheckout: cartAdds > 0 ? (checkoutStarts / cartAdds) * 100 : 0,
      checkoutToPurchase: checkoutStarts > 0 ? (purchases / checkoutStarts) * 100 : 0,
      overall: pageViews > 0 ? (purchases / pageViews) * 100 : 0,
    };

    return {
      pageViews,
      ticketViews,
      cartAdds,
      checkoutStarts,
      purchases,
      rates: {
        viewToTicket: Math.round(rates.viewToTicket * 100) / 100,
        ticketToCart: Math.round(rates.ticketToCart * 100) / 100,
        cartToCheckout: Math.round(rates.cartToCheckout * 100) / 100,
        checkoutToPurchase: Math.round(rates.checkoutToPurchase * 100) / 100,
        overall: Math.round(rates.overall * 100) / 100,
      },
    };
  }

  /**
   * Get audience stats for an event
   */
  async getAudienceStats(organizerId: string, eventId: string): Promise<AudienceStatsResponse> {
    // Verify event ownership
    const event = await prisma.event.findFirst({
      where: { id: eventId, organizerId, deletedAt: null },
      select: { id: true },
    });

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    // Get audience stats (or return empty if none exist)
    const audienceStats = await prisma.eventAudienceStats.findUnique({
      where: { eventId },
    });

    if (!audienceStats) {
      return {
        ageGroups: {},
        genderDistribution: {},
        cityDistribution: {},
        deviceDistribution: {},
        platformDistribution: {},
      };
    }

    return {
      ageGroups: audienceStats.ageGroups as Record<string, number>,
      genderDistribution: audienceStats.genderDistribution as Record<string, number>,
      cityDistribution: audienceStats.cityDistribution as Record<string, number>,
      deviceDistribution: audienceStats.deviceDistribution as Record<string, number>,
      platformDistribution: audienceStats.platformDistribution as Record<string, number>,
    };
  }

  /**
   * Get top traffic sources for an event
   */
  async getTopSources(
    organizerId: string,
    eventId: string,
    query: TopSourcesQuery
  ): Promise<TopSourcesResponse> {
    // Verify event ownership
    const event = await prisma.event.findFirst({
      where: { id: eventId, organizerId, deletedAt: null },
      select: { id: true },
    });

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    const { startDate, endDate } = getDateRange(query.range);

    // Get aggregated traffic sources
    const trafficData = await prisma.eventTrafficSource.groupBy({
      by: ['source', 'medium'],
      where: {
        eventId,
        date: { gte: startDate, lte: endDate },
      },
      _sum: {
        visits: true,
        conversions: true,
        revenue: true,
      },
      orderBy: {
        _sum: {
          visits: 'desc',
        },
      },
      take: query.limit,
    });

    const sources: TrafficSource[] = trafficData.map(item => ({
      source: item.source,
      medium: item.medium,
      visits: item._sum.visits || 0,
      conversions: item._sum.conversions || 0,
      revenue: Number(item._sum.revenue || 0),
      conversionRate:
        (item._sum.visits || 0) > 0
          ? Math.round(((item._sum.conversions || 0) / (item._sum.visits || 0)) * 10000) / 100
          : 0,
    }));

    const totalVisits = sources.reduce((sum, s) => sum + s.visits, 0);
    const totalConversions = sources.reduce((sum, s) => sum + s.conversions, 0);

    return {
      sources,
      totalVisits,
      totalConversions,
    };
  }

  /**
   * Track page view (for incrementing daily stats)
   */
  async trackPageView(eventId: string): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await prisma.eventDailyStats.upsert({
      where: {
        eventId_date: { eventId, date: today },
      },
      update: {
        views: { increment: 1 },
      },
      create: {
        eventId,
        date: today,
        views: 1,
      },
    });
  }

  /**
   * Update stats after order confirmation (called from order confirmation flow)
   */
  async recordSale(eventId: string, ticketCount: number, revenue: number): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await prisma.eventDailyStats.upsert({
      where: {
        eventId_date: { eventId, date: today },
      },
      update: {
        ticketsSold: { increment: ticketCount },
        revenue: { increment: revenue },
      },
      create: {
        eventId,
        date: today,
        ticketsSold: ticketCount,
        revenue,
      },
    });

    // Also update conversion stats
    await prisma.eventConversionStats.upsert({
      where: {
        eventId_date: { eventId, date: today },
      },
      update: {
        purchases: { increment: 1 },
      },
      create: {
        eventId,
        date: today,
        purchases: 1,
      },
    });
  }
}

export const analyticsService = new AnalyticsService();
