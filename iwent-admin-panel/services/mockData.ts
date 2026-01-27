import { Organizer, Event, ChatGroup, Report, AuditLog, Message, User } from '../types';

// Generators
const generateId = () => Math.random().toString(36).substr(2, 9);
const randomDate = (start: Date, end: Date) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString();

// Seed Data
export const MOCK_ORGANIZERS: Organizer[] = [
  { id: 'org_1', name: 'Neon Nights Inc.', email: 'contact@neonnights.com', phone: '+15550101', status: 'Active', riskScore: 12, kycStatus: 'Verified', payoutHold: false, createdAt: '2023-01-15', lastEventAt: '2023-10-20' },
  { id: 'org_2', name: 'Underground Bass', email: 'dave@ugbass.co', phone: '+15550102', status: 'Suspended', riskScore: 88, kycStatus: 'Pending', payoutHold: true, createdAt: '2023-03-10', lastEventAt: '2023-09-01' },
  { id: 'org_3', name: 'Campus Events Ltd', email: 'admin@campus.edu', phone: '+15550103', status: 'Active', riskScore: 5, kycStatus: 'Verified', payoutHold: false, createdAt: '2022-11-05', lastEventAt: '2023-10-25' },
  { id: 'org_4', name: 'Flash Mobs UK', email: 'sarah@flash.uk', phone: '+447700900', status: 'Pending', riskScore: 45, kycStatus: 'Unverified', payoutHold: true, createdAt: '2023-10-20', lastEventAt: '2023-10-21' },
  { id: 'org_5', name: 'Techno Bunker', email: 'hans@bunker.de', phone: '+49151000', status: 'Active', riskScore: 22, kycStatus: 'Verified', payoutHold: false, createdAt: '2023-05-12', lastEventAt: '2023-10-24' },
];

export const MOCK_USERS: User[] = [
  { id: 'usr_1', name: 'RaveGod', email: 'ravegod@uni.edu', university: 'Central Uni', status: 'Active', trustScore: 95, createdAt: '2023-01-10', reportsCount: 0 },
  { id: 'usr_2', name: 'Spike', email: 'spike@bad.com', university: 'Tech Institute', status: 'Suspended', trustScore: 15, createdAt: '2023-09-05', reportsCount: 12 },
  { id: 'usr_3', name: 'Alice W.', email: 'alice@uni.edu', university: 'Central Uni', status: 'Active', trustScore: 88, createdAt: '2023-02-15', reportsCount: 1 },
  { id: 'usr_103', name: 'Charlie', email: 'charlie@crypto.com', university: undefined, status: 'Banned', trustScore: 5, createdAt: '2023-10-01', reportsCount: 50 },
  { id: 'usr_105', name: 'Emma Stone', email: 'emma@arts.ac.uk', university: 'Arts University', status: 'Active', trustScore: 72, createdAt: '2023-06-20', reportsCount: 2 },
];

export const MOCK_EVENTS: Event[] = [
  { id: 'evt_1', title: 'Midnight Warehouse Rave', date: '2023-10-31T22:00:00Z', venue: 'Dock 42', organizerId: 'org_1', organizerName: 'Neon Nights Inc.', ticketStatus: 'OnSale', chatGroupId: 'grp_1', reportsCount: 2 },
  { id: 'evt_2', title: 'Freshers Foam Party', date: '2023-09-15T20:00:00Z', venue: 'The Student Union', organizerId: 'org_3', organizerName: 'Campus Events Ltd', ticketStatus: 'Past', chatGroupId: 'grp_2', reportsCount: 0 },
  { id: 'evt_3', title: 'Secret Dubstep Session', date: '2023-11-05T23:00:00Z', venue: 'Undisclosed Location', organizerId: 'org_2', organizerName: 'Underground Bass', ticketStatus: 'Cancelled', chatGroupId: 'grp_3', reportsCount: 15 },
];

export const MOCK_GROUPS: ChatGroup[] = [
  { id: 'grp_1', eventId: 'evt_1', eventName: 'Midnight Warehouse Rave', memberCount: 1420, status: 'Normal', lastMessageAt: '2023-10-27T10:30:00Z', flaggedMessagesCount: 3 },
  { id: 'grp_2', eventId: 'evt_2', eventName: 'Freshers Foam Party', memberCount: 350, status: 'ReadOnly', lastMessageAt: '2023-09-16T09:00:00Z', flaggedMessagesCount: 0 },
  { id: 'grp_3', eventId: 'evt_3', eventName: 'Secret Dubstep Session', memberCount: 85, status: 'Frozen', lastMessageAt: '2023-10-26T14:15:00Z', flaggedMessagesCount: 28 },
];

export const MOCK_REPORTS: Report[] = [
  { id: 'rep_1', type: 'Fraud', channel: 'Event', targetId: 'evt_3', targetName: 'Secret Dubstep Session', reporterId: 'usr_101', reporterName: 'Alice W.', severity: 'Critical', status: 'Open', createdAt: '2023-10-26T14:00:00Z', description: 'Organizer cancelled but refused refund. Deleted social media.' },
  { id: 'rep_2', type: 'Harassment', channel: 'Group', targetId: 'grp_1', targetName: 'Midnight Warehouse Chat', reporterId: 'usr_102', reporterName: 'Bob M.', severity: 'High', status: 'InReview', createdAt: '2023-10-27T09:30:00Z', description: 'User @Spike is threatening people in the main chat.' },
  { id: 'rep_3', type: 'Spam', channel: 'DM', targetId: 'usr_555', targetName: 'CryptoKing', reporterId: 'usr_103', reporterName: 'Charlie', severity: 'Low', status: 'Resolved', createdAt: '2023-10-25T11:20:00Z', description: 'Sending crypto links to everyone.' },
  { id: 'rep_4', type: 'Other', channel: 'Organizer', targetId: 'org_4', targetName: 'Flash Mobs UK', reporterId: 'usr_104', reporterName: 'Police Rep', severity: 'Medium', status: 'Open', createdAt: '2023-10-27T08:00:00Z', description: 'Unpermitted gathering planned in city center.' },
];

export const MOCK_MESSAGES: Message[] = [
  { id: 'msg_1', senderId: 'usr_1', senderName: 'RaveGod', content: 'Anyone need extra tickets?', timestamp: '10:00 AM', isFlagged: false },
  { id: 'msg_2', senderId: 'usr_2', senderName: 'Spike', content: 'I will find you and make you pay.', timestamp: '10:05 AM', isFlagged: true },
  { id: 'msg_3', senderId: 'usr_3', senderName: 'Alice', content: 'Can admin please remove him?', timestamp: '10:06 AM', isFlagged: false },
  { id: 'msg_4', senderId: 'usr_2', senderName: 'Spike', content: 'Shut up Alice.', timestamp: '10:07 AM', isFlagged: true },
];

export const MOCK_AUDIT_LOG: AuditLog[] = [
  { id: 'log_1', actor: 'Admin Sarah', action: 'Suspended Organizer', target: 'Underground Bass', timestamp: '2023-10-26T15:00:00Z' },
  { id: 'log_2', actor: 'Mod Mike', action: 'Resolved Report', target: 'rep_3', timestamp: '2023-10-25T12:00:00Z' },
];

// Simple in-memory store
class DataService {
  organizers = [...MOCK_ORGANIZERS];
  users = [...MOCK_USERS];
  events = [...MOCK_EVENTS];
  groups = [...MOCK_GROUPS];
  reports = [...MOCK_REPORTS];
  auditLog = [...MOCK_AUDIT_LOG];

  getStats() {
    return {
      openReports: this.reports.filter(r => r.status === 'Open').length,
      criticalReports: this.reports.filter(r => r.severity === 'Critical' && r.status !== 'Resolved').length,
      suspendedOrganizers: this.organizers.filter(o => o.status === 'Suspended').length,
      frozenGroups: this.groups.filter(g => g.status === 'Frozen').length,
      payoutHolds: this.organizers.filter(o => o.payoutHold).length,
    };
  }

  addAuditLog(action: string, target: string) {
    this.auditLog.unshift({
      id: generateId(),
      actor: 'You',
      action,
      target,
      timestamp: new Date().toISOString()
    });
  }

  updateOrganizer(id: string, updates: Partial<Organizer>) {
    this.organizers = this.organizers.map(o => o.id === id ? { ...o, ...updates } : o);
    this.addAuditLog(`Update Organizer ${Object.keys(updates).join(', ')}`, id);
  }

  updateUser(id: string, updates: Partial<User>) {
    this.users = this.users.map(u => u.id === id ? { ...u, ...updates } : u);
    this.addAuditLog(`Update User ${Object.keys(updates).join(', ')}`, id);
  }

  updateReport(id: string, updates: Partial<Report>) {
    this.reports = this.reports.map(r => r.id === id ? { ...r, ...updates } : r);
    this.addAuditLog(`Update Report ${Object.keys(updates).join(', ')}`, id);
  }
}

export const mockService = new DataService();
