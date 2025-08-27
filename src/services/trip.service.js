import { supabase } from '../config/supabaseClient.js';
import { ApiError } from '../utils/ApiError.js';

const create = async (creatorId, name, description, currency) => {
  const { data, error } = await supabase.rpc('create_trip_and_add_admin', {
    creator_id: creatorId,
    trip_name: name,
    trip_description: description || null,
    trip_currency: currency.toUpperCase()
  });

  if (error) {
    if (error.code === '42883') {
      throw new ApiError(500, "Database function 'create_trip_and_add_admin' not found.");
    }
    throw new ApiError(500, 'An unexpected error occurred while creating the trip.', [error.message]);
  }
  return data;
};

const getAllForUser = async (userId) => {
    const { data, error } = await supabase
      .from('trip_participants')
      .select('trip:trips(*)')
      .eq('user_id', userId);

    if (error) {
        throw new ApiError(500, "Could not retrieve user trips.", [error.message]);
    }
    return data.map(item => item.trip);
}

const getParticipants = async (tripId) => {
    const { data, error } = await supabase
      .from('trip_participants')
      .select('role, joined_at, user:users(id, name, username, email)')
      .eq('trip_id', tripId);
    
    if (error) {
        throw new ApiError(500, "Could not retrieve trip participants.", [error.message]);
    }
    return data;
}

const addParticipants = async (tripId, identifiers) => {
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, username, email')
      .in('username', identifiers);
      
    if (usersError) {
        throw new ApiError(500, "Error finding users.", [usersError.message]);
    }
    if (users.length === 0) {
      throw new ApiError(404, 'No matching users found for the provided identifiers.');
    }

    const participantsToInsert = users.map(user => ({
      trip_id: tripId,
      user_id: user.id,
      role: 'member'
    }));

    const { data: newParticipants, error: insertError } = await supabase
      .from('trip_participants')
      .insert(participantsToInsert)
      .select('user:users(name, username)');

    if (insertError) {
      if (insertError.code === '23505') {
        throw new ApiError(409, 'One or more users are already in this trip.');
      }
      throw new ApiError(500, "Could not add participants.", [insertError.message]);
    }

    const addedUsernames = users.map(u => u.username);
    const notFoundIdentifiers = identifiers.filter(id => !addedUsernames.includes(id) && !users.some(u => u.email === id));

    return { newParticipants, notFoundIdentifiers };
}

const updateParticipantRole = async (tripId, participantId, role, adminUserId) => {
    if (adminUserId === participantId && role === 'member') {
        const { data: admins, error: adminCheckError } = await supabase
            .from('trip_participants')
            .select('user_id')
            .eq('trip_id', tripId)
            .eq('role', 'admin');

        if (adminCheckError) throw new ApiError(500, "Error checking admin status.", [adminCheckError.message]);
        if (admins.length === 1 && admins[0].user_id === participantId) {
            throw new ApiError(403, 'Cannot demote the last admin of the trip.');
        }
    }

    const { data, error } = await supabase
      .from('trip_participants')
      .update({ role: role })
      .match({ trip_id: tripId, user_id: participantId })
      .select('user:users(name), role')
      .single();

    if (error) {
        throw new ApiError(500, "Could not update participant role.", [error.message]);
    }
    if (!data) {
        throw new ApiError(404, "Participant not found in this trip.");
    }

    return data;
}

const removeParticipant = async (tripId, participantId, adminUserId) => {
    if (adminUserId === participantId) {
        const { data: admins, error: adminCheckError } = await supabase
            .from('trip_participants')
            .select('user_id')
            .eq('trip_id', tripId)
            .eq('role', 'admin');
        
        if (adminCheckError) throw new ApiError(500, "Error checking admin status.", [adminCheckError.message]);
        if (admins.length === 1 && admins[0].user_id === participantId) {
            throw new ApiError(403, 'Cannot remove the last admin. Please promote another member to admin first.');
        }
    }

    const { error } = await supabase
        .from('trip_participants')
        .delete()
        .match({ trip_id: tripId, user_id: participantId });

    if (error) {
        throw new ApiError(500, "Could not remove participant.", [error.message]);
    }

    return { message: 'Participant removed successfully from the trip.' };
}

const joinTrip = async (userId, tripId) => {
  const { data: tripExists, error: tripError } = await supabase
    .from('trips')
    .select('id')
    .eq('id', tripId)
    .single();

  if (tripError || !tripExists) {
    throw new ApiError(404, 'Trip not found with the provided ID.');
  }

  const { data, error } = await supabase
    .from('trip_participants')
    .insert({
      trip_id: tripId,
      user_id: userId,
      role: 'member'
    })
    .select('trip:trips(*)')
    .single();
    
  if (error) {
    if (error.code === '23505') { // unique_violation
      throw new ApiError(409, 'You are already a member of this trip.');
    }
    throw new ApiError(500, 'Could not join the trip.', [error.message]);
  }

  return data.trip;
};


export const tripService = {
  create,
  getAllForUser,
  getParticipants,
  addParticipants,
  updateParticipantRole,
  removeParticipant,
  joinTrip
};