import csv
import requests
import json
from datetime import datetime, timedelta
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
import smtplib
import re

# Constants
API_URL = "https://voip.atomip.co.uk/ns-api/"
CLIENT_SECRET = "9e28b63a91cab43b9aba0d33f1261d51"
CLIENT_ID = "atomip"
GRANT_TYPE = "password"
USERNAME = "201@atom.ip"
PASSWORD = "Smile2021"
DOMAIN = "Consortio"

SMTP_SERVER = 'smtp.sendgrid.net'
SMTP_PORT = 587
SENDER_EMAIL = 'noreply@atomip.uk'
RECEIVER_EMAIL = 'fefurqan@gmail.com'
BCC_EMAIL = 'abbasi.work22@gmail.com'
SMTP_PASSWORD = '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'

def sanitize_filename(filename):
    """Replace invalid characters in filenames."""
    return filename.replace(":", "-")

def get_call_id_number ():
    call_id_number = []
    for user in user_data:
        try:
            # Attempt to access 'callid_nmbr'
            
            normalized_number = normalize_phone_number(user['callid_nmbr'])
            call_id_number.append(normalized_number)

        except KeyError:
            # Handle the case where 'callid_nmbr' is missing
            print("An error occurred: 'callid_nmbr' is missing for a user.")
    return call_id_number

def normalize_phone_number(phone_number):
    """Normalize phone numbers by removing non-numeric characters."""
    return re.sub(r'\D', '', str(phone_number))  # Remove all non-numeric characters



def seconds_to_hms_string(seconds):
    """Convert seconds to HH:MM:SS format."""
    hours = seconds // 3600
    seconds %= 3600
    minutes = seconds // 60
    seconds %= 60
    return f"{int(hours):02d}:{int(minutes):02d}:{int(seconds):02d}"

def format_phone_number(number):
    """Format phone numbers based on length and country code."""
    cleaned_number = re.sub(r'\D', '', str(number))
    length = len(cleaned_number)

    if length == 10:
        return f"({cleaned_number[:3]}) {cleaned_number[3:6]}-{cleaned_number[6:]}"
    elif length == 11 and cleaned_number.startswith('1'):
        return f"+1 ({cleaned_number[1:4]}) {cleaned_number[4:7]}-{cleaned_number[7:]}"
    elif length == 12 and cleaned_number.startswith('44'):
        return f"+{cleaned_number[:2]} ({cleaned_number[2:5]}) {cleaned_number[5:8]}-{cleaned_number[8:]}"
    elif length > 10:
        country_code = cleaned_number[0:len(cleaned_number) - 10]
        local_number = cleaned_number[len(cleaned_number) - 10:]
        return f"+{country_code} ({local_number[:3]}) {local_number[3:6]}-{local_number[6:]}"
    else:
        return cleaned_number

def get_access_token():
    """Retrieve access token from the API."""
    url = f"{API_URL}oauth2/token/"
    payload = {
        "client_secret": CLIENT_SECRET,
        "client_id": CLIENT_ID,
        "grant_type": GRANT_TYPE,
        "username": USERNAME,
        "password": PASSWORD
    }
    headers = {"Content-Type": "application/json"}
    response = requests.post(url, data=json.dumps(payload), headers=headers)
    if response.status_code == 200:
        data = response.json()
        return data['access_token'], data['refresh_token']
    else:
        raise Exception("Failed to retrieve access token")

def fetch_cdr_data(access_token, start_date, end_date):
    """Fetch CDR data from the API."""
    url = f"{API_URL}?format=json&object=cdr2&action=read"
    payload = {
        "start_date": start_date,
        "end_date": end_date,
        "limit": 1000000,
        "domain": DOMAIN
    }
    headers = {"Authorization": f"Bearer {access_token}"}
    response = requests.post(url, data=json.dumps(payload), headers=headers)
    if response.status_code == 200:
        return response.json()
    else:
        raise Exception("Failed to fetch CDR data")

def fetch_user_data(access_token):
    """Fetch user data from the API."""
    url = f"{API_URL}?format=json&object=subscriber&action=read"
    payload = {"domain": DOMAIN, "limit": 1000000}
    headers = {"Authorization": f"Bearer {access_token}"}
    response = requests.post(url, data=json.dumps(payload), headers=headers)
    if response.status_code == 200:
        return response.json()
    
    else:
        raise Exception("Failed to fetch user data")


def process_cdr_data(cdr_data, users, user_data):
    """Process CDR data and calculate metrics."""

    call_id_number = get_call_id_number()

    metrics = {
        'total_time': {},
        'total_calls': {},
        'total_timing_of_calls': {},
        'total_outbound_calls': {},
        'total_outbound_time': {},
        'inbound_missed': {},
        'outbound_missed': {},
        'total_inbound_calls': {},
        'total_inbound_time': {},
        'avg_inbound_time': {},
        'avg_outbound_time': {},
        'max_inbound_time': {},
        'max_outbound_time': {},
        'name_agent': {},
        'avg_outbound_talk_time': {},
        'avg_inbound_talk_time': {},
        'time_inbound_ring': {},
        'incoming_avg_ring': {},
        'data_calls' : {}
    }
    

    # Initialize metrics for each user and 'Total'
    for user in users + ['Total']:
        for key in metrics:
            if key != 'name_agent':  # Skip name_agent for 'Total'
                metrics[key][user] = 0

    # Populate name_agent for users
    for user in user_data:
        metrics['name_agent'][user['user']] = f"{user['first_name']} {user['last_name']} <{user['user']}>"

    # Add a name for the 'Total' row
    metrics['name_agent']['Total'] = 'Total'
    print(len(cdr_data))
    d = 0
    e1 = 0
    # Process each CDR record
    for cdr in cdr_data:
        
        orig_to_user_normalized = normalize_phone_number(cdr['orig_to_user'])

        # Skip processing if cdr['orig_to_user'] matches any number in call_id_number
        if orig_to_user_normalized in call_id_number:
            print(cdr['by_sub'])
            
            d= d + 1
            
            continue  # Skip this CDR record


        else:
            e1 = e1  + 1
            
            if cdr['orig_sub'] is not None and cdr['orig_sub'] in metrics['total_time']:
                if cdr['time_answer'] is not None:
                    time_answer = datetime.fromtimestamp(int(cdr['time_answer']))
                    time_release = datetime.fromtimestamp(int(cdr['time_release']))
                    time_difference_outbound = time_release - time_answer
                    time_difference_seconds_outbound = time_difference_outbound.total_seconds()

                if cdr['type'] == str(0):
                    number_from = re.search(r'\d+', cdr['orig_from_uri']).group()
                    # data_inbound = {
                    #     'user': cdr['orig_sub'],
                    #     'time': cdr['time_start'],
                    #     'source': number_from,
                    #     'destination': cdr['orig_to_user'],
                    #     'duration': seconds_to_hms_string(float(cdr['duration'])),
                    #     'Direction': 'Outgoing'
                    # }
                    # metrics['data_calls'].append(data_inbound)

                    metrics['total_time'][cdr['orig_sub']] += int(cdr['time_talking'])
                    metrics['total_timing_of_calls'][cdr['orig_sub']] += int(cdr['time_talking'])
                    metrics['total_calls'][cdr['orig_sub']] += 1
                    metrics['total_outbound_calls'][cdr['orig_sub']] += 1
                    metrics['total_outbound_time'][cdr['orig_sub']] += int(cdr['time_talking'])

                    if metrics['max_outbound_time'][cdr['orig_sub']] < time_difference_seconds_outbound:
                        metrics['max_outbound_time'][cdr['orig_sub']] = time_difference_seconds_outbound

                elif cdr['type'] == str(3):
                    metrics['total_time'][cdr['orig_sub']] += int(cdr['time_talking'])
                    metrics['total_timing_of_calls'][cdr['orig_sub']] += int(cdr['time_talking'])
                    metrics['total_calls'][cdr['orig_sub']] += 1
                    metrics['total_outbound_calls'][cdr['orig_sub']] += 1
                    metrics['total_outbound_time'][cdr['orig_sub']] += int(cdr['time_talking'])

                if cdr['time_answer'] is None:
                    metrics['outbound_missed'][cdr['orig_sub']] += 1

            elif cdr['orig_sub'] is None:

                if cdr['term_sub'] is not None and cdr['term_sub'] in metrics['total_time']:
                    
                    if cdr['time_answer'] is not None:
                        time_answer = datetime.fromtimestamp(int(cdr['time_answer']))
                        time_release = datetime.fromtimestamp(int(cdr['time_release']))
                        time_difference = time_release - time_answer
                        time_difference_seconds = time_difference.total_seconds()

                        time_start = datetime.fromtimestamp(int(cdr['time_start']))
                        time_difference_ring = time_answer - time_start
                        time_difference_seconds_ring = time_difference_ring.total_seconds()

                    if cdr['type'] == str(3):
                        metrics['total_time'][cdr['term_sub']] += int(cdr['time_talking'])
                        metrics['time_inbound_ring'][cdr['term_sub']] += time_difference_seconds_ring
                        metrics['total_calls'][cdr['term_sub']] += 1
                        metrics['total_inbound_calls'][cdr['term_sub']] += 1

                    if cdr['type'] == str(0) or cdr['type'] == '0':
                        number_from = re.search(r'\d+', cdr['orig_from_uri']).group()

                        metrics['total_time'][cdr['term_sub']] += int(cdr['time_talking'])
                        metrics['total_timing_of_calls'][cdr['term_sub']] += int(cdr['time_talking'])
                        metrics['time_inbound_ring'][cdr['term_sub']] += time_difference_seconds_ring
                        metrics['total_calls'][cdr['term_sub']] += 1

                        if metrics['max_inbound_time'][cdr['term_sub']] < time_difference_seconds:
                            metrics['max_inbound_time'][cdr['term_sub']] = time_difference_seconds

                        metrics['total_inbound_calls'][cdr['term_sub']] += 1
                        metrics['total_inbound_time'][cdr['term_sub']] += int(cdr['time_talking'])

                    elif cdr['type'] == str(2):
                        metrics['inbound_missed'][cdr['term_sub']] += 1

    
    # Calculate totals for the 'Total' row
    for user in users:
        for key in metrics:
            if key != 'name_agent':  # Skip name_agent for 'Total'
                metrics[key]['Total'] += metrics[key][user]

    

    # Calculate averages and totals
    for user in users + ['Total']:
        if metrics['total_inbound_calls'][user] > 0:
            metrics['avg_inbound_talk_time'][user] = metrics['total_inbound_time'][user] / metrics['total_inbound_calls'][user]
            metrics['incoming_avg_ring'][user] = metrics['time_inbound_ring'][user] / metrics['total_inbound_calls'][user]

        if metrics['total_outbound_calls'][user] > 0:
            metrics['avg_outbound_talk_time'][user] = metrics['total_outbound_time'][user] / metrics['total_outbound_calls'][user]

        if metrics['total_calls'][user] > 0:
            metrics['avg_inbound_time'][user] = metrics['total_inbound_calls'][user] / metrics['total_calls'][user]
            metrics['avg_outbound_time'][user] = metrics['total_outbound_calls'][user] / metrics['total_calls'][user]

    # Convert times to HH:MM:SS format
    for user in users + ['Total']:
        metrics['total_time'][user] = seconds_to_hms_string(metrics['total_time'][user])
        metrics['total_timing_of_calls'][user] = seconds_to_hms_string(metrics['total_timing_of_calls'][user])
        metrics['total_inbound_time'][user] = seconds_to_hms_string(metrics['total_inbound_time'][user])
        metrics['total_outbound_time'][user] = seconds_to_hms_string(metrics['total_outbound_time'][user])
        metrics['max_inbound_time'][user] = seconds_to_hms_string(metrics['max_inbound_time'][user])
        metrics['max_outbound_time'][user] = seconds_to_hms_string(metrics['max_outbound_time'][user])
        metrics['avg_inbound_talk_time'][user] = seconds_to_hms_string(metrics['avg_inbound_talk_time'][user])
        metrics['avg_outbound_talk_time'][user] = seconds_to_hms_string(metrics['avg_outbound_talk_time'][user])
        metrics['incoming_avg_ring'][user] = seconds_to_hms_string(metrics['incoming_avg_ring'][user])

    return metrics

def generate_inbound_outbound_calls(access_token, start_date, end_date):
    """Generate inbound and outbound calls data."""
    data_calls = []
    data_cdr = fetch_cdr_data(access_token, start_date, end_date)  # Fetch CDR data
    
    call_id_number = get_call_id_number()
    
    for cdr in data_cdr:
        orig_to_user_normalized = normalize_phone_number(cdr['orig_to_user'])


        # Skip processing if cdr['orig_to_user'] matches any number in call_id_number
        if orig_to_user_normalized in call_id_number:
            
            continue  # Skip this CDR record



        if cdr['orig_sub'] is not None:
            if cdr['type'] == str(0):  # Outgoing call
                number_from = re.search(r'\d+', cdr['orig_from_uri']).group()
                data_inbound = {
                    'user': cdr['orig_sub'],
                    'time': cdr['time_start'],
                    'source': number_from,
                    'destination': cdr['orig_to_user'],
                    'duration': seconds_to_hms_string(float(cdr['duration'])),
                    'Direction': 'Outgoing'
                }
                data_calls.append(data_inbound)

            elif cdr['type'] == str(3):  # Incoming call
                number_from = re.search(r'\d+', cdr['orig_from_uri']).group()
                data_outbound = {
                    'user': cdr['term_sub'],
                    'time': cdr['time_start'],
                    'source': number_from,
                    'destination': cdr['orig_to_user'],
                    'duration': seconds_to_hms_string(float(cdr['duration'])),
                    'Direction': 'Incoming'
                }
                data_calls.append(data_outbound)

    return data_calls


def generate_csv_report(metrics, start_date, end_date, data_calls):
    """Generate a CSV report from the metrics and data_calls."""
    # Sanitize the filename
    sanitized_start_date = sanitize_filename(start_date)
    filename = f"{sanitized_start_date}.csv"

    with open(filename, 'w', newline='') as csvfile:
        # Define fieldnames for the CSV
        fieldnames1 = ['User', 'Date and Time', 'Source', 'Destination', 'Duration', 'Direction']
        fieldnames2 = [
            'Agent Name', 'Total Calls', 'Total Talk Time', 'Incoming Total', 'Incoming Missed', 
            'Incoming Avg Per Hour', 'Incoming Talk Time', 'Incoming Average Talk Time', 
            'Incoming Max Talk Time', 'Incoming Average Ring Time', 'Outgoing Total', 
            'Outgoing Avg Per Hour', 'Outgoing Unanswered', 'Outgoing Answered', 
            'Outgoing Total Talk Time', 'Outgoing Avg Talk Time', 'Outgoing Max Talk Time'
        ]

        # Write the first set of data (fieldnames1)

        # Write the second set of data (fieldnames2)
        writer2 = csv.DictWriter(csvfile, fieldnames=fieldnames2)
        writer2.writeheader()
        for user in metrics['total_calls']:
            writer2.writerow({
                'Agent Name': metrics['name_agent'].get(user, 'Total'),  # Use 'Total' for the 'Total' row
                'Total Calls': metrics['total_calls'][user],
                'Total Talk Time': metrics['total_timing_of_calls'][user],
                'Incoming Total': metrics['total_inbound_calls'][user],
                'Incoming Missed': metrics['inbound_missed'][user],
                'Incoming Avg Per Hour': metrics['avg_inbound_time'][user],
                'Incoming Talk Time': metrics['total_inbound_time'][user],
                'Incoming Average Talk Time': metrics['avg_inbound_talk_time'][user],
                'Incoming Max Talk Time': metrics['max_inbound_time'][user],
                'Incoming Average Ring Time': metrics['incoming_avg_ring'][user],
                'Outgoing Total': metrics['total_outbound_calls'][user],
                'Outgoing Avg Per Hour': metrics['avg_outbound_time'][user],
                'Outgoing Unanswered': metrics['outbound_missed'][user],
                'Outgoing Answered': str(int(metrics['total_outbound_calls'][user]) - int(metrics['outbound_missed'][user])),
                'Outgoing Total Talk Time': metrics['total_outbound_time'][user],
                'Outgoing Avg Talk Time': metrics['avg_outbound_talk_time'][user],
                'Outgoing Max Talk Time': metrics['max_outbound_time'][user]
            })

        writer1 = csv.DictWriter(csvfile, fieldnames=fieldnames1)
        writer1.writeheader()
        for data in data_calls:
            writer1.writerow({
                'User': data['user'],
                'Date and Time': datetime.fromtimestamp(int(data['time'])),
                'Source': format_phone_number(data['source']),
                'Destination': format_phone_number(data['destination']),
                'Duration': data['duration'],
                'Direction': data['Direction']
            })

        # Add a blank row to separate the sections
        csvfile.write('\n')

    return filename

def send_email_with_attachment(filename, start_date, end_date):
    """Send an email with the CSV report attached."""
    message = MIMEMultipart()
    message['From'] = SENDER_EMAIL
    message['To'] = RECEIVER_EMAIL
    message['Subject'] = 'DAILY CONSORTIO AGENT SUMMARY'
    message['Bcc'] = BCC_EMAIL

    # Construct the HTML body
    html_body = """
    <html>
    <head>
    <style>
    table {
        border-collapse: collapse;
        width: 100%;
    }
    th, td {
        padding: 8px;
        text-align: left;
        border-bottom: 1px solid #ddd;
    }
    th {
        background-color: #f2f2f2;
        font-weight: bold;
    }
    </style>
    </head>
    <body>
    <table>
    <h1>Agent Summary</h1>
    <br/>
    """ + str(start_date) + """ - """ + str(end_date) + """
    <tr>
    <th>Agent Name</th><th>Total Calls</th><th>Total Talk Time</th>
    <th>Incoming Total</th><th>Incoming Missed</th>
    <th>Incoming Avg Per Hour</th><th>Incoming Talk Time</th>
    <th>Incoming Average Talk Time</th><th>Incoming Max Talk Time</th>
    <th>Incoming Average Ring Time</th><th>Outgoing Total</th>
    <th>Outgoing Avg Per Hour</th><th>Outgoing Unanswered</th>
    <th>Outgoing Answered</th><th>Outgoing Total Talk Time</th>
    <th>Outgoing Avg Talk Time</th><th>Outgoing Max Talk Time</th>
    </tr>
    """

    # Add rows to the HTML body
    for i, user in enumerate(metrics['total_calls']):
        row_color = "lightgrey" if i % 2 == 0 else "white"  # Alternate row color
        html_body += f"<tr style='background-color: {row_color};'>"
        html_body += f"<td>{metrics['name_agent'][user]}</td>"
        html_body += f"<td>{metrics['total_calls'][user]}</td>"
        html_body += f"<td>{metrics['total_timing_of_calls'][user]}</td>"
        html_body += f"<td>{metrics['total_inbound_calls'][user]}</td>"
        html_body += f"<td>{metrics['inbound_missed'][user]}</td>"
        html_body += f"<td>{metrics['avg_inbound_time'][user]}</td>"
        html_body += f"<td>{metrics['total_inbound_time'][user]}</td>"
        html_body += f"<td>{metrics['avg_inbound_talk_time'][user]}</td>"
        html_body += f"<td>{metrics['max_inbound_time'][user]}</td>"
        html_body += f"<td>{metrics['incoming_avg_ring'][user]}</td>"
        html_body += f"<td>{metrics['total_outbound_calls'][user]}</td>"
        html_body += f"<td>{metrics['avg_outbound_time'][user]}</td>"
        html_body += f"<td>{metrics['outbound_missed'][user]}</td>"
        html_body += f"<td>{int(metrics['total_outbound_calls'][user]) - int(metrics['outbound_missed'][user])}</td>"
        html_body += f"<td>{metrics['total_outbound_time'][user]}</td>"
        html_body += f"<td>{metrics['avg_outbound_talk_time'][user]}</td>"
        html_body += f"<td>{metrics['max_outbound_time'][user]}</td>"
        html_body += "</tr>\n"

    html_body += """
    </table>
    </body>
    </html>
    """

    # Attach the HTML body to the email
    message.attach(MIMEText(html_body, 'html'))

    try:
        # Attach the CSV file
        with open(filename, 'rb') as attachment:
            part = MIMEBase('application', 'octet-stream')
            part.set_payload(attachment.read())
            encoders.encode_base64(part)
            part.add_header('Content-Disposition', f'attachment; filename= {filename}')
            message.attach(part)

        # Send the email
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login('apikey', SMTP_PASSWORD)
            server.send_message(message)

        print("Email sent successfully!")
    except Exception as e:
        print(e)

# Main Execution
if __name__ == "__main__":
    try:
        access_token, refresh_token = get_access_token()
        current_time = datetime.now()

        # Calculate times
        one_hour_before = current_time - timedelta(hours=12)
        start_of_yesterday = current_time.replace(hour=4, minute=0, second=0, microsecond=0)

        # Format the datetime objects as strings
        start_date = start_of_yesterday.strftime('%Y-%m-%d %H:%M:%S')
        end_date = current_time.strftime('%Y-%m-%d %H:%M:%S')


        start_date = datetime(year=2025, month=1, day=23, hour=23, minute=0, second=0).strftime('%Y-%m-%d %H:%M:%S')

        end_date = datetime(year=2025, month=1, day=25, hour=23, minute=0, second=0).strftime('%Y-%m-%d %H:%M:%S')


        # Fetch and process data
        cdr_data = fetch_cdr_data(access_token, start_date, end_date)
        user_data = fetch_user_data(access_token)
        users = [user['user'] for user in user_data if user['scope'] in ['Call Center Supervisor', 'Call Center Agent']]
        metrics = process_cdr_data(cdr_data, users, user_data)
        
        # Debug: Print metrics to verify values
        data_calls = generate_inbound_outbound_calls(access_token, start_date, end_date)
        
        # Generate CSV report
        csv_filename = generate_csv_report(metrics, start_date, end_date, data_calls)

        # Send email with attachment
        send_email_with_attachment(csv_filename, start_date, end_date)

    except Exception as e:
        print(f"An error occurred: {e}")