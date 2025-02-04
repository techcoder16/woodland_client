import csv
import requests
from requests.auth import _basic_auth_str
import json
from datetime import date

from datetime import datetime,timedelta

from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
import smtplib
import re






today = datetime.now()
now = datetime.now()
 

url = "https://voip.atomip.co.uk/ns-api/oauth2/token/"


client_secret = "9e28b63a91cab43b9aba0d33f1261d51"
client_id = "atomip"

grant_type = "password"
username = "201@atom.ip"
password = "Smile2021"
domain = ""

access_token = ""
refresh_token = ""

payload = {
    "client_secret": client_secret,
    "client_id": client_id,
    "grant_type": grant_type,
    "username": username,
    "password": password
}

headers = {
    "Content-Type": "application/json"
}


def seconds_to_hms_string(seconds):
    
    hours = seconds // 3600
    seconds %= 3600
    minutes = seconds // 60
    seconds %= 60
    return "{:02d}:{:02d}:{:02d}".format(int(hours), int(minutes), int(seconds))


domain = "Consortio"


response_ok = requests.get(url, data=json.dumps(payload), headers=headers)


if response_ok.status_code == 200:
    data = response_ok.json()
    
    access_token = data['access_token']

    refresh_token = data['refresh_token']
    domain = "Consortio"

    
else:
    pass





payload ={
    "domain": domain,
    "limit":1000000,
    
}
url = "https://voip.atomip.co.uk/ns-api/?object=call&action=read"




api_headers = {
  
        "Authorization": f"Bearer {access_token}"
        }





url_user = "https://voip.atomip.co.uk/ns-api/?format=json&object=subscriber&action=read"



response_user = requests.post(url_user, data=payload, headers=api_headers)

total_time = {}
total_calls = {}
total_timing_of_calls = {}
total_outbound_calls = {}
total_outbound_time = {}

inbound_missed = {}
outbound_missed = {}

total_inbound_calls = {}
total_inbound_time = {}

avg_inbound_time = {}
avg_outbound_time = {}
max_inbound_time = {}
max_outbound_time = {}
name_agent = {}

avg_outbound_talk_time = {}

avg_inbound_talk_time = {}
time_inbound_ring = {}
incoming_avg_ring = {}


data_calls = []

users = []
data = response_user.json()

for d in data:
    user = d['user']

    if d['scope'] == 'Call Center Supervisor' or d['scope'] =='Call Center Agent':
        users.append(user)
        total_time[user] = 0
        total_calls[user] = 0
        total_timing_of_calls [user]  = 0
        total_outbound_calls  [user]  = 0
        total_inbound_calls  [user]  = 0
        total_outbound_time [user]  = 0
        total_inbound_time [user]  = 0
        inbound_missed [user] = 0
        outbound_missed [user] = 0
        avg_outbound_time [user] = 0
        max_inbound_time [user] = 0
        avg_inbound_time [user] = 0
        max_outbound_time [user] = 0
        avg_outbound_talk_time [user] = 0

        avg_inbound_talk_time  [user] = 0
        incoming_avg_ring [user] = 0
        time_inbound_ring [user] = 0


        name_agent[user]  = d['first_name'] + ' ' + d['last_name'] + ' <' + user + '> '  




user = 'Total'

name_agent[user] = 'Total'

total_time[user] = 0
total_calls[user] = 0
total_timing_of_calls [user]  = 0
total_outbound_calls  [user]  = 0
total_inbound_calls  [user]  = 0
total_outbound_time [user]  = 0
total_inbound_time [user]  = 0
inbound_missed [user] = 0
outbound_missed [user] = 0
avg_outbound_time [user] = 0
max_inbound_time [user] = 0
avg_inbound_time [user] = 0
max_outbound_time [user] = 0
avg_outbound_talk_time [user] = 0

avg_inbound_talk_time  [user] = 0
incoming_avg_ring [user] = 0
time_inbound_ring [user] = 0





        


current_time = datetime.now()

# Subtract one hour
one_hour_before = current_time - timedelta(hours=12)

# start_of_last_week = current_time - timedelta(weeks=1)

start_of_yesterday = current_time.replace(hour=4, minute=0, second=0, microsecond=0)

start_date = start_of_yesterday
today = current_time.strftime('%Y-%m-%d %H:%M:%S')
end_date = today



start_datetime = start_date
end_datetime = datetime.strptime(end_date, '%Y-%m-%d %H:%M:%S')


start_date_only = start_datetime.strftime('%Y-%m-%d')
end_date_only = end_datetime.strftime('%Y-%m-%d')
start_date = datetime(year=2025, month=1, day=23, hour=23, minute=0, second=0).strftime('%Y-%m-%d %H:%M:%S')

end_date = datetime(year=2025, month=1, day=25, hour=23, minute=0, second=0).strftime('%Y-%m-%d %H:%M:%S')





url_cdr_domain = "https://voip.atomip.co.uk/ns-api/?format=json&object=cdr2&action=read"

payload_cdr_domain  = {"start_date": start_date,"end_date":end_date,"limit":1000000,"domain":domain}
count = 0


response_cdr_domain  = requests.post(url_cdr_domain ,data=payload_cdr_domain ,headers=api_headers)

data_cdr = response_cdr_domain.json()



count = 0
countleft = 0
countright = 0
c = 0
c1 = 0

c2 = 0
c3 = 0
c4 = 0
c5 = 0

for cdr in data_cdr:

    count = count + 1
    
 
    
    time_difference_seconds_outbound = 0
    if cdr['orig_sub'] is not None and cdr['orig_sub'] in total_time :
        if cdr['time_answer'] is not None:
                
            
            time_answer = datetime.fromtimestamp(int(cdr['time_answer']))
            time_release = datetime.fromtimestamp(int(cdr['time_release']))

            time_difference_outbound = time_release - time_answer
            time_difference_seconds_outbound = time_difference_outbound.total_seconds()
            
            
    

        
        

   
        if cdr['type'] == str(0):

            number_from = re.search(r'\d+', cdr['orig_from_uri']).group()
           
            
            data_inbound = {'user':cdr['orig_sub'] ,  'time':cdr['time_start'],'source':number_from,'destination':cdr['orig_to_user'],'duration':seconds_to_hms_string(float(cdr['duration'])),'Direction':'Outgoing'     }

            data_calls.append(data_inbound)



            

            total_time[cdr['orig_sub']] += int(cdr['time_talking'])
            
            total_timing_of_calls[cdr['orig_sub']]  += int(cdr['time_talking'])
            total_calls[cdr['orig_sub']]  += 1

 
            total_outbound_calls[cdr['orig_sub']] +=1
            total_outbound_time [cdr['orig_sub']]+= int(cdr['time_talking'])
            

            if max_outbound_time[cdr['orig_sub']] < time_difference_seconds_outbound:    
                max_outbound_time[cdr['orig_sub']] = time_difference_seconds_outbound

  
            


        elif cdr['type'] == str(3):
            total_time[cdr['orig_sub']] += int(cdr['time_talking'])
            total_timing_of_calls[cdr['orig_sub']] += int(cdr['time_talking'])
            total_calls[cdr['orig_sub']]  += 1
            # 
            total_outbound_calls[cdr['orig_sub']] +=1
            total_outbound_time [cdr['orig_sub']]+= int(cdr['time_talking'])
            
            



        
      
        time_answer =cdr['time_answer']
        if time_answer is None:

            outbound_missed[cdr['orig_sub']] +=1
            
            
        countright += 1
        




    elif cdr['orig_sub'] is None:
        if cdr['term_sub'] is not None and cdr['term_sub'] in total_time :
            if cdr['time_answer'] is not None:
            
                time_answer = datetime.fromtimestamp(int(cdr['time_answer']))
                time_release = datetime.fromtimestamp(int(cdr['time_release']))

                time_difference = time_release - time_answer
                time_difference_seconds = time_difference.total_seconds()

                
                time_start = datetime.fromtimestamp(int(cdr['time_start']))
                time_difference_ring = time_answer - time_start
                time_difference_seconds_ring = time_difference_ring.total_seconds()




            if cdr['type'] == str(3):
                total_time[cdr['term_sub']] += int(cdr['time_talking'])
                time_inbound_ring[cdr['term_sub']] += time_difference_seconds_ring

                #total_timing_of_calls[cdr['term_sub']] += int(cdr['time_talking'])
                total_calls[cdr['term_sub']]  += 1
                
                total_inbound_calls[cdr['term_sub']] +=1
           


                c2 = c2 + 1
                

            if cdr['type'] == str(0)  or cdr['type'] == '0':
            
                number_from = re.search(r'\d+', cdr['orig_from_uri']).group()
                data_outbound = {'user': cdr['term_sub'] , 'time':cdr['time_start'],'source':number_from,'destination':cdr['orig_to_user'],'duration':seconds_to_hms_string(float(cdr['duration'])),'Direction':'Incoming' }
                data_calls.append(data_outbound)



                total_time[cdr['term_sub']] += int(cdr['time_talking'])
                total_timing_of_calls[cdr['term_sub']] += int(cdr['time_talking'])
                time_inbound_ring[cdr['term_sub']] += time_difference_seconds_ring

                

            
                total_calls[cdr['term_sub']]  += 1
             
                c3 = c3 + 1


                

                if max_inbound_time[cdr['term_sub']] < time_difference_seconds:
                    max_inbound_time[cdr['term_sub']] = time_difference_seconds

                total_inbound_calls[cdr['term_sub']] +=1
                
                total_inbound_time [cdr['term_sub']]+=  int(cdr['time_talking'])

            elif cdr['type'] == str(2):
                inbound_missed[cdr['term_sub']] +=1
                
                

            
      
            countleft += 1
            
        else:

            c+=1
            # print("")
            # print("outbound: ",cdr['orig_sub'], " inbound:" ,cdr['term_sub'],"type: ",cdr['type'], cdr['cdr_id'])


    else:
        # print("outbound: ",cdr['orig_sub'], " inbound:" ,cdr['term_sub'],"type: ",cdr['type'], cdr['cdr_id'])

    
        c1 +=1
    # print("outbound: ",cdr['orig_sub'], " inbound:" ,cdr['term_sub'],"type: ",cdr['type'], cdr['cdr_id'])


for key, value in total_timing_of_calls.items():
    if total_inbound_calls[key] !=0 and total_outbound_calls[key] !=0:
            
        avg_inbound_talk_time[key] = total_inbound_time[key] / total_inbound_calls[key]
        avg_outbound_talk_time[key] = total_outbound_time[key] / total_outbound_calls[key]



for key, value in total_inbound_time.items():
    total_inbound_time['Total'] = float(total_inbound_time[key])
    
print("\n\n\n\n\n\n\n\n")

    



     



for key, value in total_inbound_time.items():    
    total_inbound_time[key] = seconds_to_hms_string(value)


    






for key, value in total_outbound_time.items():
    total_outbound_time[key] = seconds_to_hms_string(value)

        




for key, value in time_inbound_ring.items():
    if total_inbound_calls[key] !=0:
        incoming_avg_ring [key] = time_inbound_ring[key] / total_inbound_calls[key]




for key, value in incoming_avg_ring.items():
    incoming_avg_ring [key] = seconds_to_hms_string(value)
    

    







for key, value in avg_inbound_talk_time.items():
    avg_inbound_talk_time[key] = seconds_to_hms_string(value)
        







for key, value in avg_outbound_talk_time.items():
    avg_outbound_talk_time[key] = seconds_to_hms_string(value)
        

    


        




total_time_of_talking = {}

for key, value in total_timing_of_calls.items():
    
    total_timing_of_calls[key] = seconds_to_hms_string(value)
    
    total_time_of_talking[key]  = value
        









for key, value in max_outbound_time.items():
    max_outbound_time[key] = seconds_to_hms_string(value)
        




 
for key, value in max_inbound_time.items():
    max_inbound_time[key] = seconds_to_hms_string(value)
        



for key, value in total_inbound_calls.items():
    if total_calls[key] !=0:
        
        avg_inbound_time[key] =  round(total_inbound_calls[key] / total_calls[key], 1)

        
for key, value in total_outbound_calls.items():
    if total_calls[key] !=0:
        avg_outbound_time[key] = round(total_outbound_calls[key] / total_calls[key], 1)
        






for key,value in total_inbound_time.items():
    hours, minutes, seconds = value.split(':')
    accumulate_hours = float(hours) + (float(minutes)/60) + float(seconds)/3600


    if accumulate_hours > 0:
        avg_inbound_time[key] = round(total_inbound_calls[key] /  float(accumulate_hours),2) 
        






for key,value in total_outbound_time.items():
    hours, minutes, seconds = value.split(':')
    accumulate_hours = float(hours) + (float(minutes)/60) + float(seconds)/3600
    if accumulate_hours > 0:
        avg_outbound_time[key] = round(total_outbound_calls[key] /  float(accumulate_hours) ,2)



total = sum(value for key, value in avg_inbound_time.items() if key != 'Total')
avg_inbound_time['Total'] = total


total = sum(value for key, value in avg_outbound_time.items() if key != 'Total')
avg_outbound_time['Total'] = total

total = sum(value for key, value in total_inbound_calls.items() if key != 'Total')
total_inbound_calls['Total'] = total


total = sum(value for key, value in total_outbound_calls.items() if key != 'Total')
total_outbound_calls['Total'] = total

total = sum(value for key, value in total_calls.items() if key != 'Total')
total_calls['Total'] = total


total = sum(value for key, value in inbound_missed.items() if key != 'Total')
inbound_missed['Total'] = total

total = sum(value for key, value in outbound_missed.items() if key != 'Total')
outbound_missed['Total'] = total



total_time_inbound = timedelta()
for time_str in total_inbound_time.values():
    if time_str != '00:00:00':
        hours, minutes, seconds = map(int, time_str.split(':'))
        total_time_inbound += timedelta(hours=hours, minutes=minutes, seconds=seconds)
total_time_str = str(total_time_inbound)
total_inbound_time['Total'] = total_time_str



total_time_inbound_ring = timedelta()
for time_str in incoming_avg_ring.values():
    if time_str != '00:00:00':
        hours, minutes, seconds = map(int, time_str.split(':'))
        total_time_inbound_ring += timedelta(hours=hours, minutes=minutes, seconds=seconds)
total_time_str = str(total_time_inbound_ring)
incoming_avg_ring['Total'] = total_time_str




total_time_inbound_max = timedelta()
for time_str in max_inbound_time.values():
    if time_str != '00:00:00':
        hours, minutes, seconds = map(int, time_str.split(':'))
        total_time_inbound_max += timedelta(hours=hours, minutes=minutes, seconds=seconds)
total_time_str = str(total_time_inbound_max)
max_inbound_time['Total'] = total_time_str


total_time_outbound_max = timedelta()
for time_str in max_outbound_time.values():
    if time_str != '00:00:00':
        hours, minutes, seconds = map(int, time_str.split(':'))
        total_time_outbound_max += timedelta(hours=hours, minutes=minutes, seconds=seconds)
total_time_str = str(total_time_outbound_max)
max_outbound_time['Total'] = total_time_str





total_time_inbound_avg = timedelta()
for time_str in avg_inbound_talk_time.values():
    if time_str != '00:00:00':
        hours, minutes, seconds = map(int, time_str.split(':'))
        total_time_inbound_avg += timedelta(hours=hours, minutes=minutes, seconds=seconds)
total_time_str = str(total_time_inbound_avg)
avg_inbound_talk_time['Total'] = total_time_str



total_time_outbound_avg = timedelta()
for time_str in avg_outbound_talk_time.values():
    if time_str != '00:00:00':
        hours, minutes, seconds = map(int, time_str.split(':'))
        total_time_outbound_avg += timedelta(hours=hours, minutes=minutes, seconds=seconds)
total_time_str = str(total_time_outbound_avg)
avg_outbound_talk_time['Total'] = total_time_str







total_time_outbound = timedelta()
for time_str in total_outbound_time.values():
    if time_str != '00:00:00':
        hours, minutes, seconds = map(int, time_str.split(':'))
        total_time_outbound += timedelta(hours=hours, minutes=minutes, seconds=seconds)
total_time_str = str(total_time_outbound)
total_outbound_time['Total'] = total_time_str




total_time_talk = timedelta()
for time_str in total_timing_of_calls.values():
    if time_str != '00:00:00':
        hours, minutes, seconds = map(int, time_str.split(':'))
        total_time_talk += timedelta(hours=hours, minutes=minutes, seconds=seconds)
        
total_time_str = str(total_time_talk)
total_timing_of_calls['Total'] = total_time_str










# Extract and remove the 'Total' key-value pair
total_value = total_calls.pop('Total')
print("ad",total_time_of_talking)

# Sort the remaining dictionary based on values in ascending order
sorted_data = dict(sorted(total_time_of_talking.items(), key=lambda item: item[1], reverse=True))

# Add the 'Total' key-value pair back
sorted_data['Total'] = total_value

# Print the sorted dictionary
print(sorted_data)
total_calls['Total'] = total_value

new_users = []
for key in sorted_data:
    print(key)
    new_users.append(key)

print(total_time)

print(new_users)

with open(start_date_only + '.csv', 'w', newline='') as csvfile:
    fieldnames = ['Agent Name',  'Total Calls', 'Total Talk Time', 
                  'Incoming Total', 'Incoming Missed', 'Incoming Avg Per Hour', 
                  'Incoming  Talk Time', 'Incoming  Average Talk Time', 'Incoming Max Talk Time', 
                  'Incoming Average Ring Time', 'Outgoing Total', 'Outgoing Avg Per Hour', 'Outgoing Unanswered','Outgoing Answered',
                  'Outgoing Total Talk Time','Outgoing Avg Talk Time','Outgoing Max Talk Time',
                  ]

    writer = csv.DictWriter(csvfile, fieldnames=fieldnames)

    writer.writeheader()

    for user in new_users:
        writer.writerow({
            'Agent Name': name_agent[user],
            'Total Calls': total_calls[user],
            'Total Talk Time': total_timing_of_calls[user],
            'Incoming Total': total_inbound_calls[user],
            'Incoming Missed': inbound_missed[user],
            
            'Incoming Avg Per Hour': avg_inbound_time[user],

            'Incoming  Talk Time': total_inbound_time[user],
            'Incoming  Average Talk Time': avg_inbound_talk_time[user],
            
            'Incoming Max Talk Time': max_inbound_time[user],
        
            'Incoming Average Ring Time': incoming_avg_ring[user],
            

            'Outgoing Total': total_outbound_calls[user],
            'Outgoing Avg Per Hour': avg_outbound_time[user],
            

            
            'Outgoing Unanswered': outbound_missed[user],
            'Outgoing Answered' :str( int(total_outbound_calls [user]) - int( outbound_missed[user])),
            'Outgoing Total Talk Time': total_outbound_time[user],
            
            
            'Outgoing Avg Talk Time': avg_outbound_talk_time[user],
            
            
            
            'Outgoing Max Talk Time': max_outbound_time[user],
           
        })

import csv
import re
from datetime import datetime

def format_phone_number(number):
    # Convert the number to a string and remove any non-digit characters
    cleaned_number = re.sub(r'\D', '', str(number))

    # Check the length of the cleaned number
    length = len(cleaned_number)

    if length == 10:
        # Format as (XXX) XXX-XXXX for standard 10-digit US numbers
        return f"({cleaned_number[:3]}) {cleaned_number[3:6]}-{cleaned_number[6:]}"
    elif length == 11 and cleaned_number.startswith('1'):
        # Format as +1 (XXX) XXX-XXXX for 11-digit US numbers with country code 1
        return f"+1 ({cleaned_number[1:4]}) {cleaned_number[4:7]}-{cleaned_number[7:]}"
    elif length == 12 and cleaned_number.startswith('44'):
        # Example format for UK numbers: +44 (0XXX) XXX-XXXX
        return f"+{cleaned_number[:2]} ({cleaned_number[2:5]}) {cleaned_number[5:8]}-{cleaned_number[8:]}"
    elif length > 10:
        # Handle other international formats or long numbers
        # This is a more generic format and may not cover all cases
        country_code = cleaned_number[0:len(cleaned_number) - 10]
        local_number = cleaned_number[len(cleaned_number) - 10:]
        return f"+{country_code} ({local_number[:3]}) {local_number[3:6]}-{local_number[6:]}"
    else:
        # Return the cleaned number if it doesn't match expected lengths
        return cleaned_number

with open(start_date_only + '.csv', 'a', newline='') as csvfile:

    fieldnames1 = ['User','Date and Time',  'Source', 'Destination','Duration','Direction']
    writer = csv.DictWriter(csvfile, fieldnames=fieldnames1)
    writer.writerow({'User': '', 'Date and Time': '', 'Source': '', 'Destination': '', 'Duration': '', 'Direction': ''})

    writer.writerow({'User': '', 'Date and Time': '', 'Source': '', 'Destination': '', 'Duration': '', 'Direction': ''})


    writer.writeheader()
    for user in new_users:
            
        fieldnames2 = ['Agent Name',  'Total Calls', 'Total Talk Time', 
                'Incoming Total', 'Incoming Missed', 'Incoming Avg Per Hour', 
                'Incoming  Talk Time', 'Incoming  Average Talk Time', 'Incoming Max Talk Time', 
                'Incoming Average Ring Time', 'Outgoing Total', 'Outgoing Avg Per Hour', 'Outgoing Unanswered','Outgoing Answered',
                'Outgoing Total Talk Time','Outgoing Avg Talk Time','Outgoing Max Talk Time',
                ]
        writer.writerow({'User': '', 'Date and Time': '', 'Source': '', 'Destination': '', 'Duration': '', 'Direction': ''})



        writer2 = csv.DictWriter(csvfile, fieldnames=fieldnames2)
        writer2.writerow({'Agent Name':'Summary' + name_agent[user]})    
        writer2.writeheader()

        writer2.writerow({
            'Agent Name': name_agent[user],
            'Total Calls': total_calls[user],
            'Total Talk Time': total_timing_of_calls[user],
            'Incoming Total': total_inbound_calls[user],
            'Incoming Missed': inbound_missed[user],
            
            'Incoming Avg Per Hour': avg_inbound_time[user],

            'Incoming  Talk Time': total_inbound_time[user],
            'Incoming  Average Talk Time': avg_inbound_talk_time[user],
            
            'Incoming Max Talk Time': max_inbound_time[user],
        
            'Incoming Average Ring Time': incoming_avg_ring[user],
            

            'Outgoing Total': total_outbound_calls[user],
            'Outgoing Avg Per Hour': avg_outbound_time[user],
            

            
            'Outgoing Unanswered': outbound_missed[user],
            'Outgoing Answered' :str( int(total_outbound_calls [user]) - int( outbound_missed[user])),
            'Outgoing Total Talk Time': total_outbound_time[user],
            
            
            'Outgoing Avg Talk Time': avg_outbound_talk_time[user],
            
            
            
            'Outgoing Max Talk Time': max_outbound_time[user],
           
        })







        writer.writerow({'User': '', 'Date and Time': '', 'Source': '', 'Destination': '', 'Duration': '', 'Direction': ''})

        writer.writeheader()

       
        for data in data_calls:

            if data['user'] == user:
                
                writer.writerow({
                    'User':data['user'],
                    'Date and Time':datetime.fromtimestamp(int(data['time'])),
                    'Source': format_phone_number(data['source']),
                    'Destination': format_phone_number(data['destination']),
                    'Duration': data['duration'],
                    'Direction': data['Direction'],
                })





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
<th>Outgoing Answered</th><th>Outgoing Total Talk Time</th><th>Outgoing Avg Talk Time</th><th>Outgoing Max Talk Time</th></tr>
"""


# Add rows to the HTML body
for i, user in enumerate(new_users):
    row_color = "lightgrey" if i % 2 == 0 else "white"  # Alternate row color
    html_body += f"<tr style='background-color: {row_color};'>"
    html_body += f"<td>{name_agent[user]}</td>"
    html_body += f"<td>{total_calls[user]}</td>"
    html_body += f"<td>{total_timing_of_calls[user]}</td>"
    html_body += f"<td>{total_inbound_calls[user]}</td>"
    html_body += f"<td>{inbound_missed[user]}</td>"
    html_body += f"<td>{avg_inbound_time[user]}</td>"
    html_body += f"<td>{total_inbound_time[user]}</td>"
    html_body += f"<td>{avg_inbound_talk_time[user]}</td>"
    html_body += f"<td>{max_inbound_time[user]}</td>"
    html_body += f"<td>{incoming_avg_ring[user]}</td>"
    html_body += f"<td>{total_outbound_calls[user]}</td>"
    html_body += f"<td>{avg_outbound_time[user]}</td>"
    html_body += f"<td>{outbound_missed[user]}</td>"
    html_body += f"<td>{int(total_outbound_calls[user]) - int(outbound_missed[user])}</td>"
    html_body += f"<td>{total_outbound_time[user]}</td>"
    html_body += f"<td>{avg_outbound_talk_time[user]}</td>"
    html_body += f"<td>{max_outbound_time[user]}</td>"
    html_body += "</tr>\n"

html_body += """
</table>
</body>
</html>\n
"""














smtp_server = 'smtp.sendgrid.net'
smtp_port = 587
sender_email = 'noreply@atomip.uk'
receiver_email = 'fefurqan@gmail.com'
#receiver_email = 'atexace959@gmail.com'
#info@infusiontech.co.uk,
password = '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'

bcc_email  = 'abbasi.work22@gmail.com,support@atomip.co.uk'
message = MIMEMultipart()
message['From'] = sender_email
message['To'] = receiver_email
message['Subject'] = 'DAILY CONSORTIO AGENT SUMMARY'

message['Bcc'] = bcc_email

message.attach(MIMEText(html_body, 'html'))


filename = start_date_only+'.csv'  
attachment = open(filename, 'rb')

part = MIMEBase('application', 'octet-stream')
part.set_payload(attachment.read())
attachment.close()

encoders.encode_base64(part)

part.add_header(
    'Content-Disposition',
    f'attachment; filename= {filename}',
)

message.attach(part)

with smtplib.SMTP(smtp_server, smtp_port) as server:
    server.starttls()

    server.login('apikey', password)
    server.send_message(message)



print("Email sent successfully!")




exit(0)




    









