'use client';
import React from 'react';
import { LayoutProvider } from '../../layout/context/layoutcontext';
import { PrimeReactProvider } from 'primereact/api';
import { Toaster } from 'react-hot-toast';
import 'primereact/resources/primereact.css';
import 'primeflex/primeflex.css';
import 'primeicons/primeicons.css';
import '../../styles/layout/layout.scss';
import '../../styles/globals.scss';
// PRIME REACT ARABIC THEME
import '../../styles/primeReactArabicStyle.scss';

function RootLayout({ children, params: {lang} }) {

    return (
        <html lang={lang || 'en'}>
        <head>
            <link id="theme-css" href={`/themes/lara-light-indigo/theme.css`} rel="stylesheet"></link>
        </head>
        <body>
        <PrimeReactProvider>
            <LayoutProvider>{children}</LayoutProvider>
            <Toaster position={'bottom-right'} />
        </PrimeReactProvider>
        </body>
        </html>
    );
}

export default RootLayout;
