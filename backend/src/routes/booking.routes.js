import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware";
import { validateBooking } from "../middlewares/validateBooking.middleware.js"
import { validateGuests } from "../middlewares/validateGuests.middleware.js"
import { createBooking } from "../controllers/booking.controller.js";



const router = Router()

// create booking
router.route("/").post(verifyJWT, validateBooking, validateGuests, createBooking)
//



export default router