'use client';
import React from 'react';
import axios from 'axios';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { toast } from 'react-hot-toast';

export default function BookingSettingsFormPart({ lang }) {
    const isRTL = lang === 'ar';
    const [services, setServices] = React.useState([]);
    const [bookingPlan, setBookingPlan] = React.useState([]);
    const [maximumCapacity, setMaximumCapacity] = React.useState(1);

    function addNewService() {
        setBookingPlan([
            ...bookingPlan,
            {
                serviceId: '',
                capacity: 1,
                averageTime: 1
            }
        ]);
    }

    async function createBookingPlan(event) {
        event.preventDefault();

        const token = localStorage.getItem('token') || null;

        // Validate all fields are filled
        const isValid = bookingPlan.every((item) => item.serviceId);
        if (!isValid) {
            return toast.error(lang === 'en' ? 'Please fill all fields' : 'يرجى ملء جميع الحقول');
        }
        axios
            .post(
                `${process.env.API_URL}/create/booking/plan`,
                {
                    maximumCapacity,
                    services: bookingPlan
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            )
            .then(() => {
                toast.success(lang === 'en' ? 'Booking Plan Created Successfully' : 'تم إنشاء خطة الحجز بنجاح');
            })
            .catch((err) => {
                toast.error(err.response?.data?.message || lang === 'en' ? 'Something went wrong' : 'حدث خطأ ما');
            });
    }

    function getServices() {
        const token = localStorage.getItem('token') || null;

        axios
            .get(`${process.env.API_URL}/services/details`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            .then((response) => {
                console.log(response.data);
                const services = response.data?.serviceCenter?.serviceCategoryIds.map((service) => ({
                    value: service._id,
                    label: lang === 'en' ? service.subCategoryNameEn : service.subCategoryName
                }));

                console.log(services);
                setServices(services || []);
            })
            .catch((error) => {
                console.log(error);
            });
    }

    React.useEffect(() => {
        getServices();
    }, []);

    return (
        <form onSubmit={createBookingPlan} dir={isRTL ? 'rtl' : 'ltr'}>
            {' '}
            <div className={'card'}>
                <h3 className={'text-2xl mb-5 uppercase'}>{lang === 'en' ? 'Booking Settings' : 'إعدادات الحجز'}</h3>
                <hr />

                <div className={'p-fluid formgrid grid mb-4'}>
                    <div className={'field col-12'}>
                        <label className={'font-bold'} htmlFor="maximumCapacity">
                            {lang === 'en' ? 'Maximum Capacity' : 'الحد الأقصى للسعة'}
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
                        />
                    </div>
                </div>

                <h4 className={'text-xl mb-3'}>{lang === 'en' ? 'Services' : 'الخدمات'}</h4>
                {bookingPlan.length > 0 &&
                    bookingPlan.map((item, index) => (
                        <div className={'p-fluid formgrid grid mb-2 align-items-center'} key={index}>
                            <div className={'field col-4'}>
                                <label className={'font-bold'} htmlFor={`serviceId${index}`}>
                                    {lang === 'en' ? 'Service' : 'الخدمة'}
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
                                />
                            </div>
                            <div className={'field col-3'}>
                                <label className={'font-bold'} htmlFor={`capacity${index}`}>
                                    {lang === 'en' ? 'Capacity' : 'السعة'}
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
                                />
                            </div>
                            <div className={'field col-3'}>
                                <label className={'font-bold'} htmlFor={`averageTime${index}`}>
                                    {lang === 'en' ? 'Average Time (hrs)' : 'متوسط الوقت (ساعات)'}
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
                                />
                            </div>
                            <div className={'field col-2 flex flex-column align-items-center'}>
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
                    label={lang === 'en' ? 'Create Booking Plan' : 'إنشاء خطة الحجز'}
                    icon="pi pi-plus"
                    style={{
                        width: '100%',
                        padding: '1rem'
                    }}
                />
            </div>
        </form>
    );
}
