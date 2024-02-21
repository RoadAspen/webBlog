import requests

qrcode_url = ''
params = {
    'appid': 'wx2421b1c4370ec43b',
    'fun': 'new',
    'lang': 'zh_CN',
    '_': '时间戳',
}

response = requests.get(qrcode_url,params=params)

qrcode = response.content.decode('utf-8').split('"')[1]
print("获取到的二维码",qrcode)