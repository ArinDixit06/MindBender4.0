# MindBender 4.0

 MindBender 4.0 is a comprehensive web-based educational platform designed to revolutionize the learning experience through AI-driven insights, interactive tools, and streamlined management for schools, teachers, and students.

## 🚀 Features

### For Students
- **Dashboard**: a personalized view of progress, tasks, and notifications.
- **AI Knowledge Map**: Visual learning pathways powered by Google Gemini AI to master complex subjects.
- **Real-Time Chat**: Collaborate with peers and teachers or get instant AI assistance.
- **Note Making**: Integrated tools for organizing study notes.
- **Resources**: Access to study materials and curriculum content.
- **Quests & XP**: Gamified learning with quests, XP rewards, and leveling up.

### For Teachers
- **Curriculum Management**: Tools to design and update curriculum structures.
- **Quest Creation**: Create and assign educational quests to students.
- **Progress Tracking**: Monitor student engagement and performance.
- **Resources**: Upload and manage educational resources.

### For Administrators
- **School Management**: Register and manage school domains and settings.
- **User Management**: Oversee student and teacher accounts.
- **System Settings**: Configure global platform settings.

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js, Express.js
- **Database**: Supabase (PostgreSQL)
- **AI Engine**: Google Generative AI (Gemini Pro & Flash Models)
- **Authentication**: Custom Authentication (Bcrypt + Sessions) & Supabase Auth

## 🔧 Installation & Setup

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/ArinDixit06/MindBender4.0.git
    cd MindBender4.0
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Environment Configuration**
    Create a `.env` file in the root directory and add the following variables:
    ```env
    PORT=3000
    SESSION_SECRET=your_super_secret_session_key
    GEMINI_API_KEY=your_google_gemini_api_key
    SUPABASE_URL=your_supabase_project_url
    SUPABASE_KEY=your_supabase_anon_key
    ```

4.  **Database Setup**
    - Connect to your Supabase project.
    - Run the SQL scripts provided in `init.sql` to set up the necessary tables and schemas.

5.  **Run the Application**
    ```bash
    npm start
    ```
    The server will start on `http://localhost:3000`.

## 🤝 Contributors

We would like to thank the following contributors for their hard work and dedication to this project:

- **Arin Dixit** (ArinDixit06)
- **Bhavya Agarwal**
- **sinhakrish3-coder**

## 📝 License

This project is licensed under the ISC License.
