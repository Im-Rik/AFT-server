import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { expenseService } from '../../services/expense.service.js';

const addExpense = asyncHandler(async (req, res) => {
    const { tripId } = req.params;
    const result = await expenseService.add(tripId, req.body);
    res.status(201).json(
        new ApiResponse(201, result, "Expense added successfully.")
    );
});

export { addExpense };