// Stub for missing auth-context
export const AuthContext = {};
export function useAuth() {
	return { appUser: { companyId: 'test-company', uid: 'test-user', role: { projectTypeIds: [] } }, hasPermission: () => true };
}
