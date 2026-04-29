import { useAuth } from "@clerk/clerk-react";

const BASE_URL = "http://localhost:8080/api";

export const apiRequest = async (
    endpoint,
    method = "GET",
    body = null,
    token = null,
) => {
    const options = {
        method,
        headers: {
            "Content-Type": "application/json"
        }
    }
    //attach token
    if (token) {
        options.headers.Authorization = `Bearer ${token}`
    }
    if (body) {
        options.body = JSON.stringify(body)
    }
    const res = await fetch(`${BASE_URL}${endpoint}`,options);
    if(!res.ok){
        const errorData = await res.json().catch(()=>({}));
        throw new Error(errorData.message || "API ERROR")
    }
    return res.json();
};

//useApi

export const useApi = () =>{
    const {getToken} = useAuth()
    const request = async (endpoint,method="GET",body = null) =>{
        const token = await getToken();
        return apiRequest(endpoint,method,body,token)
    }
    return {request};
}