import mongoose from "mongoose";

export const connectDb = async () => {
    await mongoose.connect("mongodb+srv://vaishnavitalewar876_db_user:salonivaishusaloni@cluster0.yezkbou.mongodb.net/techquizmaster")
        .then(() => {
            console.log("MongoDb connected successfully..!")
        })
}