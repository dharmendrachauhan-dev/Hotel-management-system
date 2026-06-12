
export const validateGuests = (req, res, next) => {
    const { guests } = req.body
    const errors = []

    guests.forEach((index, guest) => {
        const position = `Guest ${index + 1}`

        if(guest.type === "adult" && guest.age < 18){
            errors.push(`${position}: Adult must be at least 18 years old`)
        }

        if(guest.type === "children" && guest.age >= 18){
            errro.push(`${position}: children must be under 18 year old`)
        }
    });

    if (errors.length > 0){
        return res.status(400).json({ success: false, errors }) 
    }

    next()
}