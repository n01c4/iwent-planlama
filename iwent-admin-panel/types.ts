export type Status = 'Active' | 'Suspended' | 'Pending' | 'Banned' | 'Frozen' | 'ReadOnly';
export type VerificationStatus = 'Verified' | 'Pending' | 'Unverified' | 'Rejected';
export type Severity = 'Low' | 'Medium' | 'High' | 'Critical';
export type ReportStatus = 'Open' | 'InReview' | 'Resolved' | 'Dismissed';
export type ReportType = 'Harassment' | 'Spam' | 'Fraud' | 'Abuse' | 'Other';
export type Channel = 'Group' | 'DM' | 'Event' | 'Organizer';

export interface Organizer {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: Status;
  riskScore: number; // 0-100
  kycStatus: VerificationStatus;
  payoutHold: boolean;
  createdAt: string;
  lastEventAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  university?: string;
  status: Status;
  trustScore: number;
  createdAt: string;
  reportsCount: number;
}

export interface Event {
  id: string;
  title: string;
  date: string;
  venue: string;
  organizerId: string;
  organizerName: string;
  ticketStatus: 'OnSale' | 'SoldOut' | 'Cancelled' | 'Past';
  chatGroupId: string;
  reportsCount: number;
}

export interface ChatGroup {
  id: string;
  eventId: string;
  eventName: string;
  memberCount: number;
  status: 'Normal' | 'Frozen' | 'ReadOnly';
  lastMessageAt: string;
  flaggedMessagesCount: number;
}

export interface Report {
  id: string;
  type: ReportType;
  channel: Channel;
  targetId: string;
  targetName: string;
  reporterId: string;
  reporterName: string;
  severity: Severity;
  status: ReportStatus;
  createdAt: string;
  description: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  isFlagged: boolean;
}

export interface AuditLog {
  id: string;
  actor: string;
  action: string;
  target: string;
  timestamp: string;
}

export interface StatCardProps {
  title: string;
  value: string | number;
  trend?: number; // percentage
  trendLabel?: string;
  urgent?: boolean;
}
