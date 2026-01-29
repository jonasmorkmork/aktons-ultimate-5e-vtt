export const createImage = (url) =>
    new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener('load', () => resolve(image));
        image.addEventListener('error', (error) => reject(error));
        image.setAttribute('crossOrigin', 'anonymous'); 
        image.src = url;
    });

export const getCroppedImg = async (imageSrc, pixelCrop) => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        return null;
    }

    // Indstil canvas til den beskårne størrelse
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    // Tegn billedet på canvas (beskåret)
    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
    );

    // Konverter til Base64 (Vi komprimerer til JPEG 70% for at spare plads i Firestore)
    // Hvis vi bare gemte den fulde opløsning, ville vi hurtigt ramme Firestores 1MB grænse pr dokument.
    return new Promise((resolve) => {
        // Vi kan resize det endelige billede ned hvis det er kæmpestort
        // F.eks. max 500x500
        const MAX_SIZE = 500;
        let finalCanvas = canvas;
        
        if (canvas.width > MAX_SIZE || canvas.height > MAX_SIZE) {
            finalCanvas = document.createElement('canvas');
            finalCanvas.width = MAX_SIZE;
            finalCanvas.height = MAX_SIZE;
            const finalCtx = finalCanvas.getContext('2d');
            finalCtx.drawImage(canvas, 0, 0, MAX_SIZE, MAX_SIZE);
        }

        const base64 = finalCanvas.toDataURL('image/jpeg', 0.7);
        resolve(base64);
    });
};