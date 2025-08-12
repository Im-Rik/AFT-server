import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { settlementService } from '../../services/settlement.service.js';

const addSettlement = asyncHandler(async (req, res) => {
    const { tripId } = req.params;
    const settlementDetails = { ...req.body, loggedInUserId: req.user.id };
    const result = await settlementService.add(tripId, settlementDetails);
    res.status(201).json(
        new ApiResponse(201, null, result.message)
    );
});

export { addSettlement };