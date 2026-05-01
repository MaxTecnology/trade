// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDownloadURL, getStorage, ref as storageRef, uploadBytes } from "firebase/storage";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyClL6iKLuzLjju7a6TtN9XO0tUUNOSTHO0",
    authDomain: "imagehostredetrade.firebaseapp.com",
    projectId: "imagehostredetrade",
    storageBucket: "imagehostredetrade.appspot.com",
    messagingSenderId: "737297405267",
    appId: "1:737297405267:web:a7b21c986d8ea274533da6"
};

// ==========================================
// ====== Initialize Firebase
// ==========================================
export const FIREBASE_APP = initializeApp(firebaseConfig);
export const FIREBASE_AUTH = getAuth(FIREBASE_APP);

export async function uploadFile(file) {
    // Referência para o armazenamento
    const storage = getStorage();
    const storageReference = storageRef(storage, `files/${file.name}`);

    // Upload do arquivo para o armazenamento
    await uploadBytes(storageReference, file);
    const downloadURL = await getDownloadURL(storageReference);
    return downloadURL
}