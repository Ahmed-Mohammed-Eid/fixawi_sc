'use client';

import { PrimeReactContext } from 'primereact/api';
import { Button } from 'primereact/button';
import { InputSwitch } from 'primereact/inputswitch';
import { RadioButton } from 'primereact/radiobutton';
import { Sidebar } from 'primereact/sidebar';
import { classNames } from 'primereact/utils';
import React, { useContext, useEffect, useState } from 'react';
import { LayoutContext } from './context/layoutcontext';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {useRouter} from 'next/navigation';

const AppConfig = (props) => {

    // GET THE ROUTER
    const router = useRouter();

    // GET THE CURRENT PATH
    const pathname = usePathname();


    const [scales] = useState([12, 13, 14, 15, 16]);
    const { layoutConfig, setLayoutConfig, layoutState, setLayoutState } = useContext(LayoutContext);
    const { setRipple, changeTheme } = useContext(PrimeReactContext);

    const onConfigButtonClick = () => {
        setLayoutState((prevState) => ({ ...prevState, configSidebarVisible: true }));
    };

    const onConfigSidebarHide = () => {
        setLayoutState((prevState) => ({ ...prevState, configSidebarVisible: false }));
    };

    const changeInputStyle = (e) => {
        setLayoutConfig((prevState) => ({ ...prevState, inputStyle: e.value }));
    };

    const changeRipple = (e) => {
        setRipple(e.value);
        setLayoutConfig((prevState) => ({ ...prevState, ripple: e.value }));
    };

    const changeMenuMode = (e) => {
        setLayoutConfig((prevState) => ({ ...prevState, menuMode: e.value }));
    };

    const _changeTheme = (theme, colorScheme) => {
        changeTheme?.(layoutConfig.theme, theme, 'theme-css', () => {
            setLayoutConfig((prevState) => ({ ...prevState, theme, colorScheme }));
        });
    };

    const decrementScale = () => {
        setLayoutConfig((prevState) => ({ ...prevState, scale: prevState.scale - 1 }));
    };

    const incrementScale = () => {
        setLayoutConfig((prevState) => ({ ...prevState, scale: prevState.scale + 1 }));
    };

    const applyScale = () => {
        document.documentElement.style.fontSize = layoutConfig.scale + 'px';
    };

    // CUSTOM FUNCTION TO SWITCH THE LANGUAGE
    const handleLanguageChange = (lang) => {
        // REMOVE THE LANGUAGE FROM THE LOCAL STORAGE
        localStorage.removeItem('language');
        // REMOVE THE LANGUAGE FROM THE COOKIES
        document.cookie = `language=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        // SET THE LANGUAGE TO THE LOCAL STORAGE
        localStorage.setItem('language', lang);
        // SET THE LANGUAGE TO THE COOKIES
        document.cookie = `language=${lang}`;
        // get the path without the language
        const parts = pathname.split('/');
        parts[1] = lang;
        // redirect to the new path
        router.push(parts.join('/'));
    };

    useEffect(() => {
        applyScale();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [layoutConfig.scale]);

    // SET THE LANGUAGE TO THE LOCAL STORAGE AND THE COOKIES WHEN THE LANGUAGE CHANGES AND THE PAGE IS LOADED
    useEffect(() => {
        // GET THE URL
        const url = window.location.href;
        // GET THE LANGUAGE FROM THE URL
        const lang = url.split('/')[3];
        // SET THE LANGUAGE TO THE LOCAL STORAGE
        localStorage.setItem('language', lang);
        // SET THE LANGUAGE TO THE COOKIES
        document.cookie = `language=${lang}`;

        // SET THE LANGUAGE TO THE LAYOUT CONFIG
        setLayoutConfig((prevState) => ({
            ...prevState,
            language: lang
        }));
    }, []);

    return (
        <>

            <button className="layout-config-button config-link" type="button" onClick={onConfigButtonClick}>
                <i className="pi pi-cog"></i>
            </button>

            <Sidebar visible={layoutState.configSidebarVisible} onHide={onConfigSidebarHide} position="right"
                     className="layout-config-sidebar w-20rem">
                {!props.simple && (
                    <>
                        <h5>{props.dictionary?.optionsbar.language.title}</h5>
                        <div className="flex">
                            <div className="field-radiobutton flex-1">
                                <RadioButton name="language" value={'en'} checked={layoutConfig.language === 'en'}
                                             onChange={(e) => {
                                                 // SET THE LANGUAGE TO THE LAYOUT CONFIG
                                                 setLayoutConfig((prevState) => ({
                                                     ...prevState,
                                                     language: e.value
                                                 }));
                                                 // GO TO THE /en/ ROUTE
                                                 handleLanguageChange('en');
                                             }}
                                             inputId="en"
                                />
                                <label htmlFor="en">
                                    <Image src={'/assets/en.svg'} alt={'en language'} width={22} height={16} />
                                </label>
                            </div>
                            <div className="field-radiobutton flex-1">
                                <RadioButton name="language" value={'ar'} checked={layoutConfig.language === 'ar'}
                                             onChange={(e) => {
                                                 // SET THE LANGUAGE TO THE LOCAL STORAGE
                                                 localStorage.setItem('language', e.value);
                                                 // SET THE LANGUAGE TO THE COOKIES
                                                 document.cookie = `language=${e.value}`;
                                                 // SET THE LANGUAGE TO THE LAYOUT CONFIG
                                                 setLayoutConfig((prevState) => ({
                                                     ...prevState,
                                                     language: e.value
                                                 }));
                                                 // GO TO THE /ar/ ROUTE
                                                 handleLanguageChange('ar');
                                                 // window.location.href = '/ar';
                                             }}
                                             inputId="ar"
                                />
                                <label htmlFor="ar">
                                    <Image src={'/assets/ar.svg'} alt={'ar language'} width={22} height={16} />
                                </label>
                            </div>
                        </div>

                        <h5>{props.dictionary?.optionsbar.scale.title}</h5>
                        <div className="flex align-items-center">
                            <Button icon="pi pi-minus" type="button" onClick={decrementScale} rounded text
                                    className="w-2rem h-2rem mr-2" disabled={layoutConfig.scale === scales[0]}></Button>
                            <div className="flex gap-2 align-items-center">
                                {scales.map((item) => {
                                    return <i className={classNames('pi pi-circle-fill', {
                                        'text-primary-500': item === layoutConfig.scale,
                                        'text-300': item !== layoutConfig.scale
                                    })} key={item}></i>;
                                })}
                            </div>
                            <Button icon="pi pi-plus" type="button" onClick={incrementScale} rounded text
                                    className="w-2rem h-2rem ml-2"
                                    disabled={layoutConfig.scale === scales[scales.length - 1]}></Button>
                        </div>

                        <h5>{props.dictionary?.optionsbar.menuType.title}</h5>
                        <div className="flex">
                            <div className="field-radiobutton flex-1">
                                <RadioButton name="menuMode" value={'static'}
                                             checked={layoutConfig.menuMode === 'static'}
                                             onChange={(e) => changeMenuMode(e)} inputId="mode1"></RadioButton>
                                <label htmlFor="mode1">Static</label>
                            </div>
                            <div className="field-radiobutton flex-1">
                                <RadioButton name="menuMode" value={'overlay'}
                                             checked={layoutConfig.menuMode === 'overlay'}
                                             onChange={(e) => changeMenuMode(e)} inputId="mode2"></RadioButton>
                                <label htmlFor="mode2">Overlay</label>
                            </div>
                        </div>

                        <h5>{props.dictionary?.optionsbar.inputStyle.title}</h5>
                        <div className="flex">
                            <div className="field-radiobutton flex-1">
                                <RadioButton name="inputStyle" value={'outlined'}
                                             checked={layoutConfig.inputStyle === 'outlined'}
                                             onChange={(e) => changeInputStyle(e)}
                                             inputId="outlined_input"></RadioButton>
                                <label htmlFor="outlined_input">Outlined</label>
                            </div>
                            <div className="field-radiobutton flex-1">
                                <RadioButton name="inputStyle" value={'filled'}
                                             checked={layoutConfig.inputStyle === 'filled'}
                                             onChange={(e) => changeInputStyle(e)} inputId="filled_input"></RadioButton>
                                <label htmlFor="filled_input">Filled</label>
                            </div>
                        </div>

                        <h5>{props.dictionary?.optionsbar.RippleEffect.title}</h5>
                        <InputSwitch checked={layoutConfig.ripple}
                                     onChange={(e) => changeRipple(e)}></InputSwitch>
                    </>
                )}
                {props.simple && (
                    <>
                        <h5>{props.dictionary?.optionsbar.language.title}</h5>

                        <div className="flex">
                            <div className="field-radiobutton flex-1">
                                <RadioButton name="language" value={'en'} checked={layoutConfig.language === 'en'}
                                             onChange={(e) => {
                                                 // SET THE LANGUAGE TO THE LAYOUT CONFIG
                                                 setLayoutConfig((prevState) => ({
                                                     ...prevState,
                                                     language: e.value
                                                 }));
                                                 // GO TO THE /en/ ROUTE
                                                 handleLanguageChange('en');
                                                 // window.location.href = '/en';
                                             }}
                                             inputId="en"
                                />
                                <label htmlFor="en">
                                    <Image src={'/assets/en.svg'} alt={'en language'} width={22} height={16} />
                                </label>
                            </div>
                            <div className="field-radiobutton flex-1">
                                <RadioButton name="language" value={'ar'} checked={layoutConfig.language === 'ar'}
                                             onChange={(e) => {
                                                 // SET THE LANGUAGE TO THE LOCAL STORAGE
                                                 localStorage.setItem('language', e.value);
                                                 // SET THE LANGUAGE TO THE COOKIES
                                                 document.cookie = `language=${e.value}`;
                                                 // SET THE LANGUAGE TO THE LAYOUT CONFIG
                                                 setLayoutConfig((prevState) => ({
                                                     ...prevState,
                                                     language: e.value
                                                 }));
                                                 // GO TO THE /ar/ ROUTE
                                                 handleLanguageChange('ar');
                                                 // window.location.href = '/ar';
                                             }}
                                             inputId="ar"
                                />
                                <label htmlFor="ar">
                                    <Image src={'/assets/ar.svg'} alt={'ar language'} width={22} height={16} />
                                </label>
                            </div>
                        </div>
                    </>
                )}
                <h5>{props.dictionary?.optionsbar.BootstrapTheme.title}</h5>
                <div className="grid">
                    <div className="col-3">
                        <button className="p-link w-2rem h-2rem"
                                onClick={() => _changeTheme('bootstrap4-light-blue', 'light')}>
                            <img src="/layout/images/themes/bootstrap4-light-blue.svg" className="w-2rem h-2rem"
                                 alt="Bootstrap Light Blue" />
                        </button>
                    </div>
                    <div className="col-3">
                        <button className="p-link w-2rem h-2rem"
                                onClick={() => _changeTheme('bootstrap4-light-purple', 'light')}>
                            <img src="/layout/images/themes/bootstrap4-light-purple.svg" className="w-2rem h-2rem"
                                 alt="Bootstrap Light Purple" />
                        </button>
                    </div>
                    <div className="col-3">
                        <button className="p-link w-2rem h-2rem"
                                onClick={() => _changeTheme('bootstrap4-dark-blue', 'dark')}>
                            <img src="/layout/images/themes/bootstrap4-dark-blue.svg" className="w-2rem h-2rem"
                                 alt="Bootstrap Dark Blue" />
                        </button>
                    </div>
                    <div className="col-3">
                        <button className="p-link w-2rem h-2rem"
                                onClick={() => _changeTheme('bootstrap4-dark-purple', 'dark')}>
                            <img src="/layout/images/themes/bootstrap4-dark-purple.svg" className="w-2rem h-2rem"
                                 alt="Bootstrap Dark Purple" />
                        </button>
                    </div>
                </div>

                <h5>{props.dictionary?.optionsbar.MaterialTheme.title}</h5>
                <div className="grid">
                    <div className="col-3">
                        <button className="p-link w-2rem h-2rem"
                                onClick={() => _changeTheme('md-light-indigo', 'light')}>
                            <img src="/layout/images/themes/md-light-indigo.svg" className="w-2rem h-2rem"
                                 alt="Material Light Indigo" />
                        </button>
                    </div>
                    <div className="col-3">
                        <button className="p-link w-2rem h-2rem"
                                onClick={() => _changeTheme('md-light-deeppurple', 'light')}>
                            <img src="/layout/images/themes/md-light-deeppurple.svg" className="w-2rem h-2rem"
                                 alt="Material Light DeepPurple" />
                        </button>
                    </div>
                    <div className="col-3">
                        <button className="p-link w-2rem h-2rem" onClick={() => _changeTheme('md-dark-indigo', 'dark')}>
                            <img src="/layout/images/themes/md-dark-indigo.svg" className="w-2rem h-2rem"
                                 alt="Material Dark Indigo" />
                        </button>
                    </div>
                    <div className="col-3">
                        <button className="p-link w-2rem h-2rem"
                                onClick={() => _changeTheme('md-dark-deeppurple', 'dark')}>
                            <img src="/layout/images/themes/md-dark-deeppurple.svg" className="w-2rem h-2rem"
                                 alt="Material Dark DeepPurple" />
                        </button>
                    </div>
                </div>

                <h5>{props.dictionary?.optionsbar.MaterialCompact.title}</h5>
                <div className="grid">
                    <div className="col-3">
                        <button className="p-link w-2rem h-2rem"
                                onClick={() => _changeTheme('mdc-light-indigo', 'light')}>
                            <img src="/layout/images/themes/md-light-indigo.svg" className="w-2rem h-2rem"
                                 alt="Material Light Indigo" />
                        </button>
                    </div>
                    <div className="col-3">
                        <button className="p-link w-2rem h-2rem"
                                onClick={() => _changeTheme('mdc-light-deeppurple', 'light')}>
                            <img src="/layout/images/themes/md-light-deeppurple.svg" className="w-2rem h-2rem"
                                 alt="Material Light Deep Purple" />
                        </button>
                    </div>
                    <div className="col-3">
                        <button className="p-link w-2rem h-2rem"
                                onClick={() => _changeTheme('mdc-dark-indigo', 'dark')}>
                            <img src="/layout/images/themes/md-dark-indigo.svg" className="w-2rem h-2rem"
                                 alt="Material Dark Indigo" />
                        </button>
                    </div>
                    <div className="col-3">
                        <button className="p-link w-2rem h-2rem"
                                onClick={() => _changeTheme('mdc-dark-deeppurple', 'dark')}>
                            <img src="/layout/images/themes/md-dark-deeppurple.svg" className="w-2rem h-2rem"
                                 alt="Material Dark Deep Purple" />
                        </button>
                    </div>
                </div>

                <h5>{props.dictionary?.optionsbar.TailwindTheme.title}</h5>
                <div className="grid">
                    <div className="col-3">
                        <button className="p-link w-2rem h-2rem"
                                onClick={() => _changeTheme('tailwind-light', 'light')}>
                            <img src="/layout/images/themes/tailwind-light.png" className="w-2rem h-2rem"
                                 alt="Tailwind Light" />
                        </button>
                    </div>
                </div>

                <h5>{props.dictionary?.optionsbar.FluentTheme.title}</h5>
                <div className="grid">
                    <div className="col-3">
                        <button className="p-link w-2rem h-2rem" onClick={() => _changeTheme('fluent-light', 'light')}>
                            <img src="/layout/images/themes/fluent-light.png" className="w-2rem h-2rem"
                                 alt="Fluent Light" />
                        </button>
                    </div>
                </div>

                <h5>{props.dictionary?.optionsbar.PrimeOne2022.title}</h5>
                <div className="grid">
                    <div className="col-3">
                        <button className="p-link w-2rem h-2rem"
                                onClick={() => _changeTheme('lara-light-indigo', 'light')}>
                            <img src="/layout/images/themes/lara-light-indigo.png" className="w-2rem h-2rem"
                                 alt="Lara Light Indigo" />
                        </button>
                    </div>
                    <div className="col-3">
                        <button className="p-link w-2rem h-2rem"
                                onClick={() => _changeTheme('lara-light-blue', 'light')}>
                            <img src="/layout/images/themes/lara-light-blue.png" className="w-2rem h-2rem"
                                 alt="Lara Light Blue" />
                        </button>
                    </div>
                    <div className="col-3">
                        <button className="p-link w-2rem h-2rem"
                                onClick={() => _changeTheme('lara-light-purple', 'light')}>
                            <img src="/layout/images/themes/lara-light-purple.png" className="w-2rem h-2rem"
                                 alt="Lara Light Purple" />
                        </button>
                    </div>
                    <div className="col-3">
                        <button className="p-link w-2rem h-2rem"
                                onClick={() => _changeTheme('lara-light-teal', 'light')}>
                            <img src="/layout/images/themes/lara-light-teal.png" className="w-2rem h-2rem"
                                 alt="Lara Light Teal" />
                        </button>
                    </div>
                    <div className="col-3">
                        <button className="p-link w-2rem h-2rem"
                                onClick={() => _changeTheme('lara-dark-indigo', 'dark')}>
                            <img src="/layout/images/themes/lara-dark-indigo.png" className="w-2rem h-2rem"
                                 alt="Lara Dark Indigo" />
                        </button>
                    </div>
                    <div className="col-3">
                        <button className="p-link w-2rem h-2rem" onClick={() => _changeTheme('lara-dark-blue', 'dark')}>
                            <img src="/layout/images/themes/lara-dark-blue.png" className="w-2rem h-2rem"
                                 alt="Lara Dark Blue" />
                        </button>
                    </div>
                    <div className="col-3">
                        <button className="p-link w-2rem h-2rem"
                                onClick={() => _changeTheme('lara-dark-purple', 'dark')}>
                            <img src="/layout/images/themes/lara-dark-purple.png" className="w-2rem h-2rem"
                                 alt="Lara Dark Purple" />
                        </button>
                    </div>
                    <div className="col-3">
                        <button className="p-link w-2rem h-2rem" onClick={() => _changeTheme('lara-dark-teal', 'dark')}>
                            <img src="/layout/images/themes/lara-dark-teal.png" className="w-2rem h-2rem"
                                 alt="Lara Dark Teal" />
                        </button>
                    </div>
                </div>

                <h5>{props.dictionary?.optionsbar.PrimeOne2021.title}</h5>
                <div className="grid">
                    <div className="col-3">
                        <button className="p-link w-2rem h-2rem" onClick={() => _changeTheme('saga-blue', 'light')}>
                            <img src="/layout/images/themes/saga-blue.png" className="w-2rem h-2rem" alt="Saga Blue" />
                        </button>
                    </div>
                    <div className="col-3">
                        <button className="p-link w-2rem h-2rem" onClick={() => _changeTheme('saga-green', 'light')}>
                            <img src="/layout/images/themes/saga-green.png" className="w-2rem h-2rem"
                                 alt="Saga Green" />
                        </button>
                    </div>
                    <div className="col-3">
                        <button className="p-link w-2rem h-2rem" onClick={() => _changeTheme('saga-orange', 'light')}>
                            <img src="/layout/images/themes/saga-orange.png" className="w-2rem h-2rem"
                                 alt="Saga Orange" />
                        </button>
                    </div>
                    <div className="col-3">
                        <button className="p-link w-2rem h-2rem" onClick={() => _changeTheme('saga-purple', 'light')}>
                            <img src="/layout/images/themes/saga-purple.png" className="w-2rem h-2rem"
                                 alt="Saga Purple" />
                        </button>
                    </div>
                    <div className="col-3">
                        <button className="p-link w-2rem h-2rem" onClick={() => _changeTheme('vela-blue', 'dark')}>
                            <img src="/layout/images/themes/vela-blue.png" className="w-2rem h-2rem" alt="Vela Blue" />
                        </button>
                    </div>
                    <div className="col-3">
                        <button className="p-link w-2rem h-2rem" onClick={() => _changeTheme('vela-green', 'dark')}>
                            <img src="/layout/images/themes/vela-green.png" className="w-2rem h-2rem"
                                 alt="Vela Green" />
                        </button>
                    </div>
                    <div className="col-3">
                        <button className="p-link w-2rem h-2rem" onClick={() => _changeTheme('vela-orange', 'dark')}>
                            <img src="/layout/images/themes/vela-orange.png" className="w-2rem h-2rem"
                                 alt="Vela Orange" />
                        </button>
                    </div>
                    <div className="col-3">
                        <button className="p-link w-2rem h-2rem" onClick={() => _changeTheme('vela-purple', 'dark')}>
                            <img src="/layout/images/themes/vela-purple.png" className="w-2rem h-2rem"
                                 alt="Vela Purple" />
                        </button>
                    </div>
                    <div className="col-3">
                        <button className="p-link w-2rem h-2rem" onClick={() => _changeTheme('arya-blue', 'dark')}>
                            <img src="/layout/images/themes/arya-blue.png" className="w-2rem h-2rem" alt="Arya Blue" />
                        </button>
                    </div>
                    <div className="col-3">
                        <button className="p-link w-2rem h-2rem" onClick={() => _changeTheme('arya-green', 'dark')}>
                            <img src="/layout/images/themes/arya-green.png" className="w-2rem h-2rem"
                                 alt="Arya Green" />
                        </button>
                    </div>
                    <div className="col-3">
                        <button className="p-link w-2rem h-2rem" onClick={() => _changeTheme('arya-orange', 'dark')}>
                            <img src="/layout/images/themes/arya-orange.png" className="w-2rem h-2rem"
                                 alt="Arya Orange" />
                        </button>
                    </div>
                    <div className="col-3">
                        <button className="p-link w-2rem h-2rem" onClick={() => _changeTheme('arya-purple', 'dark')}>
                            <img src="/layout/images/themes/arya-purple.png" className="w-2rem h-2rem"
                                 alt="Arya Purple" />
                        </button>
                    </div>
                </div>
            </Sidebar>
        </>
    );
};

export default AppConfig;
