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

const joinTrip = asyncHandler(async (req, res) => {
    const { tripId } = req.params;
    const userId = req.user.id;
    const joinedTrip = await tripService.joinTrip(userId, tripId);

    res.status(200).json(
        new ApiResponse(200, joinedTrip, 'Successfully joined the trip.')
    );
});

const getTripLocations = asyncHandler(async (req, res) => {
    const { tripId } = req.params;
    const locations = await tripService.getLocationsByTripId(tripId);
    res.status(200).json(
        new ApiResponse(200, locations, 'Trip locations fetched successfully.')
    );
});

const addTripLocations = asyncHandler(async (req, res) => {
    const { tripId } = req.params;
    const { locations } = req.body;
    const newLocations = await tripService.addLocations(tripId, locations);
    res.status(201).json(
        new ApiResponse(201, newLocations, 'Locations added successfully.')
    );
});

const updateTripLocation = asyncHandler(async (req, res) => {
    const { locationId } = req.params;
    const updateData = req.body;
    const updatedLocation = await tripService.updateLocation(locationId, updateData);
    res.status(200).json(
        new ApiResponse(200, updatedLocation, 'Location updated successfully.')
    );
});

const deleteTripLocation = asyncHandler(async (req, res) => {
    const { locationId } = req.params;
    await tripService.deleteLocation(locationId);
    res.status(200).json(
        new ApiResponse(200, null, 'Location deleted successfully.')
    );
});

const deleteTripLocationsByName = asyncHandler(async (req, res) => {
    const { tripId } = req.params;
    const { name } = req.body; // We'll get the name from the request body
    if (!name) {
        throw new ApiError(400, "Location name is required in the request body.");
    }
    await tripService.deleteLocationByName(tripId, name);
    res.status(200).json(
        new ApiResponse(200, null, `All instances of '${name}' were deleted.`)
    );
});

const clearTripSchedule = asyncHandler(async (req, res) => {
    const { tripId } = req.params;
    await tripService.clearSchedule(tripId);
    res.status(200).json(
        new ApiResponse(200, null, 'Trip schedule cleared successfully.')
    );
});

export { 
    createTrip, 
    getAllUserTrips,
    getTripParticipants,
    addTripParticipants,
    updateParticipantRole,
    removeParticipant,
    joinTrip,
    getTripLocations,
    addTripLocations,
    updateTripLocation,
    deleteTripLocation,
    deleteTripLocationsByName,
    clearTripSchedule
};