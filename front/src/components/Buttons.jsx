import { FaPencilAlt, FaTrash, FaEye, FaMoneyBill } from "react-icons/fa";
import { TbLockOff } from "react-icons/tb";
import { TbEyeSearch } from "react-icons/tb";
import { useNavigate } from 'react-router-dom';
import { popup } from "@/hooks/Popup";
import state from "@/store";
import { aproveRefound, bloqUser, deleteItem, refound, sendRefound } from "@/hooks/ListasHook";
import ButtonMotion from "./FramerMotion/ButtonMotion";
import { FaMoneyCheckAlt } from 'react-icons/fa';
import { FaShareFromSquare } from "react-icons/fa6";
import { GiConfirmed } from "react-icons/gi";
import { updateCharge } from "@/utils/functions/api";

const Buttons = ({ type, value, modal, setInfo, info, setId, url, userId, confirm, resultDelete, titulo, revalidate, associado }) => {
    const navigate = useNavigate();
    const handleButtonClick = () => {
        if (type === "Edit") {
            console.log("INFO", info)
            if (setId) {
                setId(value)
            }
            setInfo(info)
            modal()
        } else if (type === 'Delete') {
            state.action = () => deleteItem(url, revalidate, resultDelete, titulo)
            popup(confirm, titulo)
            return
        }
        else if (type === 'Bloq') {
            bloqUser(userId)
            return
        }
        else if (type === 'Eye') {
            if (associado) {
                state.associadoCard = info
                localStorage.setItem('userCard', JSON.stringify(info));
                navigate("/associadoInfo")
                return
            }
            state.ofertaCard = info
            const ofertaCard = JSON.parse(JSON.stringify(state.ofertaCard))
            localStorage.setItem('ofertaCard', JSON.stringify(ofertaCard));
            navigate("/ofertasInfo")
            return
        }
        else if (type === 'Info') {
            console.log("INFO", info)
            if (setId) {
                setId(value)
            }
            setInfo(info)
            modal()
        }
        else if (type === 'Undo') {
            state.action = () => refound(url, revalidate)
            popup(confirm, titulo)
        }
        else if (type === 'Send') {
            state.action = () => sendRefound(url, revalidate)
            popup(confirm, titulo)
        }
        else if (type === 'Aprove') {
            state.action = () => aproveRefound(url, revalidate)
            popup(confirm, titulo)
        }
        else if (type === 'Quitar') {
            state.action = () => updateCharge(info, revalidate)
            popup(confirm, titulo)
        }
    };

    let icon;
    if (type === 'Edit') {
        icon = <FaPencilAlt />; // Ícone de editar
    } else if (type === 'Delete') {
        icon = <FaTrash />; // Ícone de deletar
    } else if (type === 'Bloq') {
        icon = <TbLockOff />; // Ícone de bloquear
    } else if (type === 'Eye') {
        icon = <TbEyeSearch />;
    } else if (type === 'Info') {
        icon = <FaEye />;
    } else if (type === 'Undo') {
        icon = <FaMoneyCheckAlt />
    } else if (type === 'Send') {
        icon = <FaShareFromSquare />
    } else if (type === 'Aprove') {
        icon = <GiConfirmed />
    }
    else if (type === 'Quitar') {
        icon = <FaMoneyBill />
    }
    else {
        icon = '?'; // Ícone desconhecido
    }

    return (
        <ButtonMotion className={`button${type}`} onClick={handleButtonClick} type="button">
            {icon}
        </ButtonMotion>
    );
};

export default Buttons;
