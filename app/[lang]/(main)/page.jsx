/* eslint-disable @next/next/no-img-element */
import React from 'react';
import DashboardPageContent from '../../components/Main/DashboardPage/DashboardPageContent';

const Dashboard = async ({ params: { lang } }) => {

    return <DashboardPageContent lang={lang} />;
};

export default Dashboard;
