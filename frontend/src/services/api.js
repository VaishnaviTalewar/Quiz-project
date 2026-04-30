import axios from "axios";
import {useAuth} from "@clerk/react";

 const BASE_URL = "http://localhost:8080/api";

 //axios instance
 const apiClient = axios.create({
    baseURL: BASE_URL,
    headers:{
        "Content-Type":"application/json"
    }
 })

 export const useApi = () =>{
    const {getToken} = useAuth();
    const request = async (endpoint, method="GET",body=null)=>{
        const token = await getToken();

        const config = {
            url: endpoint,
            method: method.toUpperCase(),
            data: body,
            headers: token ? {Authorization:`Bearer ${token}` } : {}
        }
        try {
            const response = await apiClient(config)
            return response.data
        } catch (error) {
            console.error("AIXOS ERROR:",error.response?.data || error.message);
            throw new Error(error.response?.data?.message || "API ERROR")
        }
    }
    return {request}
 }