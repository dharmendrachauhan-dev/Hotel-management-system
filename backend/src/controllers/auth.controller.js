import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiRespose.js"
import { User } from "../models/users.models.js"
import { generateAccessToken } from "../controllers/user.controller.js"

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI



const googleRedirect  = asyncHandler(async (req, res) => {
    const params = new URLSearchParams({
        client_id : CLIENT_ID,
        redirect_uri : REDIRECT_URI,
        response_type : "code",
        scope : "openid email profile",
        access_type : "offline",
        prompt: "consent"
    })

    res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`)
})



const googleCallback = asyncHandler (async (req, res) => {
    const { code } = req.query;
    if(!code) throw new ApiError(400, "Authorization code missing")

    const tokenRes = await fetch("https://oauth2.googleapis.com/token",
    {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            code,
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            redirect_uri: REDIRECT_URI,
            grant_type: "authorization_code"
        })
    });
    const tokens = await tokenRes.json()
    if(!tokens.access_token){
        throw new ApiError(401, "Failed to get token from Google")
    }

    const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo",
        {
            headers: {
                Authorization: `Bearer ${tokens.access_token}`
            }
        }
    )

    const googleUser = await userRes.json();

    let user = await User.findOne({email: googleUser.email })

    if(!user){
        user = await User.create({
            googleId: googleUser.id,
            email: googleUser.email,
            name: googleUser.name,
            authProviders: "google"
        })
    } else if(!user.googleId){
        user.googleId = googleUser.id;
        user.authProviders = "google";
        await user.save();
    }

    const accessToken = user.generateAccessToken()

    const secure = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {user, accessToken},
            "Google login successful"
        )
    )
})

export{
    googleRedirect ,
    googleCallback,
}