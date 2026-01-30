import { prisma } from '../../shared/database/prisma.js';
import { BadRequestError } from '../../shared/utils/errors.js';
import crypto from 'crypto';

// =============================================================================
// MESSAGE FILTER SERVICE
// Used as a hook in Chat module to filter messages before sending
// =============================================================================

interface FilterResult {
  allowed: boolean;
  reason?: string;
  filteredContent?: string;
}

interface ModerationFilters {
  blockedWords: string[];
  blockedPatterns: string[];
  spamProtection: boolean;
  mediaFilter: boolean;
  linkFilter: boolean;
}

// URL detection regex
const URL_REGEX = /https?:\/\/[^\s]+|www\.[^\s]+/gi;

class FiltersService {
  /**
   * Check if message passes all filters
   * Called before sendMessage in chat service
   */
  async checkMessage(
    userId: string,
    chatRoomId: string,
    content: string,
    hasMedia: boolean = false,
    eventId?: string
  ): Promise<FilterResult> {
    // Get organizer's filters if this is an event chat
    const filters = await this.getFiltersForChat(eventId);

    if (!filters) {
      // No filters configured, allow all
      return { allowed: true };
    }

    // 1. Check blocked words
    if (filters.blockedWords.length > 0) {
      const blockedWordResult = this.checkBlockedWords(content, filters.blockedWords);
      if (!blockedWordResult.allowed) {
        return blockedWordResult;
      }
    }

    // 2. Check blocked patterns (regex)
    if (filters.blockedPatterns.length > 0) {
      const patternResult = this.checkBlockedPatterns(content, filters.blockedPatterns);
      if (!patternResult.allowed) {
        return patternResult;
      }
    }

    // 3. Check link filter
    if (filters.linkFilter) {
      const linkResult = this.checkLinks(content);
      if (!linkResult.allowed) {
        return linkResult;
      }
    }

    // 4. Check media filter
    if (filters.mediaFilter && hasMedia) {
      return {
        allowed: false,
        reason: 'Media paylaşımı bu sohbette devre dışı',
      };
    }

    // 5. Check spam protection
    if (filters.spamProtection) {
      const spamResult = await this.checkSpam(userId, chatRoomId, content);
      if (!spamResult.allowed) {
        return spamResult;
      }
    }

    return { allowed: true };
  }

  /**
   * Get moderation filters for a chat
   */
  private async getFiltersForChat(eventId?: string): Promise<ModerationFilters | null> {
    if (!eventId) {
      return null; // Personal chats don't have filters
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        organizer: {
          include: {
            moderationFilter: true,
          },
        },
      },
    });

    if (!event?.organizer?.moderationFilter) {
      return null;
    }

    const filter = event.organizer.moderationFilter;
    return {
      blockedWords: filter.blockedWords,
      blockedPatterns: filter.blockedPatterns,
      spamProtection: filter.spamProtection,
      mediaFilter: filter.mediaFilter,
      linkFilter: filter.linkFilter,
    };
  }

  /**
   * Check for blocked words (case-insensitive)
   */
  private checkBlockedWords(content: string, blockedWords: string[]): FilterResult {
    const lowerContent = content.toLowerCase();

    for (const word of blockedWords) {
      const lowerWord = word.toLowerCase();
      // Check for whole word match or part of word
      if (lowerContent.includes(lowerWord)) {
        return {
          allowed: false,
          reason: 'Mesajınız yasaklı kelimeler içeriyor',
        };
      }
    }

    return { allowed: true };
  }

  /**
   * Check for blocked patterns (regex)
   */
  private checkBlockedPatterns(content: string, patterns: string[]): FilterResult {
    for (const pattern of patterns) {
      try {
        const regex = new RegExp(pattern, 'i');
        if (regex.test(content)) {
          return {
            allowed: false,
            reason: 'Mesajınız yasaklı içerik içeriyor',
          };
        }
      } catch (e) {
        // Invalid regex pattern, skip
        console.error('[Filters] Invalid regex pattern:', pattern);
      }
    }

    return { allowed: true };
  }

  /**
   * Check for URLs in message
   */
  private checkLinks(content: string): FilterResult {
    if (URL_REGEX.test(content)) {
      return {
        allowed: false,
        reason: 'Link paylaşımı bu sohbette devre dışı',
      };
    }

    return { allowed: true };
  }

  /**
   * Check for spam (same message 3+ times in 1 minute)
   */
  private async checkSpam(
    userId: string,
    chatRoomId: string,
    content: string
  ): Promise<FilterResult> {
    // Create hash of message content
    const messageHash = crypto.createHash('md5').update(content.toLowerCase().trim()).digest('hex');

    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);

    // Find or create spam tracker
    const existing = await prisma.spamTracker.findUnique({
      where: {
        userId_chatRoomId_messageHash: {
          userId,
          chatRoomId,
          messageHash,
        },
      },
    });

    if (existing) {
      // Check if within time window
      if (existing.lastSentAt > oneMinuteAgo) {
        if (existing.count >= 2) {
          // 3rd or more attempt within 1 minute - block
          return {
            allowed: false,
            reason: 'Çok fazla tekrarlanan mesaj gönderdiniz. Lütfen bekleyin.',
          };
        }

        // Increment counter
        await prisma.spamTracker.update({
          where: { id: existing.id },
          data: {
            count: { increment: 1 },
            lastSentAt: new Date(),
          },
        });
      } else {
        // Window expired, reset counter
        await prisma.spamTracker.update({
          where: { id: existing.id },
          data: {
            count: 1,
            firstSentAt: new Date(),
            lastSentAt: new Date(),
          },
        });
      }
    } else {
      // Create new tracker
      await prisma.spamTracker.create({
        data: {
          userId,
          chatRoomId,
          messageHash,
          count: 1,
          firstSentAt: new Date(),
          lastSentAt: new Date(),
        },
      });
    }

    return { allowed: true };
  }

  /**
   * Clean up old spam trackers (called periodically)
   */
  async cleanupSpamTrackers(): Promise<number> {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const result = await prisma.spamTracker.deleteMany({
      where: {
        lastSentAt: { lt: fiveMinutesAgo },
      },
    });

    return result.count;
  }
}

export const filtersService = new FiltersService();
