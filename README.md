# Flashcards App (Django + React)

A full-stack flashcard web application built with **Django REST Framework** and **React**.  
The app allows users to create image-based flashcards, organize them with tags, and review cards by tag.

---

## Features
- Create flashcards with:
  - Front and back images
  - Optional text
- Tag-based organization
- Review mode with card flipping
- Delete cards and tags
- REST API built with Django REST Framework
- React frontend using Vite

---

## Tech Stack
**Backend**
- Django
- Django REST Framework
- SQLite (MVP)
- Pillow (image handling)

**Frontend**
- React
- Vite
- Fetch API

---

## Getting Started

### Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at:
```
http://localhost:5173
```
The backend API runs at:
```
http://127.0.0.1:8000/api/
```

