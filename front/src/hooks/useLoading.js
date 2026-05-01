import { useState } from "react";

export default function useLoading() {
    const [isLoading, setIsLoading] = useState(false);

    const loadingAction = async (action) => {
        setIsLoading(true);
        // action()
        setIsLoading(false);
    }
    return [isLoading, loadingAction];
}