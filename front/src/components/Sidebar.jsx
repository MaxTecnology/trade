import { useState } from "react";
import userImage from "../assets/images/mini-logo.jpeg";
import { useNavigate } from "react-router-dom";
import { PiListFill } from "react-icons/pi";
import {
  FaHome,
  FaUsers,
  FaBuilding,
  FaHandshake,
  FaTags,
  FaPercentage,
  FaHandHoldingUsd,
  FaAdjust,
  FaUserPlus,
  FaSignOutAlt,
  FaSearch,
  FaFileInvoiceDollar,
} from "react-icons/fa";
import { BsBookmarkFill, BsCashCoin } from "react-icons/bs";
import ModalContent from "../Modals/ModalContent";
import state from "../store";
import { getType } from "../hooks/getId";
import { useSnapshot } from "valtio";
import ModalMotion from "./FramerMotion/ModalMotion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { truncarTexto } from "@/utils/functions";

const Sidebar = () => {
  useSnapshot(state);
  const navigate = useNavigate();
  const [modalItem, setModalItem] = useState(false);
  const [modalIsOpen, setmodalIsOpen] = useState(false);
  const [sidebarClosed, setSidebarClosed] = useState(false);

  const toggleSidebar = () => {
    setSidebarClosed(!sidebarClosed);
  };

  const handleSidebarItemClick = (route) => {
    navigate(route); // Navega para a rota especificada
  };

  const logout = async () => {
    state.logged = false;
    localStorage.clear();
    window.location.reload();
  };

  const modalHandler = (value) => {
    setmodalIsOpen(!modalIsOpen);
    if (value) {
      setModalItem(value);
    }
  };

  function getName() {
    const userType = getType();
    if (userType === "Associado") {
      return state.user?.conta?.nomeFranquia;
    }
    return state.user?.nomeFantasia;
  }

  const userType = getType();

  return (
    <div className={`sidebar ${sidebarClosed ? "sidebarClosed" : ""}`}>
      <ModalMotion isOpen={modalIsOpen} onClick={() => modalHandler()}>
        <ModalContent modalItem={modalItem} modalFunction={modalHandler} />
      </ModalMotion>
      <div className="sideInfo">
        <div
          className={`flex w-full max-w-[200px] ${
            sidebarClosed ? "justify-center" : "justify-between"
          }`}
        >
          {sidebarClosed ? null : (
            <div className="sideUserInfo flex flex-col gap-2 md">
              <img className="userImage" src={userImage} alt="userImage" />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>{truncarTexto(getName(), 20)}</TooltipTrigger>
                  <TooltipContent>
                    <p>{getName()}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
          <div className="self-center">
            <button className="hamburgerButton" onClick={toggleSidebar}>
              <PiListFill size={24} />
            </button>
          </div>
        </div>
      </div>
      <ul className="sideContent">
        {/* <li className="search">
          <FaSearch />
          <input placeholder="Search..." />
        </li> */}
        <li
          className={state.activePage === "home" ? "active" : "search"}
          onClick={() => handleSidebarItemClick("/")}
        >
          <FaHome className="sideContentIcon" />
          <p>INÍCIO</p>
        </li>
        <li
          className={state.activePage === "associados" ? "active" : ""}
          onClick={() => modalHandler("Associado")}
        >
          <FaUsers className="sideContentIcon" />
          <p>ASSOCIADOS</p>
        </li>
        {userType !== "Associado" ? (
          <li
            className={state.activePage === "agencias" ? "active" : ""}
            onClick={() => modalHandler("Agencias")}
          >
            <FaBuilding className="sideContentIcon" />
            <p>AGÊNCIAS</p>
          </li>
        ) : null}
        <li
          className={state.activePage === "transações" ? "active" : ""}
          onClick={() => modalHandler("Transações")}
        >
          <FaHandshake className="sideContentIcon" />
          <p>TRANSAÇÕES</p>
        </li>
        <li
          className={state.activePage === "ofertas" ? "active" : ""}
          onClick={() => modalHandler("Ofertas")}
        >
          <FaTags className="sideContentIcon" />
          <p>OFERTAS</p>
        </li>
        <li
          className={state.activePage === "voucher" ? "active" : ""}
          onClick={() => modalHandler("Voucher")}
        >
          <FaPercentage className="sideContentIcon" />
          <p>VOUCHER</p>
        </li>
        <li
          className={state.activePage === "creditos" ? "active" : ""}
          onClick={() => modalHandler("Créditos")}
        >
          <BsCashCoin className="sideContentIcon orange" />
          <p>CRÉDITOS</p>
        </li>
        <li
          className={state.activePage === "extratos" ? "active" : ""}
          onClick={() => modalHandler("Estratos")}
        >
          <FaFileInvoiceDollar className="sideContentIcon" />
          <p>EXTRATOS</p>
        </li>
        <li
          className={state.activePage === "contas" ? "active" : ""}
          onClick={() => modalHandler("Conta")}
        >
          {/* <BsCashCoin /> */}
          <FaHandHoldingUsd className="sideContentIcon" />
          <p>CONTAS</p>
        </li>
        {userType == "Matriz" ? (
          <li
            className={
              state.activePage === "planos" ? "active planos" : "planos"
            }
            onClick={() => modalHandler("Planos")}
          >
            <BsBookmarkFill className="sideContentIcon orange" />
            <p>PLANOS</p>
          </li>
        ) : null}

        {userType == "Matriz" ? (
          <li
            className={state.activePage === "categorias" ? "active" : ""}
            onClick={() => modalHandler("Categorias")}
          >
            <FaAdjust className="sideContentIcon" />
            <p>CATEGORIAS</p>
          </li>
        ) : null}
        {userType !== "Associado" ? (
          <li
            className={state.activePage === "gerentes" ? "active" : ""}
            onClick={() => modalHandler("Gerentes")}
          >
            <FaUserPlus className="sideContentIcon" />
            <p>GERENTES</p>
          </li>
        ) : null}
        <li
          className={state.activePage === "usuarios" ? "active" : ""}
          onClick={() => modalHandler("Usuarios")}
        >
          <FaUsers className="sideContentIcon" />
          <p>USUÁRIOS</p>
        </li>
        <li className="pb-20" onClick={logout}>
          <FaSignOutAlt className="sideContentIcon" />
          <p>SAIR</p>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
