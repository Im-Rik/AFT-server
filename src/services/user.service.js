import { supabase } from '../config/supabaseClient.js';
import { ApiError } from '../utils/ApiError.js';

const getAll = async () => {
    const { data, error } = await supabase
        .from('users')
        .select('id, name, role');
    if (error) {
        throw new ApiError(500, "Could not fetch users.", [error.message]);
    };
    return data;
}

export const userService = {
    getAll
};