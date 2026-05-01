import { useEffect } from "react";
import homeImage from "../../assets/images/moeda.jpg"
import Footer from '../../components/Footer';
import { activePage } from "../../utils/functions/setActivePage";
import OfertasCard_Dashboard from "./cards/OfertasCard_Dashboard";
import AssociadoCard_Dashboard from "./cards/AssociadoCard_Dashboard";
import ResumoFinanceiro from "./ResumoFinanceiro";
import ResumoAdiministrativo from "./ResumoAdiministrativo";
import PermutasCard_Dashboard from "./cards/PermutasCard_Dashboard";
import FundoPermutaCard_Dashboard from "./cards/FundoPermutaCard_Dashboard";
const Home = () => {
    useEffect(() => {
        activePage("home")
    }, []);
    return (
        <div className="container">
            <div className="containerHeader homeHeader">
                Bem vindo a Rede Trade
            </div>
            <div className="homeCardContainer">
                <AssociadoCard_Dashboard />
                <OfertasCard_Dashboard />
                <PermutasCard_Dashboard />
                <FundoPermutaCard_Dashboard />
            </div>
            <div className="homeBodyContainer">
                <div className="homeBodyLeft">
                    <img src={homeImage} alt="" />
                    <p>Aqui seu produto vale muito!</p>
                </div>
                <div className="homeBodyRight">
                    <ResumoAdiministrativo />
                    <ResumoFinanceiro />
                </div>
            </div>
            <Footer />
        </div>)
};

export default Home;
