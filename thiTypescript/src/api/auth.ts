import { instants } from ".";
import { signinForm, signupForm } from "./models";


export const signupData = (data: signupForm) => {
    const uri = ("/user")
    return instants.post(uri, data)
}

export const signin = (data: signinForm) => {
    const uri = ("/user")
    return instants.post(uri, data)
}