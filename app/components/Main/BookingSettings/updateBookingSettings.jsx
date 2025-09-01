'use client';
import React, { useCallback } from 'react';
import axios from 'axios';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
import { toast } from 'react-hot-toast';

export default function UpdateBookingSettings({ lang }) {
    const isRTL = lang === 'ar';
    const [services, setServices] = React.useState([]);
    const [bookingPlan, setBookingPlan] = React.useState([]);
    const [bookingSettingsId, setBookingSettingsId] = React.useState('');
    const [maximumCapacity, setMaximumCapacity] = React.useState(1);
    const [errors, setErrors] = React.useState({});

    function validateForm() {
        const newErrors = {};
        let isValid = true;

        if (!maximumCapacity) {
            newErrors.maximumCapacity = lang === 'en' ? 'Maximum Capacity is a required field.' : 'الحد الأقصى للسعة مطلوب.';
            isValid = false;
        }

        const bookingPlanErrors = [];
        bookingPlan.forEach((item, index) => {
            const itemErrors = {};
            if (!item.serviceId) {
                itemErrors.serviceId = lang === 'en' ? 'Service is a required field.' : 'الخدمة مطلوبة.';
                isValid = false;
            }
            if (!item.capacity || item.capacity <= 0) {
                itemErrors.capacity = lang === 'en' ? 'Capacity is required.' : 'السعة مطلوبة.';
                isValid = false;
            }
            if (!item.averageTime || item.averageTime <= 0) {
                itemErrors.averageTime = lang === 'en' ? 'Average Time is required.' : 'متوسط الوقت مطلوب.';
                isValid = false;
            }
            if (Object.keys(itemErrors).length > 0) {
                bookingPlanErrors[index] = itemErrors;
            }
        });

        if (bookingPlanErrors.length > 0) {
            newErrors.bookingPlan = bookingPlanErrors;
        }

        setErrors(newErrors);
        return isValid;
    }

    function addNewService() {
        setBookingPlan([
            ...bookingPlan,
            {
                serviceId: '',
                capacity: 1,
                averageTime: 1,
                isMainPlan: false
            }
        ]);
    }

    async function updateBookingSettings(event) {
        event.preventDefault();

        if (!validateForm()) {
            return;
        }

        const token = localStorage.getItem('token') || null;

        axios
            .put(
                `${process.env.API_URL}/update/booking/settings`,
                {
                    maximumCapacity,
                    services: bookingPlan,
                    bookingSettingsId
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            )
            .then(() => {
                toast.success(lang === 'en' ? 'Booking Settings Updated Successfully' : 'تم تحديث إعدادات الحجز بنجاح');
            })
            .catch((err) => {
                toast.error(err.response?.data?.message || lang === 'en' ? 'Something went wrong' : 'حدث خطأ ما');
            });
    }

    const getServices = useCallback(() => {
        const token = localStorage.getItem('token') || null;

        axios
            .get(`${process.env.API_URL}/services/details`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            .then((response) => {
                const services = response.data?.serviceCenter?.serviceCategoryIds.map((service) => ({
                    value: service._id,
                    label: lang === 'en' ? service.subCategoryNameEn : service.subCategoryName
                }));
                setServices(services || []);
            })
            .catch((error) => {
                console.log(error);
            });
    }, [lang]);

    const getBookingSettings = useCallback(() => {
        const token = localStorage.getItem('token') || null;

        axios
            .get(`${process.env.API_URL}/booking/settings`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            .then((response) => {
                const settings = response.data?.bookingSettings;
                if (settings) {
                    setBookingSettingsId(settings._id);
                    // Set maximum capacity if available
                    if (settings.maximumCapacity) {
                        setMaximumCapacity(settings.maximumCapacity);
                    }
                    // Transform services data to match expected format
                    const transformedServices = settings.services.map((service) => ({
                        serviceId: service.serviceId._id,
                        capacity: service.capacity,
                        averageTime: service.averageTime,
                        isMainPlan: service.isMainPlan || false
                    }));
                    setBookingPlan(transformedServices || []);
                }
            })
            .catch((error) => {
                console.log(error);
            });
    }, []);

    React.useEffect(() => {
        getBookingSettings();
    }, [getBookingSettings]);

    React.useEffect(() => {
        getServices();
    }, [getServices]);

    return (
        <form onSubmit={updateBookingSettings} dir={isRTL ? 'rtl' : 'ltr'}>
            {' '}
            <div className={'card'}>
                <h3 className={'text-2xl mb-5 uppercase'}>{lang === 'en' ? 'Update Booking Settings' : 'تحديث إعدادات الحجز'}</h3>
                <hr />

                <div className={'p-fluid formgrid grid mb-4'}>
                    <div className={'field col-12'}>
                        <label className={'font-bold'} htmlFor="maximumCapacity">
                            {lang === 'en' ? 'Maximum Capacity' : 'الحد الأقصى للسعة'} <span className="text-red-500">*</span>
                        </label>
                        <Dropdown
                            id="maximumCapacity"
                            value={maximumCapacity}
                            options={Array.from({ length: 10 }, (_, i) => ({
                                label: (i + 1).toString(),
                                value: i + 1
                            }))}
                            onChange={(e) => setMaximumCapacity(e.value)}
                            placeholder={lang === 'en' ? 'Select Maximum Capacity' : 'اختر الحد الأقصى للسعة'}
                            className={`${errors.maximumCapacity ? 'p-invalid' : ''}`}
                        />
                        {errors.maximumCapacity && <small className="p-error">{errors.maximumCapacity}</small>}
                    </div>
                </div>

                <h4 className={'text-xl mb-3'}>{lang === 'en' ? 'Services' : 'الخدمات'}</h4>
                {bookingPlan.length > 0 &&
                    bookingPlan.map((item, index) => (
                        <div className={'p-fluid formgrid grid mb-2 align-items-center'} key={index}>
                            <div className={'field col-4'}>
                                <label className={'font-bold'} htmlFor={`serviceId${index}`}>
                                    {lang === 'en' ? 'Service' : 'الخدمة'} <span className="text-red-500">*</span>
                                </label>
                                <Dropdown
                                    id={`serviceId${index}`}
                                    value={item.serviceId}
                                    options={services}
                                    onChange={(e) => {
                                        const plan = [...bookingPlan];
                                        plan[index].serviceId = e.value;
                                        setBookingPlan(plan);
                                    }}
                                    placeholder={lang === 'en' ? 'Select Service' : 'اختر الخدمة'}
                                    className={`${errors.bookingPlan?.[index]?.serviceId ? 'p-invalid' : ''}`}
                                />
                                {errors.bookingPlan?.[index]?.serviceId && <small className="p-error">{errors.bookingPlan[index].serviceId}</small>}
                            </div>
                            <div className={'field col-3'}>
                                <label className={'font-bold'} htmlFor={`capacity${index}`}>
                                    {lang === 'en' ? 'Capacity' : 'السعة'} <span className="text-red-500">*</span>
                                </label>
                                <Dropdown
                                    id={`capacity${index}`}
                                    value={item.capacity}
                                    options={Array.from({ length: 10 }, (_, i) => ({
                                        label: (i + 1).toString(),
                                        value: i + 1
                                    }))}
                                    onChange={(e) => {
                                        const plan = [...bookingPlan];
                                        plan[index].capacity = e.value;
                                        setBookingPlan(plan);
                                    }}
                                    placeholder={lang === 'en' ? 'Select Capacity' : 'اختر السعة'}
                                    className={`${errors.bookingPlan?.[index]?.capacity ? 'p-invalid' : ''}`}
                                />
                                {errors.bookingPlan?.[index]?.capacity && <small className="p-error">{errors.bookingPlan[index].capacity}</small>}
                            </div>
                            <div className={'field col-2'}>
                                <label className={'font-bold'} htmlFor={`averageTime${index}`}>
                                    {lang === 'en' ? 'Average Time (hrs)' : 'متوسط الوقت (ساعات)'} <span className="text-red-500">*</span>
                                </label>
                                <Dropdown
                                    id={`averageTime${index}`}
                                    value={item.averageTime}
                                    options={Array.from({ length: 8 }, (_, i) => ({
                                        label: `${i + 1} ${lang === 'en' ? 'hour' : 'ساعة'}${i > 0 ? (lang === 'en' ? 's' : '') : ''}`,
                                        value: i + 1
                                    }))}
                                    onChange={(e) => {
                                        const plan = [...bookingPlan];
                                        plan[index].averageTime = e.value;
                                        setBookingPlan(plan);
                                    }}
                                    placeholder={lang === 'en' ? 'Select Time' : 'اختر الوقت'}
                                    className={`${errors.bookingPlan?.[index]?.averageTime ? 'p-invalid' : ''}`}
                                />
                                {errors.bookingPlan?.[index]?.averageTime && <small className="p-error">{errors.bookingPlan[index].averageTime}</small>}
                            </div>
                            <div className={'field col-1 flex flex-column align-items-center'}>
                                <label className={'font-bold'}>{lang === 'en' ? 'Main Plan' : 'الخطة الرئيسية'}</label>
                                <Checkbox
                                    checked={item.isMainPlan}
                                    onChange={(e) => {
                                        const plan = [...bookingPlan];
                                        plan[index].isMainPlan = e.checked;
                                        setBookingPlan(plan);
                                    }}
                                />
                            </div>
                            <div className={'field col-1 flex flex-column align-items-end'}>
                                <label className={'font-bold'}>{lang === 'en' ? 'Delete' : 'حذف'}</label>
                                <Button
                                    icon="pi pi-trash"
                                    className={'p-button-danger'}
                                    onClick={() => {
                                        const plan = [...bookingPlan];
                                        plan.splice(index, 1);
                                        setBookingPlan(plan);
                                    }}
                                />
                            </div>
                        </div>
                    ))}

                <button type={'button'} className={'btn btn-primary'} onClick={addNewService}>
                    {lang === 'en' ? 'Add Service' : 'إضافة خدمة'}
                </button>
            </div>
            <div className={'flex justify-center mt-5'}>
                <Button
                    label={lang === 'en' ? 'Update Booking Settings' : 'تحديث إعدادات الحجز'}
                    icon="pi pi-save"
                    style={{
                        width: '100%',
                        padding: '1rem'
                    }}
                />
            </div>
        </form>
    );
}
