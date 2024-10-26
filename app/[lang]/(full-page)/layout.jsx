import AppConfig from '../../../layout/AppConfig';
import React from 'react';
import { getDictionary } from '../../dictionaries/dictionaries';

export const metadata = {
    title: 'Fixawi || Dashboard',
    description: 'Fixawi Dashboard',
    robots: { index: false, follow: false },
    viewport: { initialScale: 1, width: 'device-width' },
    icons: {
        icon: '/assets/Icon_1.svg'
    }
};

export default async function SimpleLayout({ children, params: { lang } }) {
    const dictionary = await getDictionary(lang);

    return (
        <React.Fragment>
            {children}
            <AppConfig simple dictionary={dictionary} lang={lang} />
        </React.Fragment>
    );
}
