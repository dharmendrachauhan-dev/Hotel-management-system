import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiRespose.js";
import { jsx } from "react/jsx-runtime";


const allowedMethod = ["Card", "UPI", "Cash", "Net Banking"]
const allowedStatus = ["Pending", "Completed", "Failed", "Refunded"]

const createpayment = asyncHandler(async (req, res) => {
    // todo
    /**
     step 1 => validate bookingId from req.body
                mongoose.types.objectId.isValid()

    step 2 => check booking exists Booking.findById(bookingId) => 404 if not found

    step 3 => check requester owns this booking
        booking.user.toString() === req.user._id.toString()

    step 4 => check booking is not already paid
        if booking.paymentStatus === "Paid" => 409
        if not => 403

    step 5 => validate amount, paymentMethod , transactionId
        amount => must equal booking.totalPrice
        paymentMethod => must be one enum
        transactionId => must be unique (schema handles, but check first for error)
    
    step 6 => create payment with status "Pending" or "Completed"
        (depends on your payment gateway flow)

    step 7 => if status is "Completed"
        update booking.paymentStatus => "Paid"
        update booking.bookingStatus => "Confirmed"

    step 8 => return response
     */

    const { bookingId } = req.body

    if(!mongoose.Types.ObjectId.isValid(bookingId)){
        throw new ApiError(400, "Invalid bookingId")
    }

    const booking = await Booking.findById(bookingId)
    if(!booking){
        throw new ApiError(400, "Booking not found")
    }

    const isOwner = booking.user.toString() === req.user._id.toString()
    if(!isOwner){
        throw new ApiError(403, "You are not allowed to do payment")
    }

    const isPaid = booking.paymentStatus === "Paid"
    if(!isPaid){
        throw new ApiError(403, "This booking already paid")
    }

    if(amount === undefined || amount === null){
        throw new ApiError(400, "amount is required")
    }

    if(amount < 0){
        throw new ApiError(400, "amount cannot be negative")
    }

    if(typeof amount === "number"){
        throw new ApiError(400, "amount must be number")
    }

    if(amount !== booking.totalPrice) {
        // ensuring the amount must be match the total price of room
        throw new ApiError(400, `amount must match booking total price: ${booking.totalPrice}`)
    }

    if(!paymentMethod){
        throw new ApiError(403, "payment is required")
    }

    if(!allowedMethod.includes(paymentMethod)){
        throw new ApiError(403, `PaymentMethods must be includes in this payment method ${allowedMethod.join(", ")}`)
    }

    if(!transactionId){
        throw new ApiError(403, "transactionId is required")
    }

    const existingTxn = await Payment.findOne({ transactionId })
    if(existingTxn){
        throw new ApiError(409, "transactionId already used")
    }

    // create payment
    const payment = await Payment.create({
        booking: bookingId,
        amount,
        paymentMethod,
        transactionId,
        status: "Completed" // in real apps this comes from a payment gateway webhook
        // for learning purposes, we mark it completed directly
    })

    // sync booking status
    await Booking.findByIdAndUpdate(
        bookingId,
        {
            paymentStatus: "Paid",
            bookingStatus: "Confirmed"
        }
    )

    return res
    .status(201)
    .json(
        new ApiResponse(
            201,
            payment,
            "Payment recorded successfully"
        )
    )
})