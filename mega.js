import * as mega from 'megajs';

const auth = {
    email: 'your-email@gmail.com',
    password: 'your-password',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
};

export const upload = (data, name) => {
    return new Promise((resolve, reject) => {
        try {
            const storage = new mega.Storage(auth, () => {
                const uploadStream = storage.upload({ name: name, allowUploadBuffering: true });
                data.pipe(uploadStream);
                storage.on("add", (file) => {
                    file.link((err, url) => {
                        if (err) {
                            reject(err);
                        } else {
                            storage.close();
                            resolve(url);
                        }
                    });
                });
                storage.on("error", (error) => {
                    reject(error);
                });
            });
        } catch (err) {
            reject(err);
        }
    });
};

export const download = (url) => {
    return new Promise((resolve, reject) => {
        try {
            const file = mega.File.fromURL(url);
            file.loadAttributes((err) => {
                if (err) {
                    reject(err);
                    return;
                }
                file.downloadBuffer((err, buffer) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(buffer);
                    }
                });
            });
        } catch (err) {
            reject(err);
        }
    });
};