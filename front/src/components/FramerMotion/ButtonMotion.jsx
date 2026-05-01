import { motion } from "framer-motion";

const ButtonMotion = ({ onClick, className, children, type }) => {
    return (
        <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
                type: "spring",
                stiffness: 260,
                damping: 20
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.5 }}
            onClick={onClick}
            className={className}
            type={type}
        >
            {children}
        </motion.button>
    )
};

export default ButtonMotion;
