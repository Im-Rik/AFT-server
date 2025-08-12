import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { tripService } from '../../services/trip.service.js';

const createTrip = asyncHandler(async (req, res) => {
    const { name, description, currency } = req.body;
    const creatorId = req.user.id;
    const newTrip = await tripService.create(creatorId, name, description, currency);
    res.status(201).json(
        new ApiResponse(201, newTrip, 'Trip created successfully.')
    );
});

const getAllUserTrips = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const trips = await tripService.getAllForUser(userId);
    res.status(200).json(
        new ApiResponse(200, trips, 'User trips fetched successfully.')
    );
});

const getTripParticipants = asyncHandler(async (req, res) => {
    const { tripId } = req.params;
    const participants = await tripService.getParticipants(tripId);
    res.status(200).json(
        new ApiResponse(200, participants, 'Trip participants fetched successfully.')
    );
});

const addTripParticipants = asyncHandler(async (req, res) => {
    const { tripId } = req.params;
    const { identifiers } = req.body;
    const { newParticipants, notFoundIdentifiers } = await tripService.addParticipants(tripId, identifiers);
    
    let message = `${newParticipants.length} user(s) added successfully.`;
    if (notFoundIdentifiers.length > 0) {
      message += ` The following identifiers were not found: ${notFoundIdentifiers.join(', ')}.`;
    }

    res.status(201).json(
        new ApiResponse(201, { added: newParticipants, notFound: notFoundIdentifiers }, message)
    );
});

const updateParticipantRole = asyncHandler(async (req, res) => {
    const { tripId, participantId } = req.params;
    const { role } = req.body;
    const adminUserId = req.user.id;
    const updatedParticipant = await tripService.updateParticipantRole(tripId, participantId, role, adminUserId);

    const message = `${updatedParticipant.user.name}'s role has been updated to ${updatedParticipant.role}.`;
    res.status(200).json(
        new ApiResponse(200, updatedParticipant, message)
    );
});

const removeParticipant = asyncHandler(async (req, res) => {
    const { tripId, participantId } = req.params;
    const adminUserId = req.user.id;
    const result = await tripService.removeParticipant(tripId, participantId, adminUserId);
    res.status(200).json(
        new ApiResponse(200, null, result.message)
    );
});


export { 
    createTrip, 
    getAllUserTrips,
    getTripParticipants,
    addTripParticipants,
    updateParticipantRole,
    removeParticipant
};