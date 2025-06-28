# ADMIN-APP
#environment variables 

PORT=5002
DB_USER=your_postgres_username
DB_HOST=localhost
DB_DATABASE=your_database_name # e.g., gurukul_db
DB_PASSWORD=your_postgres_password
DB_PORT=5432 # Default PostgreSQL port

--------------------------------------------
cd GurukulAdminAPI
# Install production dependencies
npm install express pg bcryptjs cors

# Install development dependencies
npm install --save-dev typescript ts-node @types/express @types/pg @types/bcryptjs @types/cors nodemon


npm run build
npm start


--------------------
cd adminGUI
pip install streamlit requests pandas
pip install regex
streamlit run main.py

if streamlit looks too dark, try different browser, or change settings.
if needed, click on top right corner change settings to light mode.

