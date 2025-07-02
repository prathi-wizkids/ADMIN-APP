# DirectTeacher_manage.py - StreamlitAPIException Fix

import streamlit as st
import requests
import json

API_BASE_URL = "http://localhost:5002"

def direct_api_call(method, endpoint, payload=None):
    url = f"{API_BASE_URL}{endpoint}"
    headers = {"Content-Type": "application/json"}
    
    try:
        if method == 'GET':
            response = requests.get(url, headers=headers)
        elif method == 'POST':
            response = requests.post(url, headers=headers, data=json.dumps(payload))
        elif method == 'PUT':
            response = requests.put(url, headers=headers, data=json.dumps(payload))
        elif method == 'DELETE':
            response = requests.delete(url, headers=headers)
        else:
            return 400, {"message": "Unsupported HTTP method"}

        if response.status_code == 204:
            return response.status_code, {}

        try:
            data = response.json()
        except json.JSONDecodeError:
            print(f"DEBUG: JSONDecodeError for {method} {url}. Raw response content: '{response.text}'")
            return response.status_code, {"message": f"Invalid JSON response from API: {response.text}"}

        return response.status_code, data

    except requests.exceptions.ConnectionError:
        st.error(f"Failed to connect to API at {API_BASE_URL}. Please ensure the backend server is running.")
        return 503, {"message": "API service unavailable"}
    except requests.exceptions.Timeout:
        st.error("API request timed out.")
        return 408, {"message": "API request timed out"}
    except requests.exceptions.RequestException as e:
        st.error(f"An unexpected error occurred during API request: {e}")
        return 500, {"message": f"API request error: {e}"}


@st.cache_data(ttl=60)
def fetch_all_teachers_direct():
    status, data = direct_api_call('GET', '/teachers')
    if status == 200:
        return data
    st.error(f"Failed to fetch teachers directly: {data.get('message', 'Unknown error')}")
    return []

@st.cache_data(ttl=60)
def fetch_all_subjects():
    status, data = direct_api_call('GET', '/subjects')
    if status == 200:
        return data
    st.error(f"Failed to fetch subjects: {data.get('message', 'Unknown error')}")
    return []

# --- Session State Initialization for Direct Teacher Management ---
def initialize_direct_teacher_crud_states():
    # Only initialize if not already set, to preserve values across reruns
    # These are used as default values for the widgets
    if 'add_teacher_name_input' not in st.session_state:
        st.session_state.add_teacher_name_input = ""
    if 'add_teacher_email_input' not in st.session_state:
        st.session_state.add_teacher_email_input = ""
    if 'add_teacher_subjects_multiselect' not in st.session_state:
        st.session_state.add_teacher_subjects_multiselect = [] # Default to empty list for multiselect

    # For update form (these will be dynamically set when a teacher is selected)
    if 'update_teacher_name_input_val' not in st.session_state: # Use distinct key for update form's value
        st.session_state.update_teacher_name_input_val = ""
    if 'update_teacher_email_input_val' not in st.session_state: # Use distinct key for update form's value
        st.session_state.update_teacher_email_input_val = ""
    if 'update_teacher_subjects_multiselect_val' not in st.session_state: # Use distinct key for update form's value
        st.session_state.update_teacher_subjects_multiselect_val = []


def show_teacher_crud_direct():
    st.header("Manage Teachers (Direct)")
    st.info("This section allows you to manage teacher users directly via the /teachers endpoint.")

    # Initialize states at the very beginning of the function
    initialize_direct_teacher_crud_states()

    st.subheader("Add New Teacher")
    all_subjects = fetch_all_subjects()
    subject_options = {s['subname']: s['subid'] for s in all_subjects}
    subject_names = list(subject_options.keys())

    with st.form("add_teacher_direct_form", clear_on_submit=True):
        # Use a distinct key for the text input if you need to manually reset it
        # However, with clear_on_submit=True, the form itself handles the reset
        new_teacher_name = st.text_input("Teacher Name", key="add_teacher_name_input_add_form") # Changed key
        new_teacher_email = st.text_input("Teacher Email", key="add_teacher_email_input_add_form") # Changed key
        
        selected_subject_names = st.multiselect(
            "Assign Subjects (Optional)",
            subject_names,
            default=[], # Default for new form is empty, clear_on_submit handles it
            key="add_teacher_subjects_multiselect_add_form" # Changed key
        )
        subject_ids_to_assign = [subject_options[name] for name in selected_subject_names]

        submit_add_teacher = st.form_submit_button("Add Teacher")

        if submit_add_teacher:
            if not new_teacher_name or not new_teacher_email:
                st.warning("Please enter teacher name and email.")
            else:
                payload = {
                    'name': new_teacher_name,
                    'email': new_teacher_email,
                    'subjectIds': subject_ids_to_assign
                }
                status, data = direct_api_call('POST', '/teachers', payload)
                if status == 201:
                    st.success(f"Teacher '{new_teacher_name}' added successfully!")
                    st.cache_data.clear() # Clear cache for all data
                    # No need to manually reset st.session_state for add form inputs here
                    # as clear_on_submit=True handles the form's widgets, and rerun refreshes.
                    st.rerun() # Force a rerun to clear the form and refresh data
                elif status == 409:
                    st.warning(f"Failed to add teacher: Teacher with email '{new_teacher_email}' already exists.")
                else:
                    st.error(f"Failed to add teacher: {data.get('message', 'Unknown error')}")

    st.subheader("Existing Teachers")
    teachers = fetch_all_teachers_direct()
    if not teachers:
        st.info("No Teachers found. Add one above!")
    else:
        teachers_display_data = []
        for teacher in teachers:
            assigned_subjects_formatted = ", ".join([s['subname'] for s in teacher.get('assigned_subjects', [])])
            if not assigned_subjects_formatted:
                assigned_subjects_formatted = "N/A"
            teachers_display_data.append({
                'TeachID': teacher['teachid'],
                'Name': teacher['name'],
                'Email': teacher['email'],
                'Assigned Subjects': assigned_subjects_formatted,
                'Created At': teacher['created_at'].split('T')[0] if 'created_at' in teacher and teacher['created_at'] else 'N/A',
                'Last Login': teacher['last_login'].split('T')[0] if 'last_login' in teacher and teacher['last_login'] else 'N/A'
            })
        st.dataframe(teachers_display_data, use_container_width=True)

        teacher_options = {f"{t['name']} (ID: {t['teachid']})": t['teachid'] for t in teachers}
        selected_teacher_display = st.selectbox("Select Teacher for Update", ["-- Select --"] + list(teacher_options.keys()), key="select_teacher_direct_crud")

        if selected_teacher_display and selected_teacher_display != "-- Select --":
            st.session_state.selected_teacher_id = teacher_options[selected_teacher_display]
            current_teacher_data = next((t for t in teachers if t['teachid'] == st.session_state.selected_teacher_id), None)

            if current_teacher_data:
                # Set session state values for the update form based on selected teacher
                st.session_state.update_teacher_name_input_val = current_teacher_data['name']
                st.session_state.update_teacher_email_input_val = current_teacher_data['email']
                current_assigned_subject_ids = [s['subid'] for s in current_teacher_data.get('assigned_subjects', [])]
                st.session_state.update_teacher_subjects_multiselect_val = [name for name, id in subject_options.items() if id in current_assigned_subject_ids]

                st.markdown("---")
                st.subheader(f"Update Teacher: {selected_teacher_display}")
                with st.form(f"update_teacher_direct_form_{st.session_state.selected_teacher_id}", clear_on_submit=True):
                    # Use session state as value for update form inputs
                    updated_name = st.text_input("New Teacher Name", value=st.session_state.update_teacher_name_input_val, key=f"update_teacher_name_{st.session_state.selected_teacher_id}")
                    updated_email = st.text_input("New Teacher Email", value=st.session_state.update_teacher_email_input_val, key=f"update_teacher_email_{st.session_state.selected_teacher_id}")
                    
                    updated_selected_subject_names = st.multiselect(
                        "Update Assigned Subjects (Optional)",
                        subject_names,
                        default=st.session_state.update_teacher_subjects_multiselect_val,
                        key=f"update_teacher_subjects_multiselect_{st.session_state.selected_teacher_id}"
                    )
                    updated_subject_ids = [subject_options[name] for name in updated_selected_subject_names]

                    submit_update_teacher = st.form_submit_button("Update Teacher")
                    if submit_update_teacher:
                        if not updated_name or not updated_email:
                            st.warning("Please enter teacher name and email.")
                        else:
                            update_payload = {
                                'name': updated_name,
                                'email': updated_email,
                                'subjectIds': updated_subject_ids
                            }
                            status, data = direct_api_call('PUT', f'/teachers/{st.session_state.selected_teacher_id}', update_payload)
                            if status == 200:
                                st.success(f"Teacher '{updated_name}' updated successfully!")
                                st.cache_data.clear()
                                # No need to manually reset session state here, rerun will re-evaluate
                                st.rerun()
                            elif status == 409:
                                st.warning(f"Failed to update teacher: Teacher with email '{updated_email}' already exists.")
                            else:
                                st.error(f"Failed to update teacher: {data.get('message', 'Unknown error')}")
