# AI Crop Disease Scanner

## Overview
The AI Crop Disease Scanner is a modern web application designed to help farmers and agricultural professionals identify crop diseases using AI technology. The application allows users to upload images of their crops, analyze them for potential diseases, and access a comprehensive disease database.

## Features
- **Image Upload**: Users can upload images from their devices or use their camera to capture images of crops.
- **AI Analysis**: The application utilizes AI to analyze uploaded images and provide results regarding crop health and potential diseases.
- **Results Display**: Users receive detailed analysis results, including crop name, health status, likely disease, confidence percentage, severity, symptoms, and recommendations.
- **Disease Database**: A structured database of various crop diseases is available for users to browse, providing information on symptoms, causes, and prevention tips.

## Tech Stack
- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: FastAPI
- **Database**: PostgreSQL

## Project Structure
```
ai-crop-disease-scanner
├── frontend
│   ├── src
│   │   ├── components
│   │   ├── pages
│   │   ├── services
│   │   ├── types
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── package.json
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── vite.config.ts
├── backend
│   ├── app
│   │   ├── api
│   │   ├── models
│   │   ├── schemas
│   │   ├── services
│   │   ├── database.py
│   │   └── main.py
│   ├── requirements.txt
│   └── README.md
├── database
│   └── migrations
├── .env.example
├── docker-compose.yml
└── README.md
```

## Setup Instructions

### Frontend
1. Navigate to the `frontend` directory.
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   npm run dev
   ```

### Backend
1. Navigate to the `backend` directory.
2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```
3. Run the FastAPI application:
   ```
   uvicorn app.main:app --reload
   ```

### Database
1. Ensure PostgreSQL is installed and running.
2. Configure the database connection in the `.env` file.
3. Run migrations to set up the database schema.

## Usage
- Access the frontend application in your web browser at `http://localhost:3000`.
- Use the image upload feature to analyze crops and explore the disease database for more information.

## Contributing
Contributions are welcome! Please submit a pull request or open an issue for any enhancements or bug fixes.

## License
This project is licensed under the MIT License. See the LICENSE file for details.