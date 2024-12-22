const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc } = require('firebase/firestore');
const fs = require('fs');

const firebaseConfig = {
    apiKey: "AIzaSyAzCNra5_4gdN1sy1YSSiRyVz-l7NxXBVs",
    authDomain: "prophecy-analysis.firebaseapp.com",
    projectId: "prophecy-analysis",
    storageBucket: "prophecy-analysis.firebasestorage.app",
    messagingSenderId: "636329417595",
    appId: "1:636329417595:web:aac892dac0dda7449e3bde",
    measurementId: "G-JBKC1H7FBQ"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function uploadWithRetry(propheciesRef, item, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const docRef = await addDoc(propheciesRef, {
                link: item.link,
                dateLocation: item.dateLocation,
                paragraphs: item.paragraphs,
            });
            console.log(`Document written with ID: ${docRef.id}`);
            return true; // Success
        } catch (e) {
            console.error(`Attempt ${i + 1} failed for page ${item.page}, row ${item.row}: ${e.message}`);
            if (i === retries - 1) {
                // Log failed items to a separate file
                fs.appendFileSync('failed_uploads.json', JSON.stringify(item) + '\n');
                return false;
            }
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
    }
}

async function uploadData() {
    try {
        const jsonData = JSON.parse(fs.readFileSync('scraped_data.json', 'utf8'));
        const propheciesRef = collection(db, 'prophecies');
        
        let successful = 0;
        let failed = 0;
        
        for (const item of jsonData) {
            const success = await uploadWithRetry(propheciesRef, item);
            if (success) {
                successful++;
            } else {
                failed++;
            }
            // Add a small delay between uploads
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        console.log(`Upload complete! Successfully uploaded: ${successful}, Failed: ${failed}`);
        if (failed > 0) {
            console.log('Failed items have been logged to failed_uploads.json');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

uploadData();