# AI Crop Disease Scanner Backend

## Overview
The AI Crop Disease Scanner is a web application designed to help farmers and agricultural professionals identify crop diseases using AI technology. The backend is built with FastAPI and connects to a PostgreSQL database to manage disease data and analysis results.

## Features
- **Image Analysis**: Upload images of crops for AI analysis to detect diseases.
- **Disease Database**: Access a comprehensive database of crop diseases, including symptoms, causes, and prevention tips.
- **API Endpoints**: Provides RESTful API endpoints for image analysis and disease information retrieval.

## Setup Instructions

### Prerequisites
- Python 3.8 or higher
- PostgreSQL
- pip

### Installation
1. Clone the repository:
   ```
   git clone <repository-url>
   cd ai-crop-disease-scanner/backend
   ```

2. Create a virtual environment:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows use `venv\Scripts\activate`
   ```

3. Install the required packages:
   ```
   pip install -r requirements.txt
   ```

4. Set up the PostgreSQL database:
   - Create a new database and user in PostgreSQL.
   - Update the `.env` file with your database credentials.

5. Run database migrations:
   ```
   alembic upgrade head
   ```

### Running the Application
To start the FastAPI application, run:
```
uvicorn app.main:app --reload
```
The application will be available at `http://127.0.0.1:8000`.

### API Documentation
The API documentation can be accessed at `http://127.0.0.1:8000/docs`.

## Directory Structure
- `app/`: Contains the main application code.
  - `api/`: API endpoints for analysis and disease data.
  - `models/`: Data models for analysis results and diseases.
  - `schemas/`: Pydantic schemas for data validation.
  - `services/`: Business logic for AI analysis and disease data handling.
  - `database.py`: Database connection and migration management.
  - `main.py`: Entry point for the FastAPI application.

## License
This project is licensed under the MIT License. See the LICENSE file for more details.