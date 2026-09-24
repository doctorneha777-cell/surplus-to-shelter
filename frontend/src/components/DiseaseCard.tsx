import React from 'react';
import { Disease } from '../types';

interface DiseaseCardProps {
    disease: Disease;
}

const DiseaseCard: React.FC<DiseaseCardProps> = ({ disease }) => {
    return (
        <div className="max-w-sm rounded overflow-hidden shadow-lg p-4 bg-white">
            <h2 className="font-bold text-xl mb-2">{disease.name}</h2>
            <div className="mb-4">
                <h3 className="font-semibold">Symptoms:</h3>
                <ul className="list-disc list-inside">
                    {disease.symptoms.map((symptom, index) => (
                        <li key={index}>{symptom}</li>
                    ))}
                </ul>
            </div>
            <div className="mb-4">
                <h3 className="font-semibold">Causes:</h3>
                <ul className="list-disc list-inside">
                    {disease.causes.map((cause, index) => (
                        <li key={index}>{cause}</li>
                    ))}
                </ul>
            </div>
            <div>
                <h3 className="font-semibold">Prevention:</h3>
                <ul className="list-disc list-inside">
                    {disease.preventionTips.map((tip, index) => (
                        <li key={index}>{tip}</li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default DiseaseCard;