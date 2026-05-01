import axios from "axios";
import state from "../store";

const mainUrl = `${state.url}`
const config = {
    headers: {
        Authorization: `Bearer ${localStorage.getItem('tokenRedeTrade')}`
    }
};

export const getUserInfo = async () => {
    return axios.get(`${mainUrl}usuarios/user-info`, config)
        .then((response) => {
            state.user = response.data
            state.logged = true
            console.log(response.data)
            return true
        }).catch((error) => {
            console.log("erro no login", error)
            return false
        })
}