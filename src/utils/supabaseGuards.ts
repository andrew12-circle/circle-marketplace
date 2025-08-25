// Utility functions to guard against undefined values in Supabase queries

export const isValidUUID = (value: any): value is string => {
  if (!value || typeof value !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
};

export const guardedEq = (column: string, value: any) => {
  if (value === undefined || value === null) {
    console.warn(`⚠️ DEV: Attempted to query ${column} with undefined/null value. This could cause errors.`);
    throw new Error(`Invalid filter value for ${column}: received ${value}`);
  }
  return { column, value };
};

export const guardedFilter = (filterBuilder: any, column: string, operator: string, value: any) => {
  if (value === undefined || value === null) {
    console.warn(`⚠️ DEV: Attempted to filter ${column} ${operator} undefined/null. This could cause errors.`);
    throw new Error(`Invalid filter value for ${column}: received ${value}`);
  }
  return filterBuilder[operator](value);
};

// Helper for user_id specifically since it's commonly problematic
export const guardedUserIdFilter = (filterBuilder: any, userId: any) => {
  if (!isValidUUID(userId)) {
    console.warn(`⚠️ DEV: Invalid user_id for filter: ${userId}`);
    throw new Error(`Invalid user_id for filter: ${userId}`);
  }
  return filterBuilder.eq('user_id', userId);
};