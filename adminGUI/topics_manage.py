# topics_manage.py
import streamlit as st
import requests
import pandas as pd

# --- Configuration ---
API_BASE_URL = "http://localhost:5002" # Your Node.js API URL

# --- API Interaction Functions for Topics ---

def get_all_topics():
    """Fetches all topics from the backend API."""
    try:
        response = requests.get(f"{API_BASE_URL}/topics")
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        st.error(f"Error fetching topics: {e}")
        return []

def create_topic(tname, subid, image_url):
    """Creates a new topic."""
    try:
        payload = {"tname": tname, "subid": subid}
        if image_url:
            payload["image_url"] = image_url
        response = requests.post(f"{API_BASE_URL}/topics", json=payload)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        st.error(f"Error creating topic: {e}")
        return None

def update_topic(tid, tname=None, subid=None, image_url=None):
    """Updates an existing topic."""
    payload = {}
    if tname is not None:
        payload["tname"] = tname
    if subid is not None:
        payload["subid"] = subid
    if image_url is not None: # Allow updating to empty string
        payload["image_url"] = image_url
    
    try:
        response = requests.put(f"{API_BASE_URL}/topics/{tid}", json=payload)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        st.error(f"Error updating topic: {e}")
        return None

def delete_topic(tid):
    """Deletes a topic."""
    try:
        response = requests.delete(f"{API_BASE_URL}/topics/{tid}")
        response.raise_for_status()
        return response.status_code == 200
    except requests.exceptions.RequestException as e:
        st.error(f"Error deleting topic: {e}")
        return False

# --- API Interaction Functions for Subjects (re-used) ---

def get_all_subjects_for_dropdown():
    """Fetches all subjects (subid, subname) for use in dropdowns."""
    try:
        response = requests.get(f"{API_BASE_URL}/subjects")
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        st.error(f"Error fetching subjects for dropdown: {e}")
        return []

# --- Streamlit UI for Topic Management ---

def topics_manage_page():
    """Renders the UI for managing Topics."""
    st.header("Manage Topics")
    st.write("Here you can create, view, update, and delete Topics.")

    # Fetch all necessary data
    all_topics = get_all_topics()
    all_subjects = get_all_subjects_for_dropdown()

    # Create maps for easy lookup
    subject_id_to_name_map = {s['subid']: s['subname'] for s in all_subjects}
    
    # Group existing topics by subject ID
    topic_subid_map = {}
    for t in all_topics:
        subid = t['subid']
        tname = t['tname']
        if subid not in topic_subid_map:
            topic_subid_map[subid] = set()
        topic_subid_map[subid].add(tname)

    # --- Create New Topic Section ---
    st.subheader("Create New Topic")
    if not all_subjects:
        st.info("No Subjects available. Please create Subjects first.")
        st.markdown("---")
        return # Exit function if no subjects

    # Select Subject for Creation
    subject_display_options_create = [f"{s['subname']} (ID: {s['subid']})" for s in all_subjects]
    selected_subject_create_display = st.selectbox(
        "Select Parent Subject for new Topic",
        options=subject_display_options_create,
        key="create_topic_subject_select"
    )
    selected_subject_create_id = int(selected_subject_create_display.split("(ID: ")[1][:-1]) if selected_subject_create_display else None

    with st.form("create_topic_form"):
        new_tname = st.text_input("Topic Name", key="new_topic_name_input")
        new_image_url = st.text_input("Image URL (optional)", key="new_topic_image_url_input")

        create_submitted = st.form_submit_button("Create Topic")

        if create_submitted:
            if new_tname and selected_subject_create_id is not None:
                # Check for duplicate topic name within the selected subject
                existing_topics_for_subject = topic_subid_map.get(selected_subject_create_id, set())
                if new_tname in existing_topics_for_subject:
                    st.warning(f"Topic '{new_tname}' already exists for this subject. Please choose a different name.")
                else:
                    with st.spinner("Creating topic..."):
                        result = create_topic(new_tname, selected_subject_create_id, new_image_url)
                        if result:
                            st.success(f"Topic '{result['tname']}' (ID: {result['tid']}) created successfully for Subject ID {result['subid']}!")
                            st.rerun()
                        else:
                            st.error("Failed to create topic. Please check API logs.")
            else:
                st.warning("Please enter Topic Name and select a Parent Subject.")
    
    st.markdown("---") # Separator

    # --- List Existing Topics Section ---
    st.subheader("Existing Topics")
    if all_topics:
        # Enhance with Subject names for better display
        displayed_topics = []
        for t in all_topics:
            subject_name = subject_id_to_name_map.get(t['subid'], "N/A Subject")
            displayed_topics.append({
                "tid": t['tid'],
                "tname": t['tname'],
                "subid": t['subid'],
                "subject_name": subject_name,
                "image_url": t.get('image_url', '') # Use .get for robustness
            })
        
        df_topics = pd.DataFrame(displayed_topics)
        df_topics = df_topics[['tid', 'tname', 'subject_name', 'subid', 'image_url']]
        st.dataframe(df_topics, use_container_width=True)
    else:
        st.info("No topics found yet.")

    st.markdown("---") # Separator

    # --- Update Existing Topic Section ---
    st.subheader("Update Existing Topic")
    if not all_topics:
        st.info("No topics available to update.")
        st.markdown("---")
        return

    if not all_subjects:
        st.info("No Subjects available for selection in update. Please create Subjects.")
        st.markdown("---")
        return

    # 1. Select Subject for Update
    subject_display_options_update = [f"{s['subname']} (ID: {s['subid']})" for s in all_subjects]
    selected_subject_update_display = st.selectbox(
        "Select Parent Subject for Topic Update",
        options=subject_display_options_update,
        key="update_topic_subject_select"
    )
    selected_subject_update_id = int(selected_subject_update_display.split("(ID: ")[1][:-1]) if selected_subject_update_display else None

    # Filter topics based on selected Subject
    filtered_topics_for_update = [
        t for t in all_topics if t['subid'] == selected_subject_update_id
    ]
    if not filtered_topics_for_update:
        st.info(f"No topics found for the selected Subject '{selected_subject_update_display}'.")
        st.markdown("---")
        return

    # 2. Select Topic to Update (filtered by Subject)
    sorted_topics_for_update = sorted(filtered_topics_for_update, key=lambda x: x['tid'])
    topic_options_update = {
        f"ID: {t['tid']} ({t['tname']})": t['tid'] 
        for t in sorted_topics_for_update
    }
    selected_topic_display = st.selectbox(
        "Select Specific Topic to Update",
        options=list(topic_options_update.keys()),
        key="select_specific_topic_to_update"
    )
    selected_topic_id = topic_options_update.get(selected_topic_display)

    current_topic_obj = None
    if selected_topic_id is not None:
        current_topic_obj = next((t for t in all_topics if t['tid'] == selected_topic_id), None)

    if current_topic_obj:
        with st.form("update_topic_form"):
            initial_tname = current_topic_obj['tname']
            initial_subid = current_topic_obj['subid'] # This is the current topic's actual subject ID
            initial_image_url = current_topic_obj.get('image_url', '')

            # Display the current subject (non-editable for this form, as hierarchy is selected above)
            st.info(f"Current Parent Subject: {subject_id_to_name_map.get(initial_subid, 'N/A')}")
            
            updated_tname = st.text_input("New Topic Name", value=initial_tname, key="updated_topic_name_input")
            updated_image_url = st.text_input("New Image URL (optional)", value=initial_image_url, key="updated_topic_image_url_input")
            
            update_submitted = st.form_submit_button("Update Topic")

            if update_submitted:
                if selected_topic_id is not None and updated_tname and initial_subid is not None:
                    # Check for duplicate topic name with other topics within the *current* subject
                    existing_topics_in_current_subject = {
                        t['tname'] for t in all_topics 
                        if t['subid'] == initial_subid and t['tid'] != selected_topic_id
                    }
                    if updated_tname in existing_topics_in_current_subject:
                        st.warning(f"Topic '{updated_tname}' already exists for this subject. Please choose a different name.")
                    else:
                        with st.spinner(f"Updating topic ID {selected_topic_id}..."):
                            update_payload = {}
                            if updated_tname != initial_tname:
                                update_payload['tname'] = updated_tname
                            # subid is passed as it's part of the uniqueness constraint, even if it logically doesn't change here
                            # in this hierarchical update flow. Backend validation will ensure it's still valid.
                            # We explicitly include it to ensure the API call for update is complete.
                            update_payload['subid'] = initial_subid 
                            if updated_image_url != initial_image_url:
                                update_payload['image_url'] = updated_image_url
                            
                            # --- Debugging Information (Update Section) ---
                            st.info(f"DEBUG (Update): Selected Topic ID: {selected_topic_id}")
                            st.info(f"DEBUG (Update): Initial Data: Name='{initial_tname}', Subject ID='{initial_subid}', Image='{initial_image_url}'")
                            st.info(f"DEBUG (Update): Updated Data: Name='{updated_tname}', Subject ID='{initial_subid}', Image='{updated_image_url}'")
                            st.info(f"DEBUG (Update): Payload to send: {update_payload}")
                            # --- End Debugging Information ---

                            if not update_payload:
                                st.info("No changes detected. Topic not updated.")
                                st.rerun()
                                return

                            result = update_topic(selected_topic_id, **update_payload)
                            if result:
                                st.success(f"Topic ID {result['tid']} updated successfully!")
                                st.rerun()
                            else:
                                st.error("Failed to update topic. Please check API logs.")
                else:
                    st.warning("Please select a topic and enter a valid name.")
            else:
                st.info("Select a topic from the dropdown to see its details for update.")

    st.markdown("---") # Separator

    # --- Delete Topic Section ---
    st.subheader("Delete Topic")
    if all_topics:
        topic_options_delete = {f"ID: {t['tid']} ({t['tname']})": t['tid'] for t in sorted(all_topics, key=lambda x: x['tid'])}
        selected_topic_display_delete = st.selectbox(
            "Select Topic to Delete",
            options=list(topic_options_delete.keys()),
            key="delete_topic_select"
        )
        selected_topic_id_delete = topic_options_delete.get(selected_topic_display_delete)

        if st.button("Delete Topic", key="delete_topic_button"):
            if selected_topic_id_delete is not None:
                st.session_state.confirm_delete_topic_id = selected_topic_id_delete
                st.warning(f"Are you sure you want to delete Topic ID: {selected_topic_id_delete}? This action cannot be undone.")
            else:
                st.warning("Please select a topic to delete.")
        
        if 'confirm_delete_topic_id' in st.session_state and st.session_state.confirm_delete_topic_id == selected_topic_id_delete:
            if st.button("Confirm Deletion", key="confirm_delete_topic_final_button"):
                with st.spinner(f"Deleting topic ID {selected_topic_id_delete}..."):
                    success = delete_topic(selected_topic_id_delete)
                    if success:
                        st.success(f"Topic ID {selected_topic_id_delete} deleted successfully!")
                        del st.session_state.confirm_delete_topic_id
                        st.rerun()
                    else:
                        st.error("Failed to delete topic. Please check API logs.")
    else:
        st.info("No topics available to delete.")

