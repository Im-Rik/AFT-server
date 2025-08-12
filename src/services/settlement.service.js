import { supabase } from '../config/supabaseClient.js';
import { ApiError } from '../utils/ApiError.js';

const add = async (tripId, settlementDetails) => {
    const { fromUserId, toUserId, amount, method, note, loggedInUserId } = settlementDetails;

    if (fromUserId !== loggedInUserId) {
        throw new ApiError(403, 'You can only record payments that you have made.');
    }
    if (fromUserId === toUserId) {
        throw new ApiError(400, 'Cannot make a payment to yourself.');
    }

    const { error } = await supabase
      .from('settlements')
      .insert({
        trip_id: tripId,
        from_user_id: fromUserId,
        to_user_id: toUserId,
        amount,
        method: method || 'Other',
        note,
      });
    
    if (error) {
        throw new ApiError(500, 'Could not save settlement record.', [error.message]);
    }

    return { message: 'Settlement recorded successfully.' };
}

export const settlementService = {
    add
};