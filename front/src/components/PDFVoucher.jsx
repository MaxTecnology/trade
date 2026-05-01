import React, { useRef } from "react";
import "./pdf.css"
import logoImage from "../assets/images/mini-logo.jpeg"
import qrCode from "../assets/images/QrCode.svg"
import { useSnapshot } from "valtio";
import state from "../store";
import html2canvas from "html2canvas"

const PDFVoucher = () => {
    const pdfRef = useRef()
    useSnapshot(state)
    return <div className="pdfContainer" ref={pdfRef}>
        <div className="pdfHeader">
            <img src={logoImage} alt="logo" />''
            <p>VOUCHER REDE TRADE</p>
            <div className="bar"></div>
        </div>
        <div className="pdfBody">
            <span>{state.user.usuario.dadosGerais.nomeFantasia ? state.user.usuario.dadosGerais.nomeFantasia : "Nome Fantasia"}</span>
            <p>{state.user.usuario.conta ? `Nùmero da conta: ${state.user.usuario.conta}` : "Número da conta :"}</p>
            <div className="pdfCode">
                <img src={qrCode} alt="qrCode" />
            </div>
            <span>Código</span>
            <h3>RT$ 800,00</h3>
            <div className="pdfDivider"></div>
            <span>
                Restrições:
                <br />
                {state.user.usuario.dadosGerais.restricao ? state.user.usuario.dadosGerais.restricao : ""}
            </span>
        </div>
        <div className="pdfFooter">www.redetrade.com.br</div>
    </div>;
};

export default PDFVoucher;
