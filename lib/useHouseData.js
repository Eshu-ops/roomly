'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from './supabaseClient';

// Central hook used by every page. Handles:
// - reading the logged-in user
// - finding their house + member row
// - loading all live data
// - subscribing to Postgres changes so every browser updates instantly
export function useHouseData() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [house, setHouse] = useState(null);
  const [members, setMembers] = useState([]);
  const [me, setMe] = useState(null);
  const [categories, setCategories] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [meals, setMeals] = useState([]);
  const [payments, setPayments] = useState([]);
  const [notes, setNotes] = useState([]);
  const [events, setEvents] = useState([]);

  const loadAll = useCallback(async (houseId) => {
    const [m, c, e, ml, p, n, ev] = await Promise.all([
      supabase.from('members').select('*').eq('house_id', houseId).order('created_at'),
      supabase.from('categories').select('*').eq('house_id', houseId).order('sort_order'),
      supabase.from('expenses').select('*').eq('house_id', houseId).order('date', { ascending: false }),
      supabase.from('meals').select('*').eq('house_id', houseId).order('date', { ascending: false }),
      supabase.from('payments').select('*').eq('house_id', houseId).order('date', { ascending: false }),
      supabase.from('notes').select('*').eq('house_id', houseId).order('created_at', { ascending: false }),
      supabase.from('events').select('*').eq('house_id', houseId).order('date'),
    ]);
    setMembers(m.data || []);
    setCategories(c.data || []);
    setExpenses(e.data || []);
    setMeals(ml.data || []);
    setPayments(p.data || []);
    setNotes(n.data || []);
    setEvents(ev.data || []);
  }, []);

  useEffect(() => {
    let channel;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      setUser(user);

      const { data: memberRow } = await supabase
        .from('members').select('*, houses(*)').eq('user_id', user.id).limit(1).maybeSingle();

      if (!memberRow) { router.push('/join'); return; }

      setMe(memberRow);
      setHouse(memberRow.houses);
      await loadAll(memberRow.house_id);
      setLoading(false);

      // Realtime: any insert/update/delete on these tables for this house refreshes instantly
      channel = supabase
        .channel('house-' + memberRow.house_id)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses', filter: `house_id=eq.${memberRow.house_id}` }, () => loadAll(memberRow.house_id))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'meals', filter: `house_id=eq.${memberRow.house_id}` }, () => loadAll(memberRow.house_id))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'payments', filter: `house_id=eq.${memberRow.house_id}` }, () => loadAll(memberRow.house_id))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'notes', filter: `house_id=eq.${memberRow.house_id}` }, () => loadAll(memberRow.house_id))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'members', filter: `house_id=eq.${memberRow.house_id}` }, () => loadAll(memberRow.house_id))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'events', filter: `house_id=eq.${memberRow.house_id}` }, () => loadAll(memberRow.house_id))
        .subscribe();
    })();

    return () => { if (channel) supabase.removeChannel(channel); };
  }, [loadAll, router]);

  return { loading, user, house, members, me, categories, expenses, meals, payments, notes, events, refresh: () => house && loadAll(house.id) };
}
