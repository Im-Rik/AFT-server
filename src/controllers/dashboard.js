import { supabase } from '../config/supabaseClient.js';

export const getDashboardData = async (req, res) => {
  try {
    const loggedInUserId = req.user.userId;

    const [
      { data: users, error: usersError },
      { data: expensesData, error: expensesError },
      { data: splitsData, error: splitsError },
      { data: paymentsData, error: paymentsError }
    ] = await Promise.all([
      supabase.from('users').select('id, name'),
      supabase.from('expenses').select('*, paid_by_user:users(name)'),
      supabase.from('splits').select('*, owed_by_user:users(name)'),
      supabase.from('payments').select('*, paid_by_user:paid_by_user_id(name), paid_to_user:paid_to_user_id(name)')
    ]);

    if (usersError || expensesError || splitsError || paymentsError) {
      throw usersError || expensesError || splitsError || paymentsError;
    }
    
    const userMap = users.reduce((acc, user) => ({ ...acc, [user.id]: user.name }), {});

    const personToPersonPayments = paymentsData.map(p => ({
        id: p.id,
        date: p.created_at,
        paidByUserId: p.paid_by_user_id,
        paidToUserId: p.paid_to_user_id,
        amount: parseFloat(p.amount),
        note: p.note,
        paidByUserName: p.paid_by_user.name,
        paidToUserName: p.paid_to_user.name
    }));

    const expenseAsPayments = expensesData.map(row => {
      let locationText = '';
      if (row.category === 'Transport') {
          const from = row.location_from || '';
          const to = row.location_to || '';
          if (from && to) locationText = `${from} → ${to}`;
      } else {
          if (row.location) locationText = `Location: ${row.location}`;
      }
      
      return {
        id: row.id,
        date: row.created_at,
        paidByUserId: row.paid_by_user_id,
        paidToUserId: null,
        amount: parseFloat(row.amount),
        note: locationText, 
        paidByUserName: row.paid_by_user.name,
        paidToUserName: row.description,
      };
    });

    const combinedPayments = [...personToPersonPayments, ...expenseAsPayments];

    const detailedDebts = {};
    users.forEach(u1 => {
      detailedDebts[u1.id] = {};
      users.forEach(u2 => {
        if (u1.id !== u2.id) detailedDebts[u1.id][u2.id] = 0;
      });
    });

    expensesData.forEach(exp => {
      const payerId = exp.paid_by_user_id;
      const splitsForThisExpense = splitsData.filter(s => s.expense_id === exp.id);
      splitsForThisExpense.forEach(split => {
        const owedById = split.owed_by_user_id;
        const shareAmount = parseFloat(split.share_amount);
        if (payerId !== owedById) {
          detailedDebts[owedById][payerId] += shareAmount;
        }
      });
    });
    
    paymentsData.forEach(p => {
        const fromUserId = p.paid_by_user_id;
        const toUserId = p.paid_to_user_id;
        const paymentAmount = parseFloat(p.amount);
        if (detailedDebts[fromUserId] && detailedDebts[fromUserId][toUserId] !== undefined) {
            detailedDebts[fromUserId][toUserId] -= paymentAmount;
        }
    });

    const finalDetailedDebts = [];
    users.forEach(u1 => {
        users.forEach(u2 => {
            if (u1.id < u2.id) {
                const debt1to2 = detailedDebts[u1.id][u2.id] || 0;
                const debt2to1 = detailedDebts[u2.id][u1.id] || 0;
                const netDebt = debt1to2 - debt2to1;
                if (netDebt > 0.01) {
                    finalDetailedDebts.push({ from: u1.id, fromName: userMap[u1.id], to: u2.id, toName: userMap[u2.id], amount: netDebt });
                } else if (netDebt < -0.01) {
                    finalDetailedDebts.push({ from: u2.id, fromName: userMap[u2.id], to: u1.id, toName: userMap[u1.id], amount: -netDebt });
                }
            }
        });
    });

    const splitsByExpenseId = splitsData.reduce((acc, split) => {
        if (!acc[split.expense_id]) acc[split.expense_id] = [];
        acc[split.expense_id].push({ 
          userId: split.owed_by_user_id, 
          userName: split.owed_by_user.name,
          amount: parseFloat(split.share_amount) 
        });
        return acc;
    }, {});

    const expenses = expensesData.map(row => ({
      id: row.id,
      date: row.created_at,
      description: row.description,
      category: row.category,
      subCategory: row.sub_category,
      location: row.location,
      locationFrom: row.location_from,
      locationTo: row.location_to,
      amount: parseFloat(row.amount),
      paidByUserId: row.paid_by_user_id,
      paidByUserName: row.paid_by_user.name,
      splitDetails: {
          participants: splitsByExpenseId[row.id] || []
      }
    }));

    const spendingSummary = {};
    users.forEach(u => { spendingSummary[u.id] = { name: u.name, totalSpending: 0 }; });
    splitsData.forEach(split => {
      const owedByUserId = split.owed_by_user_id;
      const shareAmount = parseFloat(split.share_amount);
      if (spendingSummary[owedByUserId]) {
        spendingSummary[owedByUserId].totalSpending += shareAmount;
      }
    });
    const spendingSummaryArray = Object.values(spendingSummary).sort((a, b) => b.totalSpending - a.totalSpending);

    const netBalances = {};
    users.forEach(u => netBalances[u.id] = 0);
    expensesData.forEach(exp => {
      const amount = parseFloat(exp.amount), paidBy = exp.paid_by_user_id;
      if (netBalances[paidBy] !== undefined) netBalances[paidBy] += amount;
    });
    splitsData.forEach(split => {
      const owedBy = split.owed_by_user_id, shareAmount = parseFloat(split.share_amount);
      if (netBalances[owedBy] !== undefined) netBalances[owedBy] -= shareAmount;
    });
    paymentsData.forEach(p => {
      const fromUserId = p.paid_by_user_id, toUserId = p.paid_to_user_id, paymentAmount = parseFloat(p.amount);
      if (netBalances[fromUserId] !== undefined) netBalances[fromUserId] -= paymentAmount;
      if (netBalances[toUserId] !== undefined) netBalances[toUserId] += paymentAmount;
    });

    const debtors = [], creditors = [];
    Object.entries(netBalances).forEach(([userId, balance]) => {
      if (balance < -0.01) debtors.push({ userId, amount: -balance });
      if (balance > 0.01) creditors.push({ userId, amount: balance });
    });
    const groupSettlements = [];
    while (debtors.length > 0 && creditors.length > 0) {
      debtors.sort((a, b) => b.amount - a.amount);
      creditors.sort((a, b) => b.amount - a.amount);
      const debtor = debtors[0], creditor = creditors[0];
      const amount = Math.min(debtor.amount, creditor.amount);
      groupSettlements.push({ from: debtor.userId, to: creditor.userId, fromName: userMap[debtor.userId], toName: userMap[creditor.userId], amount });
      debtor.amount -= amount;
      creditor.amount -= amount;
      if (debtor.amount < 0.01) debtors.shift();
      if (creditor.amount < 0.01) creditors.shift();
    }

    const youOwe = { total: 0, breakdown: [] };
    const youAreOwed = { total: 0, breakdown: [] };
    finalDetailedDebts.forEach(s => {
      if (s.from === loggedInUserId) {
        youOwe.breakdown.push({ to: s.toName, amount: s.amount });
      }
      if (s.to === loggedInUserId) {
        youAreOwed.breakdown.push({ fromName: s.fromName, amount: s.amount });
      }
    });
    youOwe.total = youOwe.breakdown.reduce((sum, item) => sum + item.amount, 0);
    youAreOwed.total = youAreOwed.breakdown.reduce((sum, item) => sum + item.amount, 0);

    res.json({
      users, 
      expenses, 
      payments: combinedPayments,
      spendingSummary: spendingSummaryArray,
      balances: {
        youOwe,
        youAreOwed,
        groupSettlements,
        groupDebts: finalDetailedDebts
      }
    });

  } catch (error) {
    console.error('--- DETAILED DASHBOARD ERROR ---');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    console.error('--------------------------------');
    res.status(500).json({ 
        message: 'Could not fetch dashboard data.',
        error: error.message 
    });
  }
};