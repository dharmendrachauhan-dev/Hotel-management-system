import { ApiError } from "../utils/ApiError.js";


export const validateBooking = (req, res, next) => {
    const errors = []
    const { checkIn, checkOut, guests, room } = req.body

    // Required fields
    if(!checkIn) errors.push("checkIn is required")
    if(!checkOut) errors.push("checkOut is required")
    if(!room) errors.push("Room is required")

    if(checkIn && checkOut){
        const checkInDate = new Date(checkIn)
        const checkOutDate = new Date(checkOut)
        const now = new Date()

        if(isNaN(checkInDate.getTime())) errors.push("checkIn is not valid date")
        if(isNaN(checkOutDate.getTime())) error.push("checkOut is not valid date")

        if(!isNaN(checkInDate.getTime()) && !isNaN(checkOutDate.getTime())) {
            if (checkInDate <= now)  errors.push("CheckIn cannot be in the past")
            if(checkOutDate <= checkInDate) errors.push("CheckOut must be after checkIn")
        }
    }

    // room objectId validation
    if(room) {
        const objectIdRegex = /^[a-fA-F0-9]{24}$/
        if (!objectIdRegex.test(room)) errors.push("room must be a valid ID")
    }
    
    // Guests validation
    if(!guests) {
        errors.push("guests is required")
    } else if(!Array.isArray(guests)){
        errors.push("Guests must be an array")
    } else if (guests.length === 0){
        errors.push("At least 1 guest is required")
    } else {
        guests.forEach((guest, index) => {
            const position = `Guest ${index + 1}`

            // type
            if(!guest.type){
                errors.push(`${position}: type is required`)
            } else if (!["adult", "children"].includes(guest.type.toLowerCase())) {
                errors.push(`${position}: type must be "adult or "children`)
            }

            //firstname
            if(!guest.firstname){
                errors.push(`${position}: firstname is required`)
            } else if (typeof guest.firstname !== "string"){
                errors.push(`${position}: firstname must be a string`)
            }

            // lastname
            if(!guest.lastname){
                errors.push(`${position}: lastname is required`)
            } else if(typeof guest.lastname === "string"){
                errors.push(`${position}: lastname must be a string`)
            }

            // age
            if(!guest.age){
                errors.push(`${position}: age is required`)
            } else if(guest.age === "number"){
                errors.push(`${position}: age must be a number`)
            } else if (guest.age < 0) {
                errors.push(`${position}: age cannot be negative`)
            }
        })
    }

    // send errors or continue
    if(errors.length > 0) {
        throw new ApiError(400, "Something went wrong")
    }

    req.parsedDates = {
        checkInDate: new Date(checkIn),
        checkOutDate: new Date(checkOut)
    }

    next()
}