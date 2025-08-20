import { supabase } from '../config/supabaseClient.js';
import { ApiError } from '../utils/ApiError.js';

const add = async (tripId, expenseDetails) => {
    const { description, amount, category, subCategory, location, locationFrom, locationTo, paidByUserId, splitType, splits } = expenseDetails;

    const participantIds = [paidByUserId, ...splits.map(s => s.userId || s)];
    const { data: participants, error: participantError } = await supabase
      .from('trip_participants')
      .select('user_id')
      .eq('trip_id', tripId)
      .in('user_id', participantIds);

    if (participantError) {
        throw new ApiError(500, "Error verifying participants.", [participantError.message]);
    }
    if (participants.length !== new Set(participantIds).size) {
      throw new ApiError(403, 'One or more users are not participants of this trip.');
    }

    const numericAmount = Number(String(amount).replace(/,/g, ''));
    if (isNaN(numericAmount) || numericAmount <= 0) {
      throw new ApiError(400, 'Expense amount must be a positive number.');
    }

    const { data: expenseData, error: expenseError } = await supabase
      .from('expenses')
      .insert({
        trip_id: tripId,
        description,
        amount: numericAmount,
        category,
        sub_category: subCategory,
        location,
        location_from: locationFrom,
        location_to: locationTo,
        paid_by_user_id: paidByUserId,
      })
      .select()
      .single();

    if (expenseError) {
        throw new ApiError(500, "Could not create expense record.", [expenseError.message]);
    }
    const expenseId = expenseData.id;

    let splitRows = [];
    if (splitType === 'equal') {
      const userIdsInSplit = splits;
      const numPeople = userIdsInSplit.length;
      if (numPeople === 0) throw new ApiError(400, "Cannot split an expense among zero people.");
      
      const totalAmountInCents = Math.round(numericAmount * 100);
      const shareInCents = Math.floor(totalAmountInCents / numPeople);
      const remainderInCents = totalAmountInCents % numPeople;
      
      splitRows = userIdsInSplit.map((userId, index) => {
        let userShareInCents = shareInCents;
        if (index < remainderInCents) userShareInCents += 1;
        return {
          expense_id: expenseId,
          user_id: userId,
          amount: (userShareInCents / 100).toFixed(2)
        };
      });
    } else if (splitType === 'exact') {
      const totalSplitAmount = splits.reduce((sum, s) => sum + s.amount, 0);
      if (Math.abs(totalSplitAmount - numericAmount) > 0.01) {
          await supabase.from('expense').delete().eq('id', expenseId);
          throw new ApiError(400, "The sum of exact splits does not match the total expense amount.");
      }
      splitRows = splits.map(split => ({
        expense_id: expenseId,
        user_id: split.userId,
        amount: split.amount
      }));
    }

    const { error: splitsError } = await supabase.from('expense_splits').insert(splitRows);
    if (splitsError) {
      await supabase.from('expense').delete().eq('id', expenseId);
      throw new ApiError(500, "Could not create expense splits.", [splitsError.message]);
    }

    return { expenseId };
};

export const expenseService = {
    add
};