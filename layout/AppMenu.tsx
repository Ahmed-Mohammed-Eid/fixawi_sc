/* eslint-disable @next/next/no-img-element */

import React, { ReactNode } from 'react';
import AppMenuitem from './AppMenuitem';
import { MenuProvider } from './context/menucontext';
import { AppMenuItem } from '../types/types';
type ChildContainerProps = {
    children: ReactNode;
    dictionary: any;
    lang: string;
};

const AppMenu = ({ dictionary, lang }: ChildContainerProps) => {
    const model: AppMenuItem[] = [
        {
            label: dictionary.sidebar.home.title,
            items: [{ label: dictionary.sidebar.home.dashboard, icon: 'pi pi-fw pi-home', to: `/${lang}` }]
        },
        {
            label: lang === 'en' ? 'Service Centers' : 'مراكز الخدمة',
            icon: 'pi pi-fw pi-map-marker',
            items: [
                // UPDATE SERVICE CENTER INFO
                { label: lang === 'en' ? 'Update Service Center Info' : 'تحديث معلومات مركز الخدمة', icon: 'pi pi-fw pi-pencil', to: `/${lang}/service-centers/Edit` }
            ]
        },
        {
            label: lang === 'en' ? 'Prices List' : 'قائمة الأسعار',
            icon: 'pi pi-fw pi-money-bill',
            items: [{ label: lang === 'en' ? 'Update Prices' : 'تحديث الأسعار', icon: 'pi pi-fw pi-pencil', to: `/${lang}/price-list` }]
        },
        {
            label: lang === 'en' ? 'Bookings' : 'الحجوزات',
            icon: 'pi pi-fw pi-calendar',
            items: [
                { label: lang === 'en' ? 'Bookings Calendar' : 'جدول الحجوزات', icon: 'pi pi-fw pi-calendar', to: `/${lang}/bookings` },
                { label: lang === 'en' ? 'Create Booking Settings' : 'إنشاء إعدادات الحجز', icon: 'pi pi-fw pi-plus', to: `/${lang}/bookings/settings` },
                { label: lang === 'en' ? 'Update Booking Settings' : 'تحديث إعدادات الحجز', icon: 'pi pi-fw pi-pencil', to: `/${lang}/bookings/settings/update` }
            ]
        },
        // CHECK REPORTS
        {
            label: lang === 'en' ? 'Check Reports' : 'تقارير الفحص',
            icon: 'pi pi-fw pi-chart-bar',
            items: [
                {
                    label: lang === 'en' ? 'Create Check Report' : 'إنشاء تقرير فحص',
                    icon: 'pi pi-fw pi-plus',
                    to: `/${lang}/check-reports`
                },
                {
                    label: lang === 'en' ? 'Get Check Reports' : 'استرجاع تقارير الفحص',
                    icon: 'pi pi-fw pi-search',
                    to: `/${lang}/check-reports/get-check-reports`
                }
            ]
        },
        // INVOICES
        {
            label: lang === 'en' ? 'Invoices' : 'الفواتير',
            icon: 'pi pi-fw pi-file',
            items: [
                { label: lang === 'en' ? 'Create Invoice' : 'إنشاء فاتورة', icon: 'pi pi-fw pi-plus', to: `/${lang}/invoices/create` },
                { label: lang === 'en' ? 'Get Invoices' : 'استرجاع الفواتير', icon: 'pi pi-fw pi-search', to: `/${lang}/invoices` }
            ]
        },

        // {
        //     label: lang === 'en' ? 'Reports' : 'التقارير',
        //     icon: 'pi pi-fw pi-chart-bar',
        //     items: [
        //         {label: lang === 'en' ? 'Reports List' : 'قائمة التقارير', icon: 'pi pi-fw pi-list', to: `/${lang}/reports`},
        //     ]
        // },
        {
            label: dictionary.sidebar.settings.title,
            items: [
                {
                    label: dictionary.sidebar.settings.logout,
                    icon: lang === 'en' ? 'pi pi-sign-out' : 'pi pi-sign-in',
                    to: '/auth/login',
                    command: () => {
                        // Clear local storage
                        localStorage.clear();
                        // Clear Cookies
                        document.cookie.split(';').forEach((c) => {
                            document.cookie = c.replace(/^ +/, '').replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
                        });
                        // Redirect to login page
                        window.location.href = '/auth/login';
                    }
                }
            ]
        }
    ];

    return (
        <MenuProvider dictionary={dictionary} lang={lang}>
            <ul className="layout-menu" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                {model.map((item, i) => {
                    return !item?.seperator ? <AppMenuitem lang={lang} item={item} root={true} index={i} key={item.label} /> : <li className="menu-separator"></li>;
                })}
            </ul>
        </MenuProvider>
    );
};

export default AppMenu;
