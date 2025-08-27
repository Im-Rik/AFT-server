import { Router } from 'express';
import { 
    createTrip,
    getAllUserTrips,
    getTripParticipants,
    addTripParticipants,
    updateParticipantRole,
    removeParticipant,
    joinTrip
} from '../controllers/trip.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { isTripAdmin, isTripMember } from '../middlewares/trip.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { 
    createTripSchema, 
    addParticipantsSchema, 
    updateRoleSchema 
} from '../validation/trip.validation.js';

import expenseRouter from './expense.routes.js';
import settlementRouter from './settlement.routes.js';
import dashboardRouter from './dashboard.routes.js';

const router = Router();

router.use(verifyJWT);

router.route('/')
    .post(validate(createTripSchema), createTrip)
    .get(getAllUserTrips);

router.route('/:tripId/join')
    .post(joinTrip);

router.use('/:tripId/expenses', isTripMember, expenseRouter);
router.use('/:tripId/settlements', isTripMember, settlementRouter);
router.use('/:tripId/dashboard', isTripMember, dashboardRouter);

router.route('/:tripId/participants')
    .get(isTripMember, getTripParticipants)
    .post(isTripAdmin, validate(addParticipantsSchema), addTripParticipants);

router.route('/:tripId/participants/:participantId')
    .patch(isTripAdmin, validate(updateRoleSchema), updateParticipantRole)
    .delete(isTripAdmin, removeParticipant);


export default router;