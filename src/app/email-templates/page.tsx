// src/app/email-templates/page.tsx
'use client';

import { EmailTemplatesPage } from '@/components/email-templates-page';
import { PermissionDenied } from '@/components/auth/permission-denied';
import { useAuth } from '@/context/auth-context';

export default function EmailTemplates() {
  const { hasPermission } = useAuth();
    
  if (!hasPermission('view_email_templates')) {
    return <PermissionDenied />;
  }
  
  return <EmailTemplatesPage />;
}
