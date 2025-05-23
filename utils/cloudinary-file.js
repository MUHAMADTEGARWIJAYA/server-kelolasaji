import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';



cloudinary.config({ 
        cloud_name: process.env.CLOUD_NAME, 
        api_key: process.env.CLOUD_API_KEY, 
        api_secret: process.env.CLOUD_API_SECRET,
    });

export const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "products",
        transformation: [
          { width: 500, height: 500, crop: "limit" },
          {fetch_format: "webp", quality: "auto"}
        ]
       }, // opsional: simpan di folder "products"
      (error, result) => {
        if (result) resolve(result);
        else reject(error);
      }
    );

    streamifier.createReadStream(fileBuffer).pipe(stream);
  });
};
