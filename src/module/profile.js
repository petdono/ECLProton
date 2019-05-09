/*
Copyright (c) 2019 Matt Worzala <bhop.me>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

const { app, ipcMain } = require('electron');
const fs = require('fs-extra');
const path = require('path');

const baseDir = app.getPath('userData');
const instanceDir = path.join(baseDir, 'Instances');

let mainWindow = null;

app.on('ready', () => {
    ipcMain.on('profile:custom', (event, payload) => {
        if (mainWindow == null)
            mainWindow = event.sender;
        switch (payload.action) {
            case 'CREATE':
                this.createBaseProfile(payload).then(code => {


                });
                break;
            case 'CANCEL':
                console.log(payload);
                break;
            case 'OVERWRITE':

                break;
            default:
                break;
        }
    });
});

exports.createBaseProfile = async (data, overwrite) => {
    const dir = path.join(instanceDir, data.name);

    if (await fs.pathExists(dir))
        return 2; //todo check the profile data file instead
    await fs.mkdirs(dir);

};

const handleResponseCode = code => {
    switch (code) {
        // Successfully created.
        case 0:
            //todo send notification
            console.log('FINISHED INSTALLING PROFILE, THIS SHOULD SEND A SYSTEM NOTIFICATION.');
            break;
        // Profile already exists.
        case 2:
            mainWindow.send('profile:custom', {
                result: 'ERROR',
                type: 'arbitrary',
                value: 'A profile with that name already exists!'
            });
            break;
        // Assume error if nothing else.
        default:
            mainWindow.send('profile:custom', {
                result: 'ERROR',
                type: 'arbitrary',
                value: 'An unknown error has occurred, please try again.'
            });
            break;
    }
};