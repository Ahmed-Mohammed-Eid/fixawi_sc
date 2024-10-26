"use client";
import React, {useRef, useState} from 'react';
import {Toast} from 'primereact/toast';
import {FileUpload} from 'primereact/fileupload';
import {ProgressBar} from 'primereact/progressbar';
import {Button} from 'primereact/button';
import {Tooltip} from 'primereact/tooltip';

export default function CustomFileUpload({multiple, setFiles, removeThisItem}) {
    const toast = useRef(null);
    const [totalSize, setTotalSize] = useState(0);
    const fileUploadRef = useRef(null);

    const onTemplateSelect = (e) => {
        let _totalSize = totalSize;
        let files = e.files;

        Object.keys(files).forEach((key) => {
            _totalSize += files[key].size || 0;
        });

        setTotalSize(_totalSize);

        // SET THE FILES IN THE PARENT COMPONENT
        setFiles(files);
    };

    const onTemplateRemove = (file, callback) => {
        setTotalSize(totalSize - file.size);
        callback();
    };

    const onTemplateClear = () => {
        setTotalSize(0);
        // REMOVE THE ITEM FROM THE STATE
        setFiles([]);
    };

    const headerTemplate = (options) => {
        const {className, chooseButton, cancelButton} = options;
        const value = totalSize / 100000;
        const formatedValue = fileUploadRef && fileUploadRef.current ? fileUploadRef.current.formatSize(totalSize) : '0 B';

        return (
            <div className={className} style={{backgroundColor: 'transparent', display: 'flex', alignItems: 'center'}}>
                {chooseButton}
                {cancelButton}
                <div className="flex align-items-center gap-3 ml-auto">
                    <span>{formatedValue} / 10 MB</span>
                    <ProgressBar value={value} showValue={false} style={{width: '10rem', height: '12px'}}></ProgressBar>
                </div>
            </div>
        );
    };

    const itemTemplate = (file, props) => {
        return (
            <div className="flex align-items-center flex-wrap">
                <div className="flex align-items-center" style={{width: '40%'}}>
                    <img alt={file.name} role="presentation" src={file.objectURL} width={100}/>
                    <span className="flex flex-column text-left ml-3">
                        {file.name}
                        <small>{new Date().toLocaleDateString()}</small>
                    </span>
                </div>
                <Button
                    type="button"
                    icon="pi pi-times"
                    className="p-button-outlined p-button-rounded p-button-danger ml-auto"
                    onClick={() => {
                        onTemplateRemove(file, props.onRemove)
                        // set the state with index to remove it
                        removeThisItem(props.index)
                    }}/>
            </div>
        );
    };

    const emptyTemplate = () => {
        return (
            <div className="flex align-items-center flex-column">
                <span style={{fontSize: '1.2em', color: 'var(--text-color-secondary)'}} className="my-5">
                    Drag and Drop File Here
                </span>
            </div>
        );
    };

    const chooseOptions = {
        icon: 'pi pi-fw pi-images',
        iconOnly: true,
        className: 'custom-choose-btn p-button-rounded p-button-outlined'
    };
    const cancelOptions = {
        icon: 'pi pi-fw pi-times',
        iconOnly: true,
        className: 'custom-cancel-btn p-button-danger p-button-rounded p-button-outlined'
    };

    return (
        <div>
            <Toast ref={toast}></Toast>

            <Tooltip target=".custom-choose-btn" content="Choose" position="bottom"/>
            <Tooltip target=".custom-cancel-btn" content="Clear" position="bottom"/>

            <FileUpload ref={fileUploadRef} multiple={multiple || false} accept="image/*" maxFileSize={10000000}
                        onSelect={onTemplateSelect} onError={onTemplateClear} onClear={onTemplateClear}
                        headerTemplate={headerTemplate} itemTemplate={itemTemplate} emptyTemplate={emptyTemplate}
                        chooseOptions={chooseOptions} cancelOptions={cancelOptions}/>
        </div>
    )
}
