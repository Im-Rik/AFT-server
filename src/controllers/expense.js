import { formatInTimeZone } from 'date-fns-tz';
import { supabase } from '../config/supabaseClient.js';

export const addExpense = async (req, res) => {
  try {
    const { description, amount, category, subCategory, location, locationFrom, locationTo, paidByUserId, splitType, splits } = req.body;
    
    const numericAmount = Number(String(amount).replace(/,/g, ''));
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ message: 'Expense amount must be a positive number.' });
    }

    const { data: expenseData, error: expenseError } = await supabase
      .from('expenses')
      .insert({
        description,
        amount: numericAmount,
        category,
        sub_category: subCategory,
        location,
        location_from: locationFrom,
        location_to: locationTo,
        paid_by_user_id: paidByUserId,
        created_at: formatInTimeZone(new Date(), 'Asia/Kolkata', 'yyyy-MM-dd HH:mm:ssXXX')
      })
      .select()
      .single();

    if (expenseError) throw expenseError;
    const expenseId = expenseData.id;

    let splitRows = [];
    if (splitType === 'equal') {
      const numPeople = splits.length;
      if (numPeople === 0) throw new Error("Cannot split an expense among zero people.");
      
      const totalAmountInCents = Math.round(numericAmount * 100);
      const shareInCents = Math.floor(totalAmountInCents / numPeople);
      const remainderInCents = totalAmountInCents % numPeople;
      
      splitRows = splits.map((userId, index) => {
        let userShareInCents = shareInCents;
        if (index < remainderInCents) userShareInCents += 1;
        return {
          expense_id: expenseId,
          owed_by_user_id: userId,
          share_amount: (userShareInCents / 100).toFixed(2)
        };
      });
    } else if (splitType === 'exact') {
      splitRows = splits.map(split => ({
        expense_id: expenseId,
        owed_by_user_id: split.userId,
        share_amount: split.amount
      }));
    } else {
      return res.status(400).json({ message: 'Invalid split type' });
    }

    const { error: splitsError } = await supabase.from('splits').insert(splitRows);
    if (splitsError) throw splitsError;

    res.status(201).json({ success: true, expenseId });

  } catch (error) { 
    console.error("Error adding expense:", error); 
    res.status(500).json({ message: 'Could not add expense.' }); 
  }
};