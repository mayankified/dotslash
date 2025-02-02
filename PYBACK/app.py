import os
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, File, UploadFile, Depends
from pydantic import BaseModel
from PIL import Image
import pytesseract
from langchain_openai import ChatOpenAI
from langchain.memory import ConversationBufferMemory
from langchain.chains import ConversationChain
from fastapi.middleware.cors import CORSMiddleware
import json
import io
import requests
from bs4 import BeautifulSoup
# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(title="Doctor-Patient Chat API", version="1.0")
# Enable CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "*"
    ],  # Change this to your frontend URL for security (e.g., ["http://localhost:3000"])
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods (POST, GET, etc.)
    allow_headers=["*"],  # Allow all headers
)
# Initialize ChatOpenAI with Groq API
llm = ChatOpenAI(
    base_url="https://api.groq.com/openai/v1",
    api_key=os.getenv("GROQ_API_KEY"),
    model="llama-3.3-70b-versatile",
)

# Memory storage for chat history (can be expanded with a database)
session_memory = {}


# Define request schema
class ChatRequest(BaseModel):
    session_id: str
    patient_message: str


@app.post("/chat")
async def chat_with_doctor(request: ChatRequest):
    session_id = request.session_id
    patient_message = request.patient_message

    # Initialize memory if session doesn't exist
    if session_id not in session_memory:
        session_memory[session_id] = ConversationBufferMemory()

    memory = session_memory[session_id]

    # Create conversation chain
    conversation = ConversationChain(llm=llm, memory=memory)

    # Construct doctor role
    doctor_prompt = (
        "You are a professional and empathetic doctor. "
        "Engage in a friendly and informative conversation with the patient. "
        "Provide medical advice in a responsible manner while ensuring..keep the message  consise and friendly..don't give long replies "
        "the conversation is clear and easy to understand...After every piece of medical advice, include a short disclaimer reminding the patient that this advice may not be entirely accurate, and they should consult a qualified medical professional\n\n"
        
        f"Patient: {patient_message}"
    )

    try:
        # Generate response
        response = conversation.invoke(input=doctor_prompt)
        doctor_response = response.get(
            "response", "I'm here to help! How can I assist you?"
        )

        return {
            "session_id": session_id,
            "patient_message": patient_message,
            "doctor_response": doctor_response,
            "chat_history": memory.buffer,  # Returns chat history
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class DiseaseDetectionRequest(BaseModel):
    main_symptom: str
    duration: str
    severity: str
    additional_symptoms: str


@app.post("/disease-detection")
async def detect_disease(request: DiseaseDetectionRequest):
    try:
        detection_prompt = (
            "You are a professional AI-powered medical assistant. "
            "Based on the symptoms provided, suggest possible conditions and their urgency. "
            "Also, recommend relevant doctors for consultation. "
            "Provide responses in a structured JSON format ONLY, without any extra text.\n\n"
            "**Examples of the expected format:**\n"
            "JSON:\n```json\n"
            "{\n"
            '  "possible_conditions": [\n'
            '    {"name": "Upper Respiratory Infection", "probability": "High", "urgency": "Moderate"},\n'
            '    {"name": "Seasonal Allergies", "probability": "Medium", "urgency": "Low"}\n'
            "  ],\n"
            '  "recommended_doctors": [\n'
            '    {"name": "Dr. Amit Patel", "specialty": "General Medicine", "availability": "Today, 4:00 PM", "fee": "₹500"},\n'
            '    {"name": "Dr. Priya Shah", "specialty": "Pulmonologist", "availability": "Tomorrow, 10:00 AM", "fee": "₹700"}\n'
            "  ]\n"
            "}\n"
            "```\n\n"
            "Now, based on the following symptoms, generate a structured JSON response:\n\n"
            f"Main Symptom: {request.main_symptom}\n"
            f"Duration: {request.duration}\n"
            f"Severity: {request.severity}\n"
            f"Additional Symptoms: {request.additional_symptoms}\n"
        )

        response = llm.invoke(detection_prompt)

        # Ensure response is properly structured
        if hasattr(response, "content"):
            response_content = response.content.strip()
        else:
            response_content = str(response).strip()

        # print("Raw LLM Response:", response_content)  # Debugging log

        # Find the first `{` and last `}` to extract clean JSON
        start_index = response_content.find("{")
        end_index = response_content.rfind("}")

        if start_index == -1 or end_index == -1:
            raise HTTPException(
                status_code=500, detail="AI response does not contain valid JSON."
            )

        clean_json = response_content[start_index : end_index + 1]

        # Parse JSON safely
        try:
            parsed_response = json.loads(clean_json)
        except json.JSONDecodeError:
            raise HTTPException(
                status_code=500, detail="AI response is not valid JSON."
            )

        return {
            "possible_conditions": parsed_response.get("possible_conditions", []),
            "recommended_doctors": parsed_response.get("recommended_doctors", []),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class DietPlanRequest(BaseModel):
    disease_name: str
    condition: str
    special_instructions: str

@app.post("/diet-plan")
async def generate_diet_plan(request: DietPlanRequest):
    """
    Generates a diet plan based on the user's disease, condition, and any special
    instructions such as foods they avoid. 
    """

    diet_prompt = (
        "You are a professional nutritionist. "
        "Consider the patient's condition, disease, and special instructions. "
        "Create a concise 7-day diet plan that is practical, balanced, and mindful of the patient's needs. "
        "Each day's plan should briefly include breakfast, lunch, and dinner ideas. "
        "Recommend healthy and nutritious INDIAN foods that can help improve the patient's condition.INDIAN IS IMPORTANT "
        "Avoid any items the patient has restrictions on, and address their specific condition requirements. "
        "End with a short disclaimer that this plan is not a substitute for professional medical advice.\n\n"
        f"Disease: {request.disease_name}\n"
        f"Condition/Details: {request.condition}\n"
        f"Special Instructions (e.g., foods to avoid): {request.special_instructions}\n\n"
        "Now please provide the 7-day diet plan."
    )

    try:
        response = llm.invoke(diet_prompt)

        # If the response is from a chat model, you'll likely have `response.content`.
        if hasattr(response, "content"):
            response_content = response.content.strip()
        else:
            response_content = str(response).strip()

        # Simply return the text as the diet plan. 
        return {
            "disease_name": request.disease_name,
            "condition": request.condition,
            "special_instructions": request.special_instructions,
            "diet_plan": response_content,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
# Run with: uvicorn app:app --reload

# Define OCR request handler
@app.post("/analyze-report")
async def analyze_medical_report(file: UploadFile = File(...)):
    try:
        # Load image
        image = Image.open(io.BytesIO(await file.read()))
        
        # Perform OCR
        extracted_text = pytesseract.image_to_string(image)
        
        if not extracted_text.strip():
            raise HTTPException(status_code=400, detail="No readable text found in the image.")
        
        # Generate medical insights
        medical_insights_prompt = (
            "You are an AI medical assistant. Based on the extracted text from a medical report, "
            "identify key medical terms, possible diagnoses, and their implications. "
            "Provide insights in structured JSON format with 'key_terms', 'possible_conditions', and 'advice'.\n\n"
            f"Extracted Text: {extracted_text}\n"
        )
        
        response = llm.invoke(medical_insights_prompt)
        
        # Process response
        if hasattr(response, "content"):
            response_content = response.content.strip()
        else:
            response_content = str(response).strip()
        
        # Extract JSON from response
        start_index = response_content.find("{")
        end_index = response_content.rfind("}")

        if start_index == -1 or end_index == -1:
            raise HTTPException(status_code=500, detail="AI response does not contain valid JSON.")

        clean_json = response_content[start_index:end_index + 1]

        try:
            parsed_response = json.loads(clean_json)
        except json.JSONDecodeError:
            raise HTTPException(status_code=500, detail="AI response is not valid JSON.")
        
        return {
            "extracted_text": extracted_text,
            "medical_insights": parsed_response
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    # Temporary storage for scraped data
scraped_data = []

# Function to scrape data
def scrape_myths():
    global scraped_data
    url = 'https://www.medicalnewstoday.com/'
    response = requests.get(url)
    soup = BeautifulSoup(response.content, 'html.parser')
    
    myth_links = soup.find_all('a', class_='css-xqmvw1 css-i4o77u')
    
    scraped_data = []  # Clear old data
    for myth in myth_links:
        text = myth.get_text(strip=True)
        link = myth.get('href')
        scraped_data.append({"text": text, "link": link})

# Route to scrape and store data
@app.get("/scrape")
def scrape():
    scrape_myths()  
    return {"myths": scraped_data}

from fastapi import FastAPI
import joblib
import pandas as pd
from pydantic import BaseModel

# Load the trained model and label encoders
model = joblib.load("health_scheme_recommender.pkl")
label_encoders = joblib.load("label_encoders.pkl")

# Initialize FastAPI app

# Define input schema
class HealthSchemeInput(BaseModel):
    age: int
    income: int
    employment_type: str
    bank_account: str
    socio_status: str
    family_size: int

# Define API endpoint
@app.post("/recommend")
def recommend_scheme(data: HealthSchemeInput):
    # Convert input to DataFrame
    input_data = pd.DataFrame([[
        data.age, data.income, data.employment_type,
        data.bank_account, data.socio_status, data.family_size
    ]], columns=["Age", "Income", "Employment Type", "Bank Account", "Socio-Economic Status", "Family Size"])
    
    # Encode categorical features
    input_data["Employment Type"] = label_encoders["Employment Type"].transform([data.employment_type])[0]
    input_data["Bank Account"] = label_encoders["Bank Account"].transform([data.bank_account])[0]
    input_data["Socio-Economic Status"] = label_encoders["Socio-Economic Status"].transform([data.socio_status])[0]
    
    # Predict scheme
    scheme_index = model.predict(input_data)[0]
    scheme = label_encoders["Recommended Scheme"].inverse_transform([scheme_index])[0]
    
    return {"Recommended Scheme": scheme}

# Run API using: uvicorn filename:app --reload