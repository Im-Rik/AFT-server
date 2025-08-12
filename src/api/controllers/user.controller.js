import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { userService } from '../../services/user.service.js';

const getUserProfile = asyncHandler(async (req, res) => {
    res.status(200).json(new ApiResponse(200, req.user, "User profile fetched successfully."));
});

const getAllUsers = asyncHandler(async (req, res) => {
    const users = await userService.getAll();
    res.status(200).json(new ApiResponse(200, users, "All users fetched successfully."));
});

export { getUserProfile, getAllUsers };