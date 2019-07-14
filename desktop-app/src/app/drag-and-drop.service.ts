import { Injectable } from '@angular/core';
import { AppService } from './app.service';
import { LoadingSpinnerService } from './loading-spinner.service';
import { StatusBarService } from './status-bar.service';
import { AdbClientService } from './adb-client.service';
import { WebviewService } from './webview.service';

@Injectable({
    providedIn: 'root',
})
export class DragAndDropService {
    constructor(
        private adbService: AdbClientService,
        private appService: AppService,
        private spinnerService: LoadingSpinnerService,
        private statusService: StatusBarService,
        private webService: WebviewService
    ) {
        this.setupDragAndDrop();
    }
    setupDragAndDrop() {
        let dragTimeout;
        document.ondragover = () => {
            if (this.webService.isWebviewOpen) return;
            clearTimeout(dragTimeout);
            this.spinnerService.setMessage(
                this.appService.isFilesOpen ? 'Drop files to upload!' : 'Drop the file here to install!'
            );
            this.spinnerService.showDrag();
            return false;
        };

        document.ondragleave = () => {
            if (this.webService.isWebviewOpen) return;
            dragTimeout = setTimeout(() => {
                this.spinnerService.hideLoader();
            }, 1000);
            return false;
        };

        document.ondragend = () => {
            if (this.webService.isWebviewOpen) return;
            this.spinnerService.hideLoader();
            return false;
        };

        document.ondrop = e => {
            if (this.webService.isWebviewOpen) return;
            e.preventDefault();
            if (this.appService.isFilesOpen && this.appService.filesComponent) {
                return this.appService.filesComponent.uploadFilesFromList(
                    Object.keys(e.dataTransfer.files).map(i => e.dataTransfer.files[i].path)
                );
            }
            [].slice.call(e.dataTransfer.files).forEach(file => {
                let filepath = file.path;
                if (['.apk', '.obb'].includes(this.appService.path.extname(filepath))) {
                    if (this.appService.path.extname(filepath) === '.apk') {
                        this.adbService.installAPK(filepath, true);
                    } else {
                        this.adbService.installLocalObb(filepath);
                    }
                } else {
                    this.spinnerService.hideLoader();
                    this.statusService.showStatus('Unrecognised File: ' + filepath, true);
                }
            });
            return false;
        };
    }
}
