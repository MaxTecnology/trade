import { Navigate, Outlet } from "react-router-dom";
import { useSnapshot } from "valtio";
import state from "../store";
import { useQueryLogin } from "@/hooks/ReactQuery/useQueryLogin";
import { useEffect } from "react";

const IsAuth = () => {
    const { data, isLoading } = useQueryLogin();
    const snap = useSnapshot(state);

    useEffect(() => {
        if (data) {
            state.logged = true
        }
    }, [data]);

    if (snap.logged || state.logged) {
        return <Navigate to="/" replace />;
    }
    if (isLoading) {
        return null
    }
    return data ? <Navigate to="/" replace /> : <Outlet />
}

export default IsAuth;

