import React, { useEffect, useState } from 'react';
import { Disease } from '../types';
import { fetchDiseases } from '../services/api';
import DiseaseCard from '../components/DiseaseCard';

const DiseaseDatabase: React.FC = () => {
    const [diseases, setDiseases] = useState<Disease[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const getDiseases = async () => {
            try {
                const data = await fetchDiseases();
                setDiseases(data);
            } catch (err) {
                setError('Failed to fetch diseases');
            } finally {
                setLoading(false);
            }
        };

        getDiseases();
    }, []);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Disease Database</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {diseases.map((disease) => (
                    <DiseaseCard key={disease.id} disease={disease} />
                ))}
            </div>
        </div>
    );
};

export default DiseaseDatabase;