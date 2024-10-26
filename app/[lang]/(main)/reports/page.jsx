import React from 'react';
import ReportsContent from '../../../components/Main/Reports/ReportsContent';

export default async function ReportsPage(props) {
    const params = await props.params;

    const {
        lang
    } = params;

    return (
        <ReportsContent lang={lang} />
    );
}