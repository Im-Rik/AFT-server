export const calculateDetailedDebts = (expenses, splits, users) => {
    const detailedDebts = {};
    users.forEach(u1 => {
        detailedDebts[u1.id] = {};
        users.forEach(u2 => { if (u1.id !== u2.id) detailedDebts[u1.id][u2.id] = 0; });
    });

    if (expenses.length > 0 && splits.length > 0) {
        expenses.forEach(exp => {
          const payerId = exp.paid_by_user_id;
          const splitsForThisExpense = splits.filter(s => s.expense_id === exp.id);
          splitsForThisExpense.forEach(split => {
            const owedById = split.user_id;
            const shareAmount = parseFloat(split.amount);
            if (payerId !== owedById) { detailedDebts[owedById][payerId] += shareAmount; }
          });
        });
    }
    return detailedDebts;
};

export const applySettlementsToDebts = (detailedDebts, settlements) => {
    if (settlements.length > 0) {
        settlements.forEach(s => {
            const fromUserId = s.from_user_id;
            const toUserId = s.to_user_id;
            const settlementAmount = parseFloat(s.amount);
            if (detailedDebts[fromUserId] && detailedDebts[fromUserId][toUserId] !== undefined) {
                detailedDebts[fromUserId][toUserId] -= settlementAmount;
            }
        });
    }
    return detailedDebts;
};

export const simplifyDebts = (detailedDebts, users, userMap) => {
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
    return finalDetailedDebts;
};

export const calculateSpendingSummary = (splits, users) => {
    const spendingSummary = {};
    users.forEach(u => { spendingSummary[u.id] = { name: u.name, totalSpending: 0 }; });
    if(splits.length > 0) {
        splits.forEach(split => {
          const owedByUserId = split.user_id;
          const shareAmount = parseFloat(split.amount);
          if (spendingSummary[owedByUserId]) { spendingSummary[owedByUserId].totalSpending += shareAmount; }
        });
    }
    return Object.values(spendingSummary).sort((a, b) => b.totalSpending - a.totalSpending);
};

export const calculateNetBalances = (expenses, splits, settlements, users) => {
    const netBalances = {};
    users.forEach(u => netBalances[u.id] = 0);

    expenses.forEach(exp => {
        const amount = parseFloat(exp.amount);
        const paidBy = exp.paid_by_user_id;
        if (netBalances[paidBy] !== undefined) netBalances[paidBy] += amount;
    });

    splits.forEach(split => {
        const owedBy = split.user_id;
        const shareAmount = parseFloat(split.amount);
        if (netBalances[owedBy] !== undefined) netBalances[owedBy] -= shareAmount;
    });

    settlements.forEach(s => {
        const fromUserId = s.from_user_id;
        const toUserId = s.to_user_id;
        const paymentAmount = parseFloat(s.amount);
        if (netBalances[fromUserId] !== undefined) netBalances[fromUserId] -= paymentAmount;
        if (netBalances[toUserId] !== undefined) netBalances[toUserId] += paymentAmount;
    });

    return netBalances;
};

export const generateSettlementPlan = (netBalances, userMap) => {
    const debtors = [];
    const creditors = [];
    Object.entries(netBalances).forEach(([userId, balance]) => {
      if (balance < -0.01) debtors.push({ userId, amount: -balance });
      if (balance > 0.01) creditors.push({ userId, amount: balance });
    });

    const groupSettlements = [];
    while (debtors.length > 0 && creditors.length > 0) {
      const debtor = debtors.sort((a, b) => b.amount - a.amount)[0];
      const creditor = creditors.sort((a, b) => b.amount - a.amount)[0];
      const amount = Math.min(debtor.amount, creditor.amount);
      groupSettlements.push({ from: debtor.userId, to: creditor.userId, fromName: userMap[debtor.userId], toName: userMap[creditor.userId], amount });
      debtor.amount -= amount;
      creditor.amount -= amount;
      if (debtor.amount < 0.01) debtors.shift();
      if (creditor.amount < 0.01) creditors.shift();
    }
    return groupSettlements;
};