// src/app/roles/[roleId]/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Checkbox, Label } from '../../components/ui';
import { Loader2, ArrowLeft, Save } from 'lucide-react';
import type { Role, Permission, ProjectType } from '../../lib/types';
// TODO: Refactor to use Azure services
import { useToast } from '../../hooks';
import { availablePermissions, permissionCategories } from '../../lib/permissions';
import { useAuth } from '../../context';

export default function RoleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { appUser } = useAuth();
  const roleId = params.roleId as string;
  const { toast } = useToast();

  const [role, setRole] = useState<Role | null>(null);
  const [projectTypes, setProjectTypes] = useState<ProjectType[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<Record<Permission, boolean>>(() => {
  return availablePermissions.reduce((acc: any, perm: any) => {
        acc[perm] = false;
        return acc;
    }, {} as Record<Permission, boolean>);
  });
  const [selectedProjectTypeIds, setSelectedProjectTypeIds] = useState<Record<string, boolean>>({});
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchRoleData = useCallback(async () => {
    if (!appUser?.companyId) return;
    setIsLoading(true);
    try {
        const [fetchedRole, fetchedProjectTypes] = await Promise.all([
          getRoleAzure(roleId),
          getProjectTypesAzure(appUser.companyId)
        ]);

        setProjectTypes(fetchedProjectTypes);

        if (fetchedRole) {
            setRole(fetchedRole);
            const initialPermissions = { ...selectedPermissions };
      (fetchedRole.permissions || []).forEach((p: any) => {
        if (p in initialPermissions) {
          initialPermissions[p] = true;
        }
      });
            setSelectedPermissions(initialPermissions);

            const initialProjectTypeIds: Record<string, boolean> = {};
      fetchedProjectTypes.forEach((pt: any) => {
        initialProjectTypeIds[pt.id] = (fetchedRole.projectTypeIds || []).includes(pt.id);
      });
            setSelectedProjectTypeIds(initialProjectTypeIds);

        } else {
            toast({ title: 'Role not found', variant: 'destructive' });
            router.push('/roles');
        }
    } catch (error) {
        console.error('Failed to fetch role data', error);
        toast({ title: 'Error loading role data', variant: 'destructive' });
    } finally {
        setIsLoading(false);
    }
  }, [roleId, router, toast, appUser]);

  useEffect(() => {
    if (appUser?.companyId) {
      fetchRoleData();
    }
  }, [fetchRoleData, appUser]);

  const handlePermissionChange = (permission: Permission, checked: boolean) => {
    setSelectedPermissions(prev => ({ ...prev, [permission]: checked }));
  };

  const handleProjectTypeChange = (projectTypeId: string, checked: boolean) => {
    setSelectedProjectTypeIds(prev => ({ ...prev, [projectTypeId]: checked }));
  };
  
  const handleSave = async () => {
    if (!role) return;
    setIsSaving(true);
    
    const permissionsToSave = Object.entries(selectedPermissions)
      .filter(([, isSelected]) => isSelected)
      .map(([permission]) => permission as Permission);
    
    const projectTypeIdsToSave = Object.entries(selectedProjectTypeIds)
      .filter(([, isSelected]) => isSelected)
      .map(([id]) => id);

    try {
        await updateRolePermissions(role.id, permissionsToSave, projectTypeIdsToSave);
        toast({ title: 'Permissions saved successfully!' });
        router.push('/roles');
    } catch (error) {
        console.error('Failed to save permissions', error);
        toast({ title: 'Error saving permissions', variant: 'destructive' });
    } finally {
        setIsSaving(false);
    }
  };
  
  if (isLoading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin" /></div>;
  }

  if (!role) {
    return <div className="text-center">Role not found.</div>;
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="flex items-center justify-between p-4 sm:p-6 border-b">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.push('/roles')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Edit Role Permissions</h1>
            <p className="text-muted-foreground">Configure access for the <strong>{role.name}</strong> role.</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="animate-spin" /> : <><Save className="mr-2"/> Save Changes</>}
        </Button>
      </header>
      <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card className="xl:col-span-2">
              <CardHeader>
                  <CardTitle>Action Permissions</CardTitle>
                  <CardDescription>Select the actions this role is allowed to perform across the application.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                  {Object.entries(permissionCategories).map(([category, details]) => (
                      <div key={category} className="space-y-4 p-4 border rounded-lg">
                          <h3 className="text-lg font-semibold">{details.title}</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {details.permissions.map(permission => (
                                  <div key={permission} className="flex items-center space-x-2">
                                      <Checkbox
                                          id={permission}
                                          checked={selectedPermissions[permission]}
                                          onCheckedChange={(checked: boolean) => handlePermissionChange(permission, !!checked)}
                                          disabled={isSaving}
                                      />
                                      <Label htmlFor={permission} className="font-normal capitalize">
                                          {permission.replace(/_/g, ' ')}
                                      </Label>
                                  </div>
                              ))}
                          </div>
                      </div>
                  ))}
              </CardContent>
          </Card>
          <Card>
            <CardHeader>
                <CardTitle>Data Access</CardTitle>
                <CardDescription>Select which project types this role should have access to.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               {projectTypes.length > 0 ? (
                 projectTypes.map(pt => (
                    <div key={pt.id} className="flex items-center space-x-2">
                        <Checkbox
                            id={`pt-${pt.id}`}
                            checked={selectedProjectTypeIds[pt.id]}
                            onCheckedChange={(checked: boolean) => handleProjectTypeChange(pt.id, !!checked)}
                            disabled={isSaving}
                        />
                        <Label htmlFor={`pt-${pt.id}`} className="font-normal">
                            {pt.name}
                        </Label>
                    </div>
                ))
               ) : (
                <p className="text-sm text-muted-foreground">No project types have been created yet.</p>
               )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
