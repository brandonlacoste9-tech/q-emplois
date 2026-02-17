import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../guards/roles.guard';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

// Convenience decorators
export const IsClient = () => Roles(UserRole.CLIENT);
export const IsProvider = () => Roles(UserRole.PROVIDER);
export const IsAdmin = () => Roles(UserRole.ADMIN);