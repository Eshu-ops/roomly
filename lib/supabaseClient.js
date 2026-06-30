import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Logs an action to activity_log (used for the audit history / undo feature)
export async function logActivity(houseId, memberId, action, entityType, entityId, detail = {}) {
  await supabase.from('activity_log').insert({
    house_id: houseId,
    member_id: memberId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    detail,
  });
}

export function fmtMoney(n, currency = 'BDT') {
  const symbols = { BDT: '৳', USD: '$', EUR: '€', GBP: '£', INR: '₹' };
  const s = symbols[currency] || currency + ' ';
  return s + Math.round(n || 0).toLocaleString('en-US');
}
