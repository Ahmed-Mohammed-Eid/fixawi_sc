'use client';
import React, { useEffect, useState } from 'react';
// PRIME REACT
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { InputTextarea } from 'primereact/inputtextarea';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { MultiSelect } from 'primereact/multiselect';
import { Password } from 'primereact/password';

// IMPORTS
import CustomFileUpload from '../Layout/customFileUpload/customFileUpload';
import { Header, Footer } from '../Layout/PasswordPower/PasswordPower';

// HELPERS
import { toast } from 'react-hot-toast';
import axios from 'axios';

// FILES
import Image from 'next/image';
import cities from '../../../json/cities.json';

export default function EditServiceCenterForm({ lang }) {
    const [errors, setErrors] = useState({}); // Store form errors

    // CATEGORIES
    const [subCategories, setSubCategories] = useState([]);

    // CAR BRANDS
    const [cars, setCars] = useState([]);

    // SERVICE CENTER STATES (prefilled with existing data)
    const [serviceCenterTitle, setServiceCenterTitle] = useState('');
    const [serviceCenterTitleEn, setServiceCenterTitleEn] = useState('');
    const [address, setAddress] = useState('');
    const [area, setArea] = useState('');
    const [lat, setLat] = useState('');
    const [lng, setLng] = useState('');
    const [serviceType, setServiceType] = useState('');
    const [visitType, setVisitType] = useState('');
    const [openAt, setOpenAt] = useState('');
    const [closeAt, setCloseAt] = useState('');
    const [contacts, setContacts] = useState('');
    const [email, setEmail] = useState('');
    const [website, setWebsite] = useState('');
    const [carBrands, setCarBrands] = useState('');
    const [files, setFiles] = useState([]);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [closingDays, setClosingDays] = useState([]); // Store the closing days

    // VALIDATION FUNCTION
    const validateForm = () => {
        const newErrors = {};

        if (!serviceCenterTitle) {
            newErrors.serviceCenterTitle = lang === 'en' ? 'Service Center Title is required.' : 'اسم المركز مطلوب.';
        }
        if (!serviceCenterTitleEn) {
            newErrors.serviceCenterTitleEn = lang === 'en' ? 'Service Center Title (English) is required.' : 'اسم المركز (إنجليزي) مطلوب.';
        }
        if (!address) {
            newErrors.address = lang === 'en' ? 'Address is required.' : 'العنوان مطلوب.';
        }
        if (!area) {
            newErrors.area = lang === 'en' ? 'Area is required.' : 'المنطقة مطلوبة.';
        }
        if (!lat) {
            newErrors.lat = lang === 'en' ? 'Latitude is required.' : 'خط العرض مطلوب.';
        }
        if (!lng) {
            newErrors.lng = lang === 'en' ? 'Longitude is required.' : 'خط الطول مطلوب.';
        }
        if (!serviceType || serviceType.length === 0) {
            newErrors.serviceType = lang === 'en' ? 'Please select at least one Service Type.' : 'يرجى اختيار نوع خدمة واحد على الأقل.';
        }
        if (!openAt) {
            newErrors.openAt = lang === 'en' ? 'Open At time is required.' : 'وقت الفتح مطلوب.';
        }
        if (!closeAt) {
            newErrors.closeAt = lang === 'en' ? 'Close At time is required.' : 'وقت الإغلاق مطلوب.';
        }
        if (!contacts) {
            newErrors.contacts = lang === 'en' ? 'Contacts are required.' : 'معلومات الاتصال مطلوبة.';
        }
        if (!carBrands || carBrands.length === 0) {
            newErrors.carBrands = lang === 'en' ? 'Please select at least one Car Brand.' : 'يرجى اختيار ماركة سيارة واحدة على الأقل.';
        }
        if (!visitType) {
            newErrors.visitType = lang === 'en' ? 'Visit Type is required.' : 'نوع الزيارة مطلوب.';
        }
        if (!username) {
            newErrors.username = lang === 'en' ? 'Username is required.' : 'اسم المستخدم مطلوب.';
        }

        if (password && !confirmPassword) {
            newErrors.confirmPassword = lang === 'en' ? 'Please confirm your password.' : 'يرجى تأكيد كلمة المرور.';
        } else if (password && confirmPassword && password !== confirmPassword) {
            newErrors.confirmPassword = lang === 'en' ? 'Passwords do not match.' : 'كلمات المرور غير متطابقة.';
        }


        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // HANDLERS
    function handleSubmit(e) {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        const token = localStorage.getItem('token');

        // Formatting openAt and closeAt (time format logic)
        const openAtFormatted = openAt instanceof Date ? openAt.getHours() : null;
        const closeAtFormatted = closeAt instanceof Date ? closeAt.getHours() : null;

        const formData = new FormData();
        formData.append('serviceCenterTitle', serviceCenterTitle);
        formData.append('serviceCenterTitleEn', serviceCenterTitleEn);
        formData.append('address', address);
        formData.append('area', area);
        formData.append('lng', lng);
        formData.append('lat', lat);
        formData.append('visitType', visitType);
        formData.append('serviceCategoryIds', JSON.stringify(serviceType));
        formData.append('openAt', openAtFormatted);
        formData.append('closeAt', closeAtFormatted);
        formData.append('contacts', contacts);
        formData.append('email', email);
        formData.append('website', website);
        formData.append('carBrands', JSON.stringify(carBrands));
        formData.append('username', username);
        formData.append('closingDay', JSON.stringify(closingDays));

        if (password) {
            formData.append('password', password);
        }

        files.forEach((file) => {
            formData.append('files', file);
        });

        axios
            .put(`${process.env.API_URL}/update/profile`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            .then((_) => {
                toast.success(lang === 'en' ? 'Service Center updated successfully' : 'تم تحديث مركز الخدمة بنجاح');
            })
            .catch((err) => {
                toast.error(err.response?.data?.message || (lang === 'en' ? 'Failed to update service center' : 'فشل في تحديث مركز الخدمة'));
            });
    }

    // GET THE CATEGORIES FROM THE API
    function getSubCategories() {
        // GET THE TOKEN FROM THE LOCAL STORAGE
        const token = localStorage.getItem('token');

        axios
            .get(`${process.env.API_URL}/service/sub/categories`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            .then((res) => {
                // Update the state
                setSubCategories(res.data?.subCategories || []);
            })
            .catch((error) => {
                toast.error(error?.response?.data?.message || 'An error occurred while getting the categories.');
            });
    }

    // GET THE CARS FROM THE API
    function getCars() {
        // GET THE TOKEN FROM THE LOCAL STORAGE
        const token = localStorage.getItem('token');

        axios
            .get(`${process.env.API_URL}/user/cars/brands`)
            .then((res) => {
                console.log(res.data);
                // Update the state
                const ArrayOfCars = res.data?.brands?.map((brand) => {
                    return {
                        label: brand?.brand,
                        value: brand?.brand,
                        brandIcon: brand?.brandIcon
                    };
                }); // map the cars to the format that the dropdown accepts
                setCars(ArrayOfCars);
            })
            .catch((error) => {
                toast.error(error?.response?.data?.message || 'An error occurred while getting the cars.');
            });
    }

    // CARS TEMPLATE
    const carTemplate = (option) => {
        return (
            <div className="flex align-items-center">
                <Image src={option.brandIcon} alt={option.label} width={20} height={20} className={`mr-2 flag`} />
                <div>{option.label}</div>
            </div>
        );
    };

    // GET THE SERVICE CENTER DATA
    function getServiceCenterData() {

        // GET THE TOKEN FROM THE LOCAL STORAGE
        const token = localStorage.getItem('token');

        axios
            .get(`${process.env.API_URL}/service/center/profile`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            .then((res) => {
                console.log(res.data);
                const serviceCenter = res?.data?.serviceCenter;

                // MAP TO RETURN THE IDS ONLY FOR SERVICE TYPES
                const serviceTypes = serviceCenter.serviceCategoryIds.map((service) => service._id);
            

                // HANDLE THE DATE
                // Create Date objects from the time values
                let handledOpenAt = new Date();
                handledOpenAt.setHours(serviceCenter.openAt, 0, 0);
                let handledCloseAt = new Date();
                handledCloseAt.setHours(serviceCenter.closeAt, 0, 0);

                console.log(handledOpenAt, handledCloseAt);
                console.log(serviceCenter.openAt, serviceCenter.closeAt);

                // SET THE STATE
                setServiceCenterTitle(serviceCenter.serviceCenterTitle);
                setServiceCenterTitleEn(serviceCenter.serviceCenterTitleEn);
                setAddress(serviceCenter.address);
                setArea(serviceCenter.area);
                setLat(serviceCenter.location.coordinates[0]);
                setLng(serviceCenter.location.coordinates[1]);
                setServiceType(serviceTypes);
                setVisitType(serviceCenter.visitType);
                setOpenAt(handledOpenAt);
                setCloseAt(handledCloseAt);
                setContacts(serviceCenter.contacts);
                setEmail(serviceCenter.email);
                setWebsite(serviceCenter.website);
                setCarBrands(serviceCenter.carBrands);
                setUsername(serviceCenter.username);
                setClosingDays(serviceCenter.closingDay);
            })
            .catch((err) => {
                console.log(err);
            });
    }

    // EFFECT TO FETCH THE CATEGORIES
    useEffect(() => {
        getServiceCenterData();
        getSubCategories();
        getCars();
    }, [lang]);



    return (
        <>
            <form dir={lang === 'en' ? 'ltr' : 'rtl'} onSubmit={handleSubmit}>
                {/* Form fields */}
                <div className={`card`}>
                    <h1 className={'text-2xl mb-5 uppercase'}>{lang === 'en' ? 'Edit Service Center' : 'تعديل مركز خدمة'}</h1>

                    <div className={'p-fluid formgrid grid'}>
                        <div className={'field col-12 md:col-6'}>
                            <label htmlFor="serviceCenterTitle">{lang === 'en' ? 'Service Center Title' : 'اسم المركز'} <span className="text-red-500">*</span></label>
                            <InputText id="serviceCenterTitle" value={serviceCenterTitle} onChange={(e) => setServiceCenterTitle(e.target.value)} placeholder={lang === 'en' ? 'Service Center Title' : 'اسم المركز'} className={errors.serviceCenterTitle ? 'p-invalid' : ''} />
                            {errors.serviceCenterTitle && <small className="p-error">{errors.serviceCenterTitle}</small>}
                        </div>
                        <div className={'field col-12 md:col-6'}>
                            <label htmlFor="serviceCenterTitleEn">{lang === 'en' ? 'Service Center Title (English)' : 'اسم المركز (إنجليزي)'} <span className="text-red-500">*</span></label>
                            <InputText id="serviceCenterTitleEn" value={serviceCenterTitleEn} onChange={(e) => setServiceCenterTitleEn(e.target.value)} placeholder={lang === 'en' ? 'Service Center Title (English)' : 'اسم المركز (إنجليزي)'} className={errors.serviceCenterTitleEn ? 'p-invalid' : ''} />
                            {errors.serviceCenterTitleEn && <small className="p-error">{errors.serviceCenterTitleEn}</small>}
                        </div>
                        <div className={'field col-12'}>
                            <label htmlFor="area">{lang === 'en' ? 'Area' : 'المنطقة'} <span className="text-red-500">*</span></label>
                            <Dropdown
                                id="area"
                                value={area}
                                options={cities}
                                optionLabel={lang === 'en' ? 'city_name_en' : 'city_name_ar'}
                                optionValue={'city_name_ar'}
                                onChange={(e) => setArea(e.target.value)}
                                placeholder={lang === 'en' ? 'Area' : 'المنطقة'}
                                filter={true}
                                className={errors.area ? 'p-invalid' : ''}
                            />
                            {errors.area && <small className="p-error">{errors.area}</small>}
                        </div>
                        <div className={'field col-12'}>
                            <label htmlFor="address">{lang === 'en' ? 'Address' : 'العنوان'} <span className="text-red-500">*</span></label>
                            <InputTextarea id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder={lang === 'en' ? 'Address' : 'العنوان'} style={{ height: '100px' }} className={errors.address ? 'p-invalid' : ''} />
                            {errors.address && <small className="p-error">{errors.address}</small>}
                        </div>
                        <div className={'field col-12 md:col-6'}>
                            <label htmlFor="lat">{lang === 'en' ? 'Latitude' : 'خط العرض'} <span className="text-red-500">*</span></label>
                            <InputText id="lat" value={lat} onChange={(e) => setLat(e.target.value)} placeholder={lang === 'en' ? 'Latitude' : 'خط العرض'} className={errors.lat ? 'p-invalid' : ''} />
                            {errors.lat && <small className="p-error">{errors.lat}</small>}
                        </div>
                        <div className={'field col-12 md:col-6'}>
                            <label htmlFor="lng">{lang === 'en' ? 'Longitude' : 'خط الطول'} <span className="text-red-500">*</span></label>
                            <InputText id="lng" value={lng} onChange={(e) => setLng(e.target.value)} placeholder={lang === 'en' ? 'Longitude' : 'خط الطول'} className={errors.lng ? 'p-invalid' : ''} />
                            {errors.lng && <small className="p-error">{errors.lng}</small>}
                        </div>
                        <div className={'field col-12'}>
                            <label htmlFor="serviceType">{lang === 'en' ? 'Service Types' : 'أنواع الخدمات'} <span className="text-red-500">*</span></label>
                            <MultiSelect
                                id="serviceType"
                                value={serviceType}
                                options={subCategories}
                                optionLabel={lang === 'en' ? 'subCategoryNameEn' : 'subCategoryName'}
                                optionValue={'_id'}
                                onChange={(e) => {
                                    console.log(e.target.value);
                                    setServiceType(e.target.value);
                                }}
                                placeholder={lang === 'en' ? 'Service Types' : 'أنواع الخدمات'}
                                filter={true}
                                showClear={true}
                                className={errors.serviceType ? 'p-invalid' : ''}
                            />
                            {errors.serviceType && <small className="p-error">{errors.serviceType}</small>}
                        </div>
                        <div className={'field col-12 md:col-6'}>
                            <label htmlFor="openAt">{lang === 'en' ? 'Open At' : 'يفتح في'} <span className="text-red-500">*</span></label>
                            <Calendar id="openAt" value={openAt} onChange={(e) => setOpenAt(e.target.value)} placeholder={lang === 'en' ? 'Open At' : 'يفتح في'} showTime={true} timeOnly={true} stepMinute={60} className={errors.openAt ? 'p-invalid' : ''} />
                            {errors.openAt && <small className="p-error">{errors.openAt}</small>}
                        </div>
                        <div className={'field col-12 md:col-6'}>
                            <label htmlFor="closeAt">{lang === 'en' ? 'Close At' : 'يغلق في'} <span className="text-red-500">*</span></label>
                            <Calendar id="closeAt" value={closeAt} onChange={(e) => setCloseAt(e.target.value)} placeholder={lang === 'en' ? 'Close At' : 'يغلق في'} showTime={true} timeOnly={true} stepMinute={60} className={errors.closeAt ? 'p-invalid' : ''} />
                            {errors.closeAt && <small className="p-error">{errors.closeAt}</small>}
                        </div>
                        <div className={'field col-12'}>
                            <label htmlFor="contacts">{lang === 'en' ? 'Contacts' : 'الاتصالات'} <span className="text-red-500">*</span></label>
                            <InputText id="contacts" value={contacts} onChange={(e) => setContacts(e.target.value)} placeholder={lang === 'en' ? 'Contacts' : 'الاتصالات'} className={errors.contacts ? 'p-invalid' : ''} />
                            {errors.contacts && <small className="p-error">{errors.contacts}</small>}
                        </div>
                        <div className={'field col-12 md:col-6'}>
                            <label htmlFor="email">{lang === 'en' ? 'Email' : 'البريد الإلكتروني'}</label>
                            <InputText id="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={lang === 'en' ? 'Email' : 'البريد الإلكتروني'} />
                        </div>
                        <div className={'field col-12 md:col-6'}>
                            <label htmlFor="website">{lang === 'en' ? 'Website' : 'الموقع الإلكتروني'}</label>
                            <InputText id="website" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder={lang === 'en' ? 'Website' : 'الموقع الإلكتروني'} />
                        </div>
                        <div className={'field col-12'}>
                            <label htmlFor="carBrands">{lang === 'en' ? 'Car Brands' : 'ماركات السيارات'} <span className="text-red-500">*</span></label>
                            <MultiSelect
                                id="carBrands" // Added id here
                                value={carBrands}
                                options={cars}
                                optionLabel={'label'}
                                optionValue={'value'}
                                onChange={(e) => setCarBrands(e.target.value)}
                                placeholder={lang === 'en' ? 'Car Brands' : 'ماركات السيارات'}
                                filter={true}
                                showClear={true}
                                itemTemplate={carTemplate}
                                className={errors.carBrands ? 'p-invalid' : ''}
                            />
                            {errors.carBrands && <small className="p-error">{errors.carBrands}</small>}
                        </div>
                        <div className={'field col-12'}>
                            <label htmlFor="visitType">{lang === 'en' ? 'Visit Type' : 'نوع الزيارة'} <span className="text-red-500">*</span></label>
                            {/*booking || direct visit*/}
                            <Dropdown
                                id="visitType"
                                value={visitType}
                                options={[
                                    { label: lang === 'en' ? 'Booking' : 'حجز', value: 'booking' },
                                    { label: lang === 'en' ? 'Direct Visit' : 'زيارة مباشرة', value: 'direct visit' },
                                    { label: lang === 'en' ? 'Both' : 'كلاهما', value: 'both' }
                                ]}
                                optionLabel={'label'}
                                optionValue={'value'}
                                onChange={(e) => setVisitType(e.target.value)}
                                placeholder={lang === 'en' ? 'Visit Type' : 'نوع الزيارة'}
                                filter={true}
                                className={errors.visitType ? 'p-invalid' : ''}
                            />
                            {errors.visitType && <small className="p-error">{errors.visitType}</small>}
                        </div>
                        <div className="col-12 mb-2 lg:mb-2" dir={'ltr'}>
                            <label className={'mb-2 block'} htmlFor="closingDays" dir={lang === 'en' ? 'ltr' : 'rtl'}>
                                {lang === 'en' ? 'Closing Days' : 'أيام الإغلاق'}
                            </label>

                            <MultiSelect
                                id="closingDays"
                                value={closingDays}
                                options={[
                                    { label: lang === 'en' ? 'Saturday' : 'السبت', value: 'saturday' },
                                    { label: lang === 'en' ? 'Sunday' : 'الأحد', value: 'sunday' },
                                    { label: lang === 'en' ? 'Monday' : 'الأثنين', value: 'monday' },
                                    { label: lang === 'en' ? 'Tuesday' : 'الثلاثاء', value: 'tuesday' },
                                    { label: lang === 'en' ? 'Wednesday' : 'الأربعاء', value: 'wednesday' },
                                    { label: lang === 'en' ? 'Thursday' : 'الخميس', value: 'thursday' },
                                    { label: lang === 'en' ? 'Friday' : 'الجمعة', value: 'friday' }
                                ]}
                                onChange={(e) => setClosingDays(e.target.value)}
                                placeholder={lang === 'en' ? 'Closing Days' : 'أيام الإغلاق'}
                            />
                        </div>
                        <div className={'field col-12'}>
                            <label htmlFor="files">{lang === 'en' ? 'Images' : 'الصور'}</label>
                            <CustomFileUpload id="files" multiple={true} setFiles={(files) => setFiles(files)} removeThisItem={() => setFiles([])} />
                        </div>
                    </div>
                </div>

                {/* Form fields (same structure, but values are pre-filled with existingData) */}
                <div className={`card mt-5`}>
                    <div className={'p-fluid formgrid grid'}>
                        <div className={'field col-12'}>
                            <label htmlFor="username">{lang === 'en' ? 'Username' : 'اسم المستخدم'} <span className="text-red-500">*</span></label>
                            <InputText id="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder={lang === 'en' ? 'Username' : 'اسم المستخدم'} className={errors.username ? 'p-invalid' : ''} />
                            {errors.username && <small className="p-error">{errors.username}</small>}
                        </div>
                        <div className={'field col-12 md:col-6'}>
                            <label htmlFor="password">{lang === 'en' ? 'Password' : 'كلمة المرور'} <span className="text-red-500">*</span></label>
                            <Password
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder={lang === 'en' ? 'Password' : 'كلمة المرور'}
                                toggleMask={true}
                                header={<Header lang={lang} />}
                                footer={<Footer lang={lang} />}
                                className={errors.password ? 'p-invalid' : ''}
                            />
                             {errors.password && <small className="p-error">{errors.password}</small>}
                        </div>
                        <div className={'field col-12 md:col-6'}>
                            <label htmlFor="confirmPassword">{lang === 'en' ? 'Confirm Password' : 'تأكيد كلمة المرور'} <span className="text-red-500">*</span></label>
                            <Password
                                id="confirmPassword"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder={lang === 'en' ? 'Confirm Password' : 'تأكيد كلمة المرور'}
                                toggleMask={true}
                                header={<Header lang={lang} />}
                                footer={<Footer lang={lang} />}
                                className={errors.confirmPassword ? 'p-invalid' : ''}
                            />
                            {errors.confirmPassword && <small className="p-error">{errors.confirmPassword}</small>}
                        </div>
                    </div>
                </div>

                <div className={'flex justify-center mt-5'}>
                    <Button
                        label={lang === 'en' ? 'Edit Service Center' : 'تعديل مركز خدمة'}
                        icon="pi pi-save"
                        style={{
                            width: '100%',
                            padding: '1rem'
                        }}
                    />
                </div>
            </form>
        </>
    );
}
