'use client';

import { useRouter } from 'next/navigation';
import React, { useContext, useEffect, useState } from 'react';
import Image from 'next/image';
// COMPONENTS
import AppConfig from '../../../../layout/AppConfig';
import { Button } from 'primereact/button';
import { Password } from 'primereact/password';
import { LayoutContext } from '../../../../layout/context/layoutcontext';
import { InputText } from 'primereact/inputtext';
import { classNames } from 'primereact/utils';
import { ProgressSpinner } from 'primereact/progressspinner';

// TOAST
import { toast } from 'react-hot-toast';

// AXIOS
import axios from 'axios';

const LoginContent = ({ dictionary, lang }) => {
    // ROUTER
    const router = useRouter();
    // STATES
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    // CONTEXT
    const { layoutConfig } = useContext(LayoutContext);
    // REFS
    const usernameRef = React.useRef(null);

    const containerClassName = classNames('surface-ground flex align-items-center justify-content-center min-h-screen min-w-screen overflow-hidden', { 'p-input-filled': layoutConfig.inputStyle === 'filled' });

    async function login(event) {
        // DISABLE THE PAGE RELOADING
        event.preventDefault();
        // VALIDATE USERNAME AND PASSWORD
        const usernameRegex = /^[a-zA-Z0-9]+$/;

        if (!usernameRegex.test(username)) {
            toast.error('Username is not valid');
            // ADD INVALID CLASS TO USERNAME INPUT
            usernameRef.current.classList.add('p-invalid');
            return;
        }

        setLoading(true);
        // LOGIN
        axios
            .post(`${process.env.API_URL}/admin/login`, {
                username: username,
                password: password
            })
            .then((res) => {
                setLoading(false);
                // SAVE TOKEN IN LOCAL STORAGE AND COOKIES AND THE ROLE OF THE USER
                localStorage.setItem('token', res.data?.token);
                localStorage.setItem('role', res.data?.admin?.role);
                localStorage.setItem("userId", res.data?.admin?._id);

                // SET THE COOKIES
                document.cookie = `token=${res.data.token}; path=/`;
                document.cookie = `role=${res.data?.admin?.role}; path=/`;
                document.cookie = `userId=${res.data?.admin?._id}; path=/`;

                console.log(res.data?.admin?.role);

                if (res.data?.admin?.role === 'service center') {
                    // REDIRECT TO HOME PAGE
                    toast.success('Login Successful');
                    router.push(`/${lang}/`);
                } else {
                    toast.error('You are not authorized to access this page');
                }
            })
            .catch((err) => {
                setLoading(false);
                toast.error(err.response?.data?.message || 'Login Failed');
            });
    }

    // EFFECT TO CLEAR THE COOKIES AND LOCAL STORAGE IN THE FIRST LOAD
    useEffect(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = 'role=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    }, []);

    return (
        <div className={containerClassName} dir={lang === 'en' ? 'ltr' : 'rtl'}>
            <div className="flex flex-column align-items-center justify-content-center">
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '1rem',
                        gap: '1rem'
                    }}
                >
                    <Image src={`/assets/text-based-logo-1.svg`} alt="AL-DAROAZA logo" className="flex-shrink-0" width={180} height={51} />
                    {/*<div className="text-900 text-4xl font-medium">{dictionary?.login.company}</div>*/}
                </div>
                <div
                    style={{
                        borderRadius: '56px',
                        padding: '0.3rem',
                        background: 'linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)'
                    }}
                >
                    <div className="w-full surface-card py-8 px-5 sm:px-8" style={{ borderRadius: '53px' }}>
                        <form onSubmit={login}>
                            <label htmlFor="username" className="block text-900 text-xl font-medium mb-2">
                                {dictionary?.login.username}
                            </label>
                            <InputText
                                inputid="username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder={dictionary?.login.username}
                                className="w-full md:w-30rem mb-5"
                                style={{ padding: '1rem' }}
                                ref={usernameRef}
                            />

                            <label htmlFor="password1" className="block text-900 font-medium text-xl mb-2">
                                {dictionary?.login.password}
                            </label>
                            <Password
                                inputid="password1"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder={dictionary?.login.password}
                                toggleMask
                                className="w-full mb-5"
                                inputClassName="w-full p-3 md:w-30rem"
                                feedback={false}
                            ></Password>

                            <div className="flex align-items-center justify-content-between mb-5 gap-5"></div>
                            <Button
                                style={{
                                    background: loading ? '#dcdcf1' : 'var(--primary-color)'
                                }}
                                label={
                                    loading ? (
                                        <ProgressSpinner
                                            strokeWidth="4"
                                            style={{
                                                width: '1.5rem',
                                                height: '1.5rem'
                                            }}
                                        />
                                    ) : (
                                        dictionary?.login.login
                                    )
                                }
                                className="w-full p-3 text-xl"
                                type={'submit'}
                            ></Button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

LoginContent.getLayout = function getLayout(page) {
    return (
        <React.Fragment>
            {page}
            <AppConfig simple />
        </React.Fragment>
    );
};
export default LoginContent;
