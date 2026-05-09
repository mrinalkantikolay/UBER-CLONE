#!/usr/bin/env python3
import json
import urllib.request
import urllib.parse
import time
import uuid
import mimetypes

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

def post_multipart(path, fields, files, token=None):
    boundary = '----WebKitFormBoundary' + uuid.uuid4().hex
    body = []
    for (k, v) in fields.items():
        body.append(f'--{boundary}')
        body.append(f'Content-Disposition: form-data; name="{k}"')
        body.append('')
        body.append(str(v))
    for (k, filename, content) in files:
        body.append(f'--{boundary}')
        body.append(f'Content-Disposition: form-data; name="{k}"; filename="{filename}"')
        ctype = mimetypes.guess_type(filename)[0] or 'application/octet-stream'
        body.append(f'Content-Type: {ctype}')
        body.append('')
        if isinstance(content, bytes):
            body.append(content)
        else:
            body.append(content.encode())
    body.append(f'--{boundary}--')
    body_bytes = b''
    for part in body:
        if isinstance(part, str):
            body_bytes += part.encode() + b'\r\n'
        else:
            body_bytes += part + b'\r\n'
    headers = {'Content-Type': f'multipart/form-data; boundary={boundary}'}
    req = urllib.request.Request(BASE+path, data=body_bytes, headers=headers)
    if token:
        req.add_header('Authorization', f'Bearer {token}')
    with urllib.request.urlopen(req) as resp:
        return json.load(resp)


def main():
    email = f'test.driver+{int(time.time())}@example.com'
    password = 'Password123!'
    print('EMAIL=', email)
    try:
        print('\n1) SIGNUP')
        signup = post_json('/auth/signup', {'name': 'Test Driver', 'email': email, 'password': password})
        print(json.dumps(signup, indent=2))
        token = signup.get('data', {}).get('accessToken')
        if not token:
            print('No accessToken found; aborting.')
            return
        print('\nTOKEN:', token[:20] + '...')

        print('\n2) REGISTER DRIVER')
        vehicle_number = f"ABC{int(time.time()) % 100000}"
        license_number = f"LIC{uuid.uuid4().hex[:8]}"
        reg = post_json('/drivers/register', {'vehicleNumber': vehicle_number, 'licenseNumber': license_number}, token=token)
        print(json.dumps(reg, indent=2))

        print('\n3) GET /drivers/me')
        me = get_json('/drivers/me', token=token)
        print(json.dumps(me, indent=2))

        print('\n4) GET /drivers/documents')
        docs = get_json('/drivers/documents', token=token)
        print(json.dumps(docs, indent=2))

        print('\n5) GET /rides/history')
        rides = get_json('/rides/history?limit=5', token=token)
        print(json.dumps(rides, indent=2))

        print('\n6) UPLOAD DOCUMENT (multipart)')
        try:
            # send a small PDF (valid MIME) so the upload middleware accepts it
            pdf_bytes = b'%PDF-1.4\n%EOF\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF'
            upload = post_multipart('/drivers/documents', {'type': 'Driver License'}, [('document', 'test.pdf', pdf_bytes)], token=token)
            print(json.dumps(upload, indent=2))
        except Exception as e:
            try:
                import urllib.error
                if isinstance(e, urllib.error.HTTPError):
                    body = e.read().decode()
                    print('Upload HTTPError:', e.code, body)
                else:
                    print('Upload failed:', e)
            except Exception:
                print('Upload failed:', e)

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
