import { Injectable } from '@nestjs/common';

@Injectable()
export class AuditService {
  async log(action: string, resource: string, resourceId?: string, details?: any) {
    console.log(`[AUDIT] ${action} on ${resource}${resourceId ? `:${resourceId}` : ''}`);
  }
}
