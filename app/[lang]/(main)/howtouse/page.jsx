'use client';

import React from 'react';
import { Button } from 'primereact/button';

const HowToUsePage = ({ params: { lang } }) => {
    const isRTL = lang === 'ar';
    
    // Static translations
    const translations = {
        ar: {
            title: "كيفية الاستخدام",
            description: "قم بتنزيل دليل المستخدم باللغة المفضلة لديك",
            arabic: "العربية",
            english: "الإنجليزية",
            download: "تنزيل الدليل",
            arabicGuideText: "دليل المستخدم باللغة العربية",
            englishGuideText: "User Guide in English"
        },
        en: {
            title: "How to Use",
            description: "Download the user guide in your preferred language",
            arabic: "Arabic",
            english: "English",
            download: "Download Guide",
            arabicGuideText: "دليل المستخدم باللغة العربية",
            englishGuideText: "User Guide in English"
        }
    };
    
    const t = translations[lang] || translations.en;

    return (
        <div className="grid" dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="col-12">
                <div className="card">
                    <div className="card-body">
                        <h1 className="text-3xl font-bold mb-4">{t.title}</h1>
                        <p className="mb-4">{t.description}</p>
                        
                        <div className="grid">
                            {/* Arabic PDF Section */}
                            <div className="col-12 md:col-6">
                                <div className="card mb-0">
                                    <div className="card-body text-center">
                                        <div className="mb-4">
                                            <i className="pi pi-file-pdf text-6xl text-red-500"></i>
                                        </div>
                                        <h3 className="text-2xl font-bold mb-3">{t.arabic}</h3>
                                        <p className="mb-4">{t.arabicGuideText}</p>
                                        <Button 
                                            label={t.download} 
                                            icon="pi pi-download" 
                                            className="w-full md:w-auto"
                                            onClick={() => window.open('/assets/files/howtouse_ar.pdf', '_blank')}
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            {/* English PDF Section */}
                            <div className="col-12 md:col-6">
                                <div className="card mb-0">
                                    <div className="card-body text-center">
                                        <div className="mb-4">
                                            <i className="pi pi-file-pdf text-6xl text-red-500"></i>
                                        </div>
                                        <h3 className="text-2xl font-bold mb-3">{t.english}</h3>
                                        <p className="mb-4">{t.englishGuideText}</p>
                                        <Button 
                                            label={t.download} 
                                            icon="pi pi-download" 
                                            className="w-full md:w-auto"
                                            onClick={() => window.open('/assets/files/howtouse_en.pdf', '_blank')}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HowToUsePage;
