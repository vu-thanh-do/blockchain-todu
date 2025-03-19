import { instants } from "."
import { AddForm, updateForm } from "./models"


export const getAll = () => {
    const uri = "/products"
    return instants.get(uri)
}

export const getId = (id:string) => {
    const uri = "/products/" + id
    return instants.get(uri)
}

export const create = (body:AddForm) => {
    const uri = "/products"
    return instants.post(uri,body)
}

export const update = (id:string,body:updateForm) => {
    const uri = "/products/" + id
    return instants.put(uri,body)
}

export const remove = (id:string) => {
    const uri = "/products/" + id
    return instants.delete(uri)
}