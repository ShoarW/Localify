import { db } from '../db/db.js';
import * as permissionDB from '../db/permission.db.js';

export async function hasPermission(
  role: string,
  action: string
): Promise<boolean> {
  return permissionDB.hasPermission(db, role, action);
}
