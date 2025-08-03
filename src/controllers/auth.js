import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabaseClient.js';

export const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required.' });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, name, role, hashed_password')
      .ilike('email', username)
      .single();

    if (error || !user) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    if (!user.hashed_password) {
      console.error(`User ${user.email} does not have a password set.`);
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.hashed_password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    const payload = { userId: user.id, email: user.email, name: user.name, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.status(200).json({ token });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'An error occurred during login.' });
  }
};