// Header.js
import React from 'react';
import suaImagem from '../assets/images/Logo.png'; // Importa a imagem

const Header = () => {
    return (
        <header>
            <img className='logoImg' src={suaImagem} alt="LogoRedeTrade" />
        </header>
    );
};

export default Header;
