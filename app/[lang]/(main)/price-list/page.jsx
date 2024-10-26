import React from 'react';
import PricesListFormPart from '../../../components/Main/PriceList/FormPart';

export default async function PriceList({params: { lang }}) {

    return (
            <PricesListFormPart lang={lang} />
    );
}
