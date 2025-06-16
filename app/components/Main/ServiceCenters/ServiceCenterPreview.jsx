import React from 'react';
import { Tag } from 'primereact/tag';
import { Divider } from 'primereact/divider';
import { Rating } from 'primereact/rating';
import Image from 'next/image';

const ServiceCenterPreview = ({
    lang,
    serviceCenterImage,
    isActive,
    isApproved,
    serviceCenterTitle,
    serviceCenterTitleEn,
    averageRating,
    area,
    address,
    openAt,
    closeAt,
    contacts,
    email,
    website,
    visitType,
    serviceTypes,
    carBrands
}) => {
    const getVisitTypeLabel = (type) => {
        if (type === 'booking') return lang === 'en' ? 'Booking' : 'حجز';
        if (type === 'direct visit') return lang === 'en' ? 'Direct Visit' : 'زيارة مباشرة';
        if (type === 'both') return lang === 'en' ? 'Both' : 'كلاهما';
        return type;
    };

    // Function to format time
    const formatTime = (hour) => {
        if (hour === undefined || hour === null) return '';
        const formattedHour = hour % 12 || 12;
        const ampm = hour >= 12 ? 'PM' : 'AM';
        return `${formattedHour} ${ampm}`;
    };

    return (
        <>
            {/* Service Center Preview Section */}
            <div className="card mb-5 service-center-preview shadow-4" style={{ borderRadius: '12px', overflow: 'hidden', transition: 'all 0.3s ease', position: 'relative' }}>
                {/* Preview Header */}
                <div
                    className="preview-header p-3"
                    style={{
                        background: 'linear-gradient(135deg, #3498db, #2c3e50)',
                        color: 'white',
                        borderTopLeftRadius: '12px',
                        borderTopRightRadius: '12px'
                    }}
                >
                    <div className="flex align-items-center justify-content-between">
                        <h2 className="m-0 text-xl font-bold">
                            <i className="pi pi-eye mr-2"></i>
                            {lang === 'en' ? 'Service Center Preview' : 'معاينة مركز الخدمة'}
                        </h2>
                        <div className="flex align-items-center gap-2">
                            <Tag
                                icon={`pi pi-${isActive ? 'check' : 'times'}`}
                                value={lang === 'en' ? `${isActive ? 'Active' : 'Inactive'}` : `${isActive ? 'نشط' : 'غير نشط'}`}
                                severity={isActive ? 'success' : 'danger'}
                            />
                            <Tag
                                icon={`pi pi-${isApproved ? 'verified' : 'ban'}`}
                                value={lang === 'en' ? `${isApproved ? 'Approved' : 'Not Approved'}` : `${isApproved ? 'معتمد' : 'غير معتمد'}`}
                                severity={isApproved ? 'info' : 'warning'}
                            />
                            <Tag value={lang === 'en' ? 'Current Data' : 'البيانات الحالية'} severity="info" />
                        </div>
                    </div>
                </div>

                <div className="grid" style={{ animation: 'fadeIn 0.5s ease-in-out' }}>
                    <div className="col-12 md:col-4 lg:col-3 flex mt-4 justify-content-center" style={{ minHeight: '250px' }}>
                        <div className="image-container p-3" style={{ position: 'relative', width: '100%', height: '250px', maxWidth: '300px', transition: 'transform 0.3s ease' }}>
                            {serviceCenterImage ? (
                                <Image
                                    src={serviceCenterImage}
                                    alt={serviceCenterTitle || 'Service Center'}
                                    layout="fill"
                                    objectFit="cover"
                                    className="border-round shadow-4"
                                    style={{ transition: 'transform 0.3s ease' }}
                                    onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                                    onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                                />
                            ) : (
                                <div className="flex align-items-center justify-content-center h-full border-round bg-gray-100 shadow-4">
                                    <i className="pi pi-image text-6xl text-gray-400"></i>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="col-12 md:col-8 lg:col-9">
                        <div className="p-4">
                            <div className="flex align-items-center justify-content-between mb-3">
                                <div>
                                    <h2 className="text-2xl font-bold m-0" style={{ color: '#2c3e50' }}>
                                        {serviceCenterTitle || ''}
                                    </h2>
                                    <h3 className="text-lg text-500 m-0 mt-1">{serviceCenterTitleEn || ''}</h3>
                                </div>
                                <div className="flex align-items-center p-2 border-round" style={{ background: 'rgba(0,0,0,0.03)' }}>
                                    <Rating value={averageRating} readOnly stars={5} cancel={false} />
                                    <span className="ml-2 font-bold" style={{ color: '#f39c12' }}>
                                        {averageRating}
                                    </span>
                                </div>
                            </div>

                            <Divider className="my-3" />

                            <div className="grid">
                                <div className="col-12 md:col-6">
                                    <div className="flex align-items-center mb-3 p-2 border-round hover:bg-gray-50" style={{ transition: 'background-color 0.2s' }}>
                                        <i className="pi pi-map-marker mr-2 text-primary text-xl"></i>
                                        <span>
                                            {area}, {address}
                                        </span>
                                    </div>
                                    <div className="flex align-items-center mb-3 p-2 border-round hover:bg-gray-50" style={{ transition: 'background-color 0.2s' }}>
                                        <i className="pi pi-clock mr-2 text-primary text-xl"></i>
                                        <span>
                                            {formatTime(openAt instanceof Date ? openAt.getHours() : openAt)} - {formatTime(closeAt instanceof Date ? closeAt.getHours() : closeAt)}
                                        </span>
                                    </div>
                                    <div className="flex align-items-center mb-3 p-2 border-round hover:bg-gray-50" style={{ transition: 'background-color 0.2s' }}>
                                        <i className="pi pi-phone mr-2 text-primary text-xl"></i>
                                        <span>{contacts}</span>
                                    </div>
                                </div>

                                <div className="col-12 md:col-6">
                                    <div className="flex align-items-center mb-3 p-2 border-round hover:bg-gray-50" style={{ transition: 'background-color 0.2s' }}>
                                        <i className="pi pi-envelope mr-2 text-primary text-xl"></i>
                                        <span>{email}</span>
                                    </div>
                                    <div className="flex align-items-center mb-3 p-2 border-round hover:bg-gray-50" style={{ transition: 'background-color 0.2s' }}>
                                        <i className="pi pi-globe mr-2 text-primary text-xl"></i>
                                        <span className="text-blue-500 hover:text-blue-700" style={{ transition: 'color 0.2s' }}>
                                            <a href={website} target="_blank" rel="noopener noreferrer">
                                                {website}
                                            </a>
                                        </span>
                                    </div>
                                    <div className="flex align-items-center mb-3 p-2 border-round hover:bg-gray-50" style={{ transition: 'background-color 0.2s' }}>
                                        <i className="pi pi-calendar mr-2 text-primary text-xl"></i>
                                        <Tag
                                            value={getVisitTypeLabel(visitType)}
                                            severity="info"
                                            style={{ transform: 'scale(1)', transition: 'transform 0.2s' }}
                                            onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                                            onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                                        />
                                    </div>
                                </div>
                            </div>

                            <Divider className="my-3" />

                            <div>
                                <h4 className="mt-0 mb-2" style={{ color: '#2c3e50' }}>
                                    {lang === 'en' ? 'Services' : 'الخدمات'}
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {serviceTypes.map((service, index) => (
                                        <Tag
                                            key={index}
                                            value={service}
                                            severity="success"
                                            style={{ transform: 'scale(1)', transition: 'transform 0.2s' }}
                                            onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                                            onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="mt-3">
                                <h4 className="mt-0 mb-2" style={{ color: '#2c3e50' }}>
                                    {lang === 'en' ? 'Car Brands' : 'ماركات السيارات'}
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {Array.isArray(carBrands) &&
                                        carBrands.map((brand, index) => (
                                            <Tag
                                                key={index}
                                                value={brand}
                                                severity="warning"
                                                style={{ transform: 'scale(1)', transition: 'transform 0.2s' }}
                                                onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                                                onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                                            />
                                        ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Add CSS animation */}
                <style jsx>{`
                    @keyframes fadeIn {
                        from {
                            opacity: 0;
                            transform: translateY(10px);
                        }
                        to {
                            opacity: 1;
                            transform: translateY(0);
                        }
                    }

                    .service-center-preview:hover {
                        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1) !important;
                    }
                `}</style>
            </div>
        </>
    );
};

export default ServiceCenterPreview;