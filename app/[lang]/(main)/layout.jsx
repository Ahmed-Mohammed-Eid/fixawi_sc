import Layout from '../../../layout/layout';
import { getDictionary } from '../../dictionaries/dictionaries';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export const metadata = {
    title: 'Sayyn - Dashboard',
    description: 'Sayyn - Dashboard',
    robots: { index: false, follow: false },
    viewport: { initialScale: 1, width: 'device-width' },
    icons: {
        icon: '/assets/favicon.ico'
    }
};

export default async function AppLayout({ children, params: { lang } }) {
    // GET THE COOKIES
    const cookiesStore = cookies();
    const role = cookiesStore.get('role')?.value;
    const token = cookiesStore.get('token')?.value;

    // IF THE USER IS NOT LOGGED IN REDIRECT TO LOGIN PAGE
    if (!role || !token) {
        redirect('/auth/login');
    }

    // IF THE USER IS NOT AN ADMIN REDIRECT TO LOGIN PAGE
    if (role !== 'service center') {
        redirect('/auth/login');
    }

    //  VERIFY THE TOKEN
    // LOGIC TO VERIFY THE TOKEN BELOW ⬇️

    // GET THE DICTIONARY
    const dictionary = await getDictionary(lang);

    // RETURN THE LAYOUT
    return (
        <Layout dictionary={dictionary} lang={lang}>
            {children}
        </Layout>
    );
}
