export interface AuditEvent {
  id: string;
  organizationId?: string;
  userId?: string;
  actorName?: string;
  actorRole?: string;
  action: string;
  resource: string;
  resourceId?: string;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
  createdAt: string;
}
