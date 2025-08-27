import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { dashboardService } from '../../services/dashboard.service.js';

const getDashboardData = asyncHandler(async (req, res) => {
    const { tripId } = req.params;
    const loggedInUserId = req.user.id;

    const rawDashboardData = await dashboardService.getForTrip(tripId);

    const dashboardData = {
        ...rawDashboardData,
        balances: {
            youOwe: rawDashboardData.balances.youOwe(loggedInUserId),
            youAreOwed: rawDashboardData.balances.youAreOwed(loggedInUserId),
            groupSettlements: rawDashboardData.balances.groupSettlements
        }
    };
    
    res.status(200).json(
        new ApiResponse(200, dashboardData, "Dashboard data fetched successfully.")
    );
});

export { getDashboardData };