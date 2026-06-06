import { v2 as cloudinary } from 'cloudinary'
import dotenv from 'dotenv'
import fs from 'fs'

dotenv({
    path: "./.env"
})

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET_KEY
});


export const uploadOnCloudinary = async (LocalFilePath) => {
    try {
        if(!LocalFilePath) return console.log("Localfile path not found.")
        const response = await cloudinary.v2.uploader.upload(LocalFilePath, 
            {
                resource_type: "image"
            }
        )

        fs.unlinkSync(LocalFilePath)
    
        return response
    } catch (error) {
        console.log("Error while uploading on cloudinary", error)
        fs.unlinkSync(LocalFilePath)
        return null
    }
}