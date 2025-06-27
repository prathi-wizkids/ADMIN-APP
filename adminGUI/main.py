# main.py
import streamlit as st
from gurukul_manage import gurukul_manage_page
from offerings_manage import offerings_manage_page
from milestones_manage import milestones_manage_page
from subjects_manage import subjects_manage_page
from topics_manage import topics_manage_page
from users_manage import users_manage_page
from u_teachers_manage import u_teachers_manage_page
from u_students_manage import u_students_manage_page

# --- Main Application ---
def main():
    st.set_page_config(layout="wide", page_title="Gurukul Admin UI")

    # Initialize session state for page navigation if not already set
    if 'current_page' not in st.session_state:
        st.session_state.current_page = "Home"

    # --- Sidebar Navigation ---
    with st.sidebar:
        st.title("Admin UI Navigation")
        st.markdown("---")

        # Buttons for different management sections
        if st.button("Manage Gurukuls"):
            st.session_state.current_page = "Gurukuls"
        if st.button("Manage Gurukul Offerings"):
             st.session_state.current_page = "Offerings"
        if st.button("Manage Milestones"):
            st.session_state.current_page = "Milestones"
        if st.button("Manage Subjects"):
            st.session_state.current_page = "Subjects"
        if st.button("Manage Topics"):
             st.session_state.current_page = "Topics"
        st.markdown("---")
        if st.button("Manage All Users"):
            st.session_state.current_page = "Users"
        if st.button("Manage Teachers"):
            st.session_state.current_page = "Teachers"
        if st.button("Manage Students"):
            st.session_state.current_page = "Students"

    # --- Main Content Area ---
    st.markdown("---") # Add a horizontal line for visual separation

    if st.session_state.current_page == "Home":
        st.header("Welcome to the Gurukul Admin UI!")
        st.info("Select a management section from the sidebar to get started.")
    elif st.session_state.current_page == "Gurukuls":
        gurukul_manage_page()
    elif st.session_state.current_page == "Offerings":
        offerings_manage_page()
    elif st.session_state.current_page == "Milestones":
        milestones_manage_page()
    elif st.session_state.current_page == "Subjects":
        subjects_manage_page()
    elif st.session_state.current_page == "Topics":
        topics_manage_page()
    elif st.session_state.current_page == "Users":
        users_manage_page()
    elif st.session_state.current_page == "Teachers":
        u_teachers_manage_page()
    elif st.session_state.current_page == "Students":
        u_students_manage_page()

if __name__ == "__main__":
    main()