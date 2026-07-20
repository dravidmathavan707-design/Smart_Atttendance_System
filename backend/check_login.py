import requests
payload = {"institution_id": 2, "email": "dravidmathavan707@gmail.com", "password": "DM.dravid"}
r = requests.post("http://127.0.0.1:8000/auth/staff/login", json=payload, timeout=10)
print("STATUS", r.status_code)
print(r.text)
