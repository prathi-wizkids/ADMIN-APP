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
from showTopicbySubject import show_topics_by_subject_page
from showTopicsbyLevel import show_topics_by_level_page # Import the new page

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
        
        st.markdown("---") # Separator for Topics section
        st.markdown("### Topics") # Sub-heading for topics
        if st.button("Manage All Topics"): # Existing button
            st.session_state.current_page = "Topics"
        if st.button("Show Topics by Subject"): # Existing button
            st.session_state.current_page = "Topics by Subject"
        if st.button("Show Topics by Level"): # NEW button
            st.session_state.current_page = "Topics by Level"
        
        st.markdown("---") # Separator for Users section
        st.markdown("### Users") # Sub-heading for users
        if st.button("Manage All Users"):
            st.session_state.current_page = "Users"
        if st.button("Manage Teachers"):
            st.session_state.current_page = "Teachers"
        if st.button("Manage Students"):
            st.session_state.current_page = "Students"


    # --- Main Content Area ---
    st.markdown("---") # Add a horizontal line for visual separation

    if st.session_state.current_page == "Home":
        st.header("Welcome to Admin UI!")
        st.info("Select a management section from the sidebar to get started.")
        st.image("flower.png", caption="", use_container_width=True)

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
    elif st.session_state.current_page == "Topics by Subject":
        show_topics_by_subject_page()
    elif st.session_state.current_page == "Topics by Level": # NEW page rendering
        show_topics_by_level_page()

if __name__ == "__main__":
    main()

