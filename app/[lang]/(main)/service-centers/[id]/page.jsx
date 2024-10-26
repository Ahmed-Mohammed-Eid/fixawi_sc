import EditServiceCenterForm from '../../../../components/Main/ServiceCenters/EditForm';

export default async function EditServiceCenter({params: {lang}}) {

    return (
        <>
            <EditServiceCenterForm lang={lang} />
        </>
    );
}