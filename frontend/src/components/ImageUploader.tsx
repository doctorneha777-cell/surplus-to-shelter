import React, { useState } from 'react';

const ImageUploader: React.FC = () => {
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const acceptedFileTypes = ['image/jpeg', 'image/png', 'image/gif'];

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && acceptedFileTypes.includes(file.type)) {
            setSelectedImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        } else {
            alert('Please upload a valid image file (JPEG, PNG, GIF).');
        }
    };

    const handleUpload = async () => {
        if (!selectedImage) return;

        const formData = new FormData();
        formData.append('image', selectedImage);

        try {
            const response = await fetch('/api/analysis', {
                method: 'POST',
                body: formData,
            });
            const result = await response.json();
            console.log(result);
            // Handle the result (e.g., display analysis results)
        } catch (error) {
            console.error('Error uploading image:', error);
        }
    };

    return (
        <div className="flex flex-col items-center">
            <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="mb-4"
            />
            {imagePreview && (
                <img src={imagePreview} alt="Preview" className="mb-4 w-64 h-64 object-cover" />
            )}
            <button
                onClick={handleUpload}
                className="bg-blue-500 text-white px-4 py-2 rounded"
                disabled={!selectedImage}
            >
                Upload Image
            </button>
        </div>
    );
};

export default ImageUploader;