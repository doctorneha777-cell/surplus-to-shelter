import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api'; // Adjust the base URL as needed

export const uploadImage = async (formData: FormData) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/analysis`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown upload error';
        throw new Error('Error uploading image: ' + message);
    }
};

export const fetchDiseases = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/diseases`);
        return response.data;
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown disease fetch error';
        throw new Error('Error fetching diseases: ' + message);
    }
};