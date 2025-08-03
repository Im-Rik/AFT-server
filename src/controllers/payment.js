import { formatInTimeZone } from 'date-fns-tz';
import { supabase } from '../config/supabaseClient.js';

export const addPayment = async (req, res) => {
  try {
    const { fromUserId, toUserId, amount, note } = req.body;

    const { error } = await supabase
      .from('payments')
      .insert({
        paid_by_user_id: fromUserId,
        paid_to_user_id: toUserId,
        amount,
        note,
        created_at: formatInTimeZone(new Date(), 'Asia/Kolkata', 'yyyy-MM-dd HH:mm:ssXXX')
      });
    
    if (error) throw error;
    res.status(201).json({ success: true });

  } catch (error) {
    console.error("Error adding payment:", error);
    res.status(500).json({ message: 'Could not save payment.' });
  }
};