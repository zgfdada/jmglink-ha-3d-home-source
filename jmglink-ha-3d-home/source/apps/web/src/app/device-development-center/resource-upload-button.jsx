import {a as React} from '../../vendor/react.js';
import './resource-upload-button.css';

export default function ResourceUploadButton({name, disabled, onClick, title}) {
  return <button className="ddc-resource-upload" type="button" disabled={disabled}
    title={title || ('上传' + name + '到资源中心')} onClick={onClick}>上传</button>;
}
