# Comments4.me

## Table of Contents
- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Dependencies](#dependencies)
- [Installation](#installation)
- [Author](#author)
- [Project Structure](#project-structure)

## Overview
Comments4.me is a Gemini powered tool that automatically comments your code for you.


## Tech Stack
- **Frontend**: HTML, CSS, Js
- **Backend**: Node.js, Express.js, Multer
- **API**: Gemini API


## Dependencies
- Node.js (v16+)
- Cors (v2.8.5)
- Multer (v1.4.5-lts.2)
- Dotenv (16.4.7)
- Express (5.1.0)


## Set-Up
1. Set up environment variables:
    - Create a `.env` file in the root directory.
    - Add the following variables:
      ```
      OPENAI_API_KEY=your_openai_api_key
      PORT
      ```
2. Run the tool locally:
    - Enter the following terminal in your terminal:
      ```
      node server/server.js
      ```


## Author
- **Azmi Boucedra**  
  - GitHub: [azmibousedra](https://github.com/azmiboucedra)
  - Linkedin: [azmibousedra](https://www.linkedin.com/in/azmibousedra/)


## Project Structure
```
comments4.me/
├── server/
│   ├── server.js         # Server setup 
│   └── ai-service.js     # Gemini API integration logic
├── public/
│   ├── index.html        # Main web UI
│   ├── script.js         # Handles file upload and DOM logic
│   ├── styles.css        # App styling
│   ├── prism.js          # Syntax highlighting script
│   └── prism.css         # Syntax highlighting styles
├── .env                  # Environment variables (not included in source, must create)
├── package.json          # Project metadata and dependencies
└── README.md             # You're here
```
