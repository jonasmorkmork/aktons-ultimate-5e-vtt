// src/components/ImageUtils.js

/**
 * Henter dimensioner (bredde/højde) på et billede uden at loade hele filen i memory som et canvas.
 */
export const getImageDimensions = (file) => {
    return new Promise((resolve, reject) => {
        if (!file.type.match(/image.*/)) {
            reject(new Error("Filen er ikke et billede."));
            return;
        }
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);
        
        img.onload = () => {
            const dims = { width: img.width, height: img.height };
            URL.revokeObjectURL(objectUrl); // Ryd op i memory
            resolve(dims);
        };
        img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error("Kunne ikke læse billedets dimensioner."));
        };
        img.src = objectUrl;
    });
};

/**
 * Simpel hjælper til at læse en fil som DataURL (hvis vi beholder originalen)
 */
export const readFileAsDataURL = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(file);
    });
};

/**
 * Nedskalerer et billede til max 4K (default).
 */
export const resizeMapImage = (file, maxWidth = 3840, maxHeight = 2160) => {
    return new Promise((resolve, reject) => {
        if (!file.type.match(/image.*/)) {
            reject(new Error("Filen er ikke et billede."));
            return;
        }

        const reader = new FileReader();
        reader.onload = (readerEvent) => {
            const image = new Image();
            image.onload = () => {
                let width = image.width;
                let height = image.height;

                // Hvis billedet allerede er mindre end grænsen, returner original
                if (width <= maxWidth && height <= maxHeight) {
                    resolve(readerEvent.target.result);
                    return;
                }

                // Beregn aspect ratio
                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(image, 0, 0, width, height);

                // Vi bruger 0.85 kvalitet, som er fint til 4K maps
                const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
                resolve(dataUrl);
            };
            image.onerror = () => reject(new Error("Kunne ikke indlæse billedet."));
            image.src = readerEvent.target.result;
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });
};