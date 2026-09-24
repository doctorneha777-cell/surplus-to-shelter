import React from 'react';

interface AnalysisResultProps {
    cropName: string;
    healthStatus: string;
    likelyDisease: string;
    confidencePercentage: number;
    severity: string;
    symptoms: string[];
    recommendations: string[];
}

const AnalysisResult: React.FC<AnalysisResultProps> = ({
    cropName,
    healthStatus,
    likelyDisease,
    confidencePercentage,
    severity,
    symptoms,
    recommendations,
}) => {
    return (
        <div className="p-4 border rounded-lg shadow-md bg-white">
            <h2 className="text-xl font-bold mb-2">Analysis Result</h2>
            <p className="mb-1"><strong>Crop Name:</strong> {cropName}</p>
            <p className="mb-1"><strong>Health Status:</strong> {healthStatus}</p>
            <p className="mb-1"><strong>Likely Disease:</strong> {likelyDisease}</p>
            <p className="mb-1"><strong>Confidence Percentage:</strong> {confidencePercentage}%</p>
            <p className="mb-1"><strong>Severity:</strong> {severity}</p>
            <div className="mb-2">
                <strong>Symptoms:</strong>
                <ul className="list-disc list-inside">
                    {symptoms.map((symptom, index) => (
                        <li key={index}>{symptom}</li>
                    ))}
                </ul>
            </div>
            <div>
                <strong>Recommendations:</strong>
                <ul className="list-disc list-inside">
                    {recommendations.map((recommendation, index) => (
                        <li key={index}>{recommendation}</li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default AnalysisResult;