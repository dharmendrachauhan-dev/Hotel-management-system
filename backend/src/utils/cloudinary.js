import { v2 as cloudinary } from 'cloudinary'
import dotenv from 'dotenv'
import fs from 'fs'

dotenv.config({  // it loads the env
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
        const response = await cloudinary.uploader.upload(LocalFilePath, 
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

export const deleteFromCloudinary = async (
    public_id,
    resource_type = "image"
) => {
    try {
        if(!public_id) {
            console.log("Delete failed: No public_id provided")
            return null
        }

        const response = await cloudinary.uploader.destroy(
            public_id,
            {
                resource_type
            }
        )
        console.log("cloudinary delete Response => ", response)
        if(response.result === "ok"){
           return response
        } else{
            console.log(`Cloudinary deletion failed with status: ${response.result}`)
            return null
        }

        return response
    } catch (error) {
       console.log("Error during delting cloudinary", error) 
       return null
    }
}