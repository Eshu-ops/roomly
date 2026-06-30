// Pure functions — the financial logic of the app lives here so it's
// identical everywhere it's used (dashboard, balances page, reports).

export function totalMeals(meals, memberId) {
  return meals
    .filter((m) => !memberId || m.member_id === memberId)
    .reduce((s, m) => s + Number(m.breakfast) + Number(m.lunch) + Number(m.dinner) + Number(m.snacks), 0);
}

export function mealRate(expenses, categories, meals) {
  const foodCatIds = new Set(categories.filter((c) => c.is_food).map((c) => c.id));
  const foodTotal = expenses
    .filter((e) => foodCatIds.has(e.category_id))
    .reduce((s, e) => s + Number(e.amount), 0);
  const meals_ = totalMeals(meals);
  return meals_ > 0 ? foodTotal / meals_ : 0;
}

// Resolves what a single expense costs a given member, respecting split_mode
export function expenseShareForMember(expense, memberId, allMemberIds, splits) {
  if (expense.split_mode === 'equal') {
    return Number(expense.amount) / allMemberIds.length;
  }
  if (expense.split_mode === 'selected') {
    const group = expense.split_with || [];
    if (!group.includes(memberId)) return 0;
    return Number(expense.amount) / group.length;
  }
  // percentage / custom_amount resolved via expense_splits rows
  const row = (splits || []).find((s) => s.expense_id === expense.id && s.member_id === memberId);
  return row ? Number(row.share_amount) : 0;
}

// Full settlement for one member: owed total, paid total, net balance
export function memberShare({ memberId, members, categories, expenses, meals, payments, splits }) {
  const foodCatIds = new Set(categories.filter((c) => c.is_food).map((c) => c.id));
  const rate = mealRate(expenses, categories, meals);
  const myMeals = totalMeals(meals, memberId);
  const mealCost = myMeals * rate;

  const memberIds = members.map((m) => m.id);
  const nonFoodOwed = expenses
    .filter((e) => !foodCatIds.has(e.category_id))
    .reduce((s, e) => s + expenseShareForMember(e, memberId, memberIds, splits), 0);

  const owedTotal = mealCost + nonFoodOwed;

  const paidAsExpenses = expenses
    .filter((e) => e.paid_by === memberId)
    .reduce((s, e) => s + Number(e.amount), 0);
  const paidAsSettlements = payments
    .filter((p) => p.member_id === memberId)
    .reduce((s, p) => s + Number(p.amount), 0);
  const paid = paidAsExpenses + paidAsSettlements;

  return { owedTotal, paid, balance: paid - owedTotal, mealCost, nonFoodOwed, myMeals, rate };
}

export function totalsByCategory(expenses, categories) {
  const map = {};
  for (const c of categories) map[c.id] = { name: c.name, total: 0, count: 0, icon: c.icon };
  for (const e of expenses) {
    if (!map[e.category_id]) continue;
    map[e.category_id].total += Number(e.amount);
    map[e.category_id].count += 1;
  }
  return map;
}
