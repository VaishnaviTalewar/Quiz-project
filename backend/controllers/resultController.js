import {Result} from "../models/resultModel.js";
import { getAuth } from '@clerk/express';

//create a result
export const CreatemyResult = async (req, res) => {
    try {
        const { userId } = getAuth(req);
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized", error: "Unauthorized" });
        }
        const result = await Result.create({
            ...req.body,
            userId
        });
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error: error.message });
        console.log("CREATE RESULT ERROR...!😢")
    }
}

//to get result for that logged in id

export const getMyResult = async (req,res)=>{
    const {userId} = getAuth(req);
    const result = await Result.find(({userId})).sort({createAt: -1});

    res.json(result)
}