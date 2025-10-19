#!/usr/bin/env python3
"""
Property Test Selectors
=======================

This file contains all the selectors and element identifiers used in the property management tests.
It helps maintain consistency and makes it easy to update selectors when the UI changes.
"""

# Login Page Selectors
LOGIN_SELECTORS = {
    'email_input': '#email',
    'password_input': '#password',
    'submit_button': 'button[type="submit"]',
    'login_form': 'form',
    'error_message': '.error, .alert, [role="alert"]'
}

# Navigation Selectors
NAVIGATION_SELECTORS = {
    'properties_link': 'text=Properties',
    'properties_link_alt': 'a[href*="property"]',
    'dashboard_link': 'text=Dashboard',
    'add_property_button': 'text=Add Property',
    'property_list': '[data-testid="property-list"]'
}

# Property Form Selectors
PROPERTY_FORM_SELECTORS = {
    # Basic Information
    'property_name': 'input[name="propertyName"]',
    'address_line1': 'input[name="addressLine1"]',
    'post_code': 'input[name="postCode"]',
    'town': 'input[name="town"]',
    'category': 'select[name="category"]',
    'property_type': 'select[name="propertyType"]',
    'price': 'input[name="price"]',
    'for_sale_let': 'select[name="for"]',
    
    # Property Details
    'bedrooms': 'input[name="bedrooms"]',
    'bathrooms': 'input[name="bathrooms"]',
    'area': 'input[name="area"]',
    'year_built': 'input[name="yearBuilt"]',
    'status': 'select[name="status"]',
    
    # Description
    'description': 'textarea[name="description"]',
    
    # EPC Ratings
    'current_ee_rating': 'select[name="currentEERating"]',
    'potential_ee_rating': 'select[name="potentialEERating"]',
    'epc_chart_option': 'select[name="epcChartOption"]',
    'epc_report_option': 'select[name="epcReportOption"]',
    
    # Features
    'garden_checkbox': 'input[value="Garden"]',
    'parking_checkbox': 'input[value="Parking"]',
    'balcony_checkbox': 'input[value="Balcony"]',
    'garage_checkbox': 'input[value="Garage"]',
    
    # Form Navigation
    'next_button': 'button:has-text("Next")',
    'previous_button': 'button:has-text("Previous")',
    'save_draft_button': 'button:has-text("Save as Draft")',
    'publish_button': 'button:has-text("Publish")',
    'cancel_button': 'button:has-text("Cancel")'
}

# Property List Selectors
PROPERTY_LIST_SELECTORS = {
    'property_table': 'table',
    'property_row': 'tbody tr',
    'edit_button': 'button:has-text("Edit")',
    'delete_button': 'button:has-text("Delete")',
    'view_button': 'button:has-text("View")',
    'publish_button': 'button:has-text("Publish")',
    'property_name_cell': 'td:first-child',
    'property_status_cell': 'td:nth-child(4)',
    'property_status_badge': '.badge, .status-badge, [class*="badge"]'
}

# Filter and Search Selectors
FILTER_SELECTORS = {
    'search_input': 'input[placeholder*="search" i]',
    'status_filter': 'select[name="status"]',
    'category_filter': 'select[name="category"]',
    'property_status_filter': 'select[name="propertyStatus"]',
    'draft_tab': 'button:has-text("Drafts")',
    'published_tab': 'button:has-text("Published")',
    'all_tab': 'button:has-text("All")'
}

# Modal and Dialog Selectors
MODAL_SELECTORS = {
    'confirmation_dialog': '[role="dialog"]',
    'confirm_button': 'button:has-text("Confirm")',
    'cancel_button': 'button:has-text("Cancel")',
    'close_button': 'button:has-text("Close")',
    'modal_backdrop': '.modal-backdrop, .overlay'
}

# Error and Success Message Selectors
MESSAGE_SELECTORS = {
    'error_message': '.error, .alert-error, [role="alert"]',
    'success_message': '.success, .alert-success',
    'warning_message': '.warning, .alert-warning',
    'info_message': '.info, .alert-info',
    'toast_message': '.toast, [data-testid="toast"]'
}

# Loading and Wait Selectors
LOADING_SELECTORS = {
    'loading_spinner': '.spinner, .loading, [data-testid="loading"]',
    'skeleton_loader': '.skeleton, .skeleton-loader',
    'progress_bar': '.progress, .progress-bar'
}

# Form Validation Selectors
VALIDATION_SELECTORS = {
    'field_error': '.field-error, .error-message',
    'required_field': '[required]',
    'invalid_field': '.invalid, .is-invalid',
    'valid_field': '.valid, .is-valid'
}

# EPC Rating Options
EPC_RATING_OPTIONS = {
    'ratings': [str(i) for i in range(0, 101)],  # 0-100
    'current_rating_default': '75',
    'potential_rating_default': '85'
}

# Property Status Options
PROPERTY_STATUS_OPTIONS = {
    'draft': 'DRAFT',
    'published': 'PUBLISHED'
}

# Property Category Options
PROPERTY_CATEGORY_OPTIONS = {
    'residential': 'residential',
    'commercial': 'commercial',
    'industrial': 'industrial'
}

# Property Type Options
PROPERTY_TYPE_OPTIONS = {
    'flat': 'Flat',
    'house': 'House',
    'apartment': 'Apartment',
    'studio': 'Studio'
}

# Test Data Templates
TEST_DATA_TEMPLATES = {
    'basic_property': {
        'name': 'Test Property {timestamp}',
        'address': '123 Test Street',
        'postCode': 'SW1A 1AA',
        'town': 'London',
        'price': '250000',
        'description': 'This is a test property for automated testing',
        'bedrooms': '3',
        'bathrooms': '2',
        'area': '1200',
        'yearBuilt': '2020'
    },
    'draft_property': {
        'name': 'Draft Property {timestamp}',
        'address': '456 Draft Avenue',
        'postCode': 'E1 6AN',
        'town': 'London',
        'price': '300000',
        'description': 'This is a draft property for testing',
        'bedrooms': '2',
        'bathrooms': '1',
        'area': '800',
        'yearBuilt': '2018'
    }
}

# Wait Timeouts (in milliseconds)
WAIT_TIMEOUTS = {
    'short': 5000,
    'medium': 10000,
    'long': 30000,
    'very_long': 60000
}

# Browser Configuration
BROWSER_CONFIG = {
    'headless': False,
    'slow_mo': 0,
    'viewport': {'width': 1920, 'height': 1080},
    'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
}

# Test Configuration
TEST_CONFIG = {
    'base_url': 'http://localhost:8081',
    'login_email': 'admin@woodland.com',
    'login_password': '12345',
    'screenshot_on_failure': True,
    'video_on_failure': True,
    'trace_on_failure': True,
    'check_connection': True,  # Check if application is running before tests
    'connection_timeout': 30   # Seconds to wait for application to be ready
}
