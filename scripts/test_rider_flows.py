#!/usr/bin/env python3
import json
import urllib.request
import urllib.parse
import time
import uuid

BASE = 'http://localhost:8000/api'

def post_json(path, payload, token=None):
    data = json.dumps(payload).encode()
    req = urllib.request.Request(BASE+path, data=data, headers={'Content-Type':'application/json'})
    if token:
        req.add_header('Authorization', f'Bearer {token}')
    with urllib.request.urlopen(req) as resp:
        return json.load(resp)


def get_json(path, token=None):
    req = urllib.request.Request(BASE+path, headers={'Accept':'application/json'})
    if token:
        req.add_header('Authorization', f'Bearer {token}')
    with urllib.request.urlopen(req) as resp:
        return json.load(resp)


def main():
    email = f'test.rider+{int(time.time())}@example.com'
    password = 'Password123!'
    print('EMAIL=', email)
    try:
        print('\n1) SIGNUP')
        signup = post_json('/auth/signup', {'name': 'Test Rider', 'email': email, 'password': password})
        print(json.dumps(signup, indent=2))
        token = signup.get('data', {}).get('accessToken')
        if not token:
            print('No accessToken found; aborting.')
            return
        print('\nTOKEN:', token[:20] + '...')

        print('\n2) CREATE RIDE')
        ride_payload = {
            'originLat': 37.7749,
            'originLng': -122.4194,
            'destLat': 37.7849,
            'destLng': -122.4094,
            'idempotencyKey': str(uuid.uuid4())
        }
        created = post_json('/rides', ride_payload, token=token)
        print(json.dumps(created, indent=2))

        print('\n3) GET /rides/active')
        active = get_json('/rides/active', token=token)
        print(json.dumps(active, indent=2))

        print('\n4) GET /rides/history')
        history = get_json('/rides/history?limit=5', token=token)
        print(json.dumps(history, indent=2))

    except urllib.error.HTTPError as e:
        try:
            body = e.read().decode()
            print('HTTPError:', e.code, body)
        except:
            print('HTTPError', e)
    except Exception as e:
        print('Error:', e)

if __name__ == '__main__':
    main()
