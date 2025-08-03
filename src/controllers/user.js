import { supabase } from '../config/supabaseClient.js';

export const getUserProfile = (req, res) => {
  res.json({ user: req.user });
};

export const getAllUsers = async (req, res) => {
  try {
    const { data, error } = await supabase
        .from('users')
        .select('id, name, role');
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error("ERROR FETCHING USERS:", error);
    res.status(500).json({ message: 'Could not fetch users.' });
  }
};