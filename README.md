
# 🍱 Surplus-to-Shelter

### AI-Powered Food Rescue & Smart Donation Coordination Platform

**Surplus-to-Shelter** is a smart food rescue platform that connects **restaurants and food donors with shelters/NGOs through intelligent matching and delivery coordination**.

The goal is simple: **rescue usable surplus food before it becomes waste and deliver it to organizations that need it.**

---

## 🚨 Problem

Restaurants, cafeterias, events, and other food businesses often have surplus food that is still usable but has a limited time window.

The challenge is not only finding someone who needs the food, but finding the **right recipient at the right time** and coordinating a driver before the food becomes unusable.

Traditional donation systems often lack:

* ⏱️ Time-sensitive matching
* 📍 Location-based coordination
* 🍱 Food and dietary compatibility
* 📦 Recipient capacity checking
* 🚗 Driver assignment
* 📊 Delivery tracking
* 📈 Impact tracking

---

## 💡 Our Solution

Surplus-to-Shelter combines these requirements into one platform.

### The basic workflow:

```text
🍴 Food Donor
      ↓
📦 Surplus Food Posted
      ↓
🧠 Smart Matching Engine
      ↓
🏠 Suitable Shelter / NGO
      ↓
🚗 Driver Assignment
      ↓
📍 Pickup & Delivery
      ↓
✅ Completed Rescue
      ↓
📊 Impact Tracking
```

---

## 🧠 Intelligent Matching

The core of the platform is an **explainable matching engine**.

Instead of simply selecting the nearest shelter, the system first removes candidates that fail important constraints.

### Step 1 — Hard Constraints

Candidates can be rejected when:

* Food has expired
* Recipient is unavailable
* Recipient has insufficient capacity
* Dietary requirements are incompatible
* Delivery cannot happen within the usable food window
* Other required conditions are not satisfied

### Step 2 — Candidate Ranking

Eligible candidates are then ranked using factors such as:

* ⏱️ Remaining usable time
* 📍 Distance
* 📦 Quantity fit
* 🚨 Recipient urgency
* 🍱 Food compatibility
* 🥗 Dietary compatibility
* 🤖 Semantic similarity

This makes the matching process **data-driven and explainable**.

---

## 🤖 AI / Machine Learning

The project can use **Sentence Transformers** for semantic matching.

Model:

```text
sentence-transformers/all-MiniLM-L6-v2
```

For example:

**Donation:**

> "40 vegetarian rice meals available."

**Shelter need:**

> "Ready-to-eat vegetarian meals required for residents."

Even though the wording is different, semantic embeddings can identify that the two descriptions are related.

### Important Design Principle

AI is **not responsible for making food-safety decisions**.

Safety and feasibility constraints are handled through explicit rules. AI-based semantic similarity is used as **one ranking signal**.

---

## 🚗 Smart Driver Assignment

After finding a suitable recipient, the system can identify an appropriate driver based on:

* Driver availability
* Vehicle capacity
* Distance
* Estimated travel time
* Remaining food usability window

The intended route is:

```text
🚗 Driver
   ↓
🍴 Donor / Restaurant
   ↓
🏠 Shelter / NGO
```

---

## 🔄 Rescue Lifecycle

Each donation can move through a traceable lifecycle:

```text
POSTED
   ↓
MATCHED
   ↓
DRIVER_ASSIGNED
   ↓
DRIVER_EN_ROUTE
   ↓
PICKUP_READY
   ↓
PICKED_UP
   ↓
DELIVERING
   ↓
DELIVERED
   ↓
COMPLETED
```

This allows the system to maintain an auditable record of the rescue process.

---

## 🗺️ Route & Location Support

The platform is designed to use map-based visualization for:

* Donor location
* Shelter location
* Driver location
* Route visualization
* Distance and ETA estimation

The project uses **Leaflet and OpenStreetMap** for map visualization.

---

## 📊 Impact Tracking

The platform can track metrics such as:

* 🍱 Meals rescued
* ♻️ Food waste prevented
* 🏠 Recipients served
* 🚗 Deliveries completed
* ⏱️ Average rescue time
* 📍 Delivery activity

This helps demonstrate the real-world impact of food rescue operations.

---

## 🛠️ Technology Stack

### Frontend

* React
* TypeScript
* React Router
* TanStack Query
* Recharts
* Leaflet
* OpenStreetMap
* Lucide Icons

### Backend

* FastAPI
* Python
* SQLAlchemy
* Pydantic
* JWT Authentication

### Database

* SQLite for local development / MVP
* PostgreSQL-compatible architecture

### AI / ML

* Sentence Transformers
* `all-MiniLM-L6-v2`

---

## 🏗️ System Architecture

```text
                 ┌──────────────────┐
                 │   React Frontend │
                 └────────┬─────────┘
                          │
                          ▼
                 ┌──────────────────┐
                 │   FastAPI API    │
                 └────────┬─────────┘
                          │
              ┌───────────┼───────────┐
              ▼           ▼           ▼
        ┌──────────┐ ┌──────────┐ ┌─────────────┐
        │ Database │ │ Matching │ │ Route / Map │
        │          │ │  Engine  │ │   Service   │
        └──────────┘ └────┬─────┘ └─────────────┘
                           │
                           ▼
                    ┌────────────┐
                    │ AI Semantic│
                    │  Matching  │
                    └────────────┘
```

---

## 👥 Main Users

### 🍴 Donors

Can:

* Post surplus food
* Specify quantity and food type
* Provide usable-until time
* Provide dietary/allergen information
* Track donation status

### 🏠 Shelters / NGOs

Can:

* Register their needs
* Specify capacity
* Specify dietary requirements
* Receive suitable donations

### 🚗 Drivers

Can:

* View assigned pickups
* Navigate to donors
* Update pickup status
* Deliver food to recipients

### 🧑‍💼 Operations / Admin

Can:

* Monitor donations
* Review matches
* Track deliveries
* Monitor exceptions
* View impact metrics

---

## 🔐 Food Safety

The platform does **not claim to independently verify food safety**.

It relies on donor-provided information such as:

* Preparation time
* Usable-until time
* Storage conditions
* Food type
* Allergen information

The system can flag situations such as:

```text
SAFE_WINDOW_VALID
EXPIRY_WARNING
EXPIRY_RISK
EXPIRED
MISSING_SAFETY_INFORMATION
```

---

## 🎯 Hackathon MVP

The MVP focuses on demonstrating the complete rescue workflow:

1. Create a surplus food donation
2. Find eligible shelters
3. Apply hard constraints
4. Rank suitable recipients
5. Explain the recommendation
6. Assign a driver
7. Simulate pickup and delivery
8. Track the complete rescue lifecycle
9. Display impact metrics

---

## 🚀 Future Scope

Future versions could include:

* Real-time GPS tracking
* Live traffic-based routing
* SMS / WhatsApp notifications
* More advanced demand forecasting
* Automated donor-recipient coordination
* Larger NGO and restaurant networks
* Cloud deployment
* Real-world food safety verification workflows
* Predictive surplus generation

---

## 🌍 Vision

> **Turn surplus food into timely support instead of waste.**

Surplus-to-Shelter aims to create a coordinated system where **every usable surplus donation has a better chance of reaching someone who needs it before its usable window ends.**

---

## 👩‍💻 Built For

**Hackathon Project — Surplus-to-Shelter**

Built with ❤️ using React, FastAPI, AI/ML, and modern web technologies.
