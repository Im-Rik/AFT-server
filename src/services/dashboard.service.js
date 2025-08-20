import { supabase } from '../config/supabaseClient.js';
import { ApiError } from '../utils/ApiError.js';
import {
    calculateDetailedDebts,
    applySettlementsToDebts,
    simplifyDebts,
    calculateSpendingSummary,
    calculateNetBalances,
    generateSettlementPlan
} from '../utils/dashboardCalculations.js';

const getForTrip = async (tripId) => {
    const { data: participantsData, error: participantsError } = await supabase
      .from('trip_participants')
      .select('role, user:users(id, name, username, email)')
      .eq('trip_id', tripId);

    if (participantsError) {
        throw new ApiError(500, "Could not fetch participants", [participantsError.message]);
    }

    if (!participantsData || participantsData.length === 0) {
      return { 
          participants: [], spendingSummary: [], expenses: [], settlements: [], splits: [],
          balances: { youOwe: {total: 0, breakdown: []}, youAreOwed: {total: 0, breakdown: []}, groupSettlements: [], groupDebts: [] }
      };
    }
    
    const users = participantsData.map(p => p.user);
    const userMap = users.reduce((acc, user) => ({ ...acc, [user.id]: user.name }), {});

    const [expensesResult, settlementsResult] = await Promise.all([
        supabase.from('expenses').select('*, paid_by_user:users!paid_by_user_id(name)').eq('trip_id', tripId),
        supabase.from('settlements').select('*, from_user:users!from_user_id(name), to_user:users!to_user_id(name)').eq('trip_id', tripId)
    ]);

    if (expensesResult.error) throw new ApiError(500, "Could not fetch expenses.", [expensesResult.error.message]);
    if (settlementsResult.error) throw new ApiError(500, "Could not fetch settlements.", [settlementsResult.error.message]);

    const expensesData = expensesResult.data || [];
    const settlementsData = settlementsResult.data || [];
    
    let splitsData = [];
    if (expensesData.length > 0) {
        const expenseIds = expensesData.map(e => e.id);
        const { data, error } = await supabase.from('expense_splits').select('*, owed_by_user:users!user_id(name)').in('expense_id', expenseIds);
        if (error) throw new ApiError(500, "Could not fetch expense splits.", [error.message]);
        splitsData = data || [];
    }

    let detailedDebts = calculateDetailedDebts(expensesData, splitsData, users);
    detailedDebts = applySettlementsToDebts(detailedDebts, settlementsData);
    
    const finalDetailedDebts = simplifyDebts(detailedDebts, users, userMap);
    const spendingSummaryArray = calculateSpendingSummary(splitsData, users);
    const netBalances = calculateNetBalances(expensesData, splitsData, settlementsData, users);
    const groupSettlements = generateSettlementPlan(netBalances, userMap);
    
    const youOwe = (loggedInUserId) => {
        const breakdown = finalDetailedDebts
            .filter(s => s.from === loggedInUserId)
            .map(s => ({ to: s.to, toName: s.toName, amount: s.amount }));
        const total = breakdown.reduce((sum, item) => sum + item.amount, 0);
        return { total, breakdown };
    };
    
    const youAreOwed = (loggedInUserId) => {
        const breakdown = finalDetailedDebts
            .filter(s => s.to === loggedInUserId)
            .map(s => ({ from: s.from, fromName: s.fromName, amount: s.amount }));
        const total = breakdown.reduce((sum, item) => sum + item.amount, 0);
        return { total, breakdown };
    };
    
    return {
      participants: participantsData,
      spendingSummary: spendingSummaryArray,
      balances: { youOwe, youAreOwed, groupSettlements, groupDebts: finalDetailedDebts },
      expenses: expensesData, 
      settlements: settlementsData, 
      splits: splitsData,
    };
};

export const dashboardService = {
    getForTrip
};